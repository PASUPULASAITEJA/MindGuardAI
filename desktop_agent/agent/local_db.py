import sqlite3
import json
import uuid
import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

class LocalStorage:
    """
    Local SQLite database engine for desktop monitoring.
    Maintains offline events, sync queues, and authentic aggregates.
    """
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=5.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cur = conn.cursor()

            # 1. Sync Queue for robust offline collection
            cur.execute("""
                CREATE TABLE IF NOT EXISTS sync_queue (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_type TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    idempotency_key TEXT UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_synced INTEGER DEFAULT 0,
                    retry_count INTEGER DEFAULT 0,
                    last_error TEXT
                )
            """)

            # 2. Local daily app aggregates
            cur.execute("""
                CREATE TABLE IF NOT EXISTS local_daily_apps (
                    date TEXT NOT NULL,
                    app_identifier TEXT NOT NULL,
                    app_name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    foreground_seconds INTEGER DEFAULT 0,
                    launch_count INTEGER DEFAULT 1,
                    icon_hint TEXT,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (date, app_identifier)
                )
            """)

            # 3. Local daily web aggregates (received from browser extension)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS local_daily_web (
                    date TEXT NOT NULL,
                    domain TEXT NOT NULL,
                    browser_name TEXT NOT NULL,
                    active_seconds INTEGER DEFAULT 0,
                    visit_count INTEGER DEFAULT 1,
                    category TEXT NOT NULL,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (date, domain)
                )
            """)

            # 4. Search queries (strictly if consented)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS local_searches (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date TEXT NOT NULL,
                    engine TEXT NOT NULL,
                    query_text TEXT NOT NULL,
                    category TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 5. Session state
            cur.execute("""
                CREATE TABLE IF NOT EXISTS session_state (
                    key TEXT PRIMARY KEY,
                    value TEXT
                )
            """)
            conn.commit()

    def record_app_foreground(
        self, date_str: str, app_name: str, app_identifier: str, category: str, seconds: int, is_new_launch: bool = False
    ):
        """Accumulates authentic foreground usage for an application."""
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO local_daily_apps (date, app_identifier, app_name, category, foreground_seconds, launch_count)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(date, app_identifier) DO UPDATE SET
                    foreground_seconds = foreground_seconds + excluded.foreground_seconds,
                    launch_count = launch_count + (CASE WHEN ? THEN 1 ELSE 0 END),
                    last_updated = CURRENT_TIMESTAMP
            """, (date_str, app_identifier, app_name, category, seconds, 1 if is_new_launch else 0, is_new_launch))
            conn.commit()

    def record_web_visit(
        self, date_str: str, domain: str, browser_name: str, seconds: int, category: str = "General", is_new_visit: bool = False
    ):
        """Accumulates authentic domain-level active browsing duration."""
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO local_daily_web (date, domain, browser_name, active_seconds, visit_count, category)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(date, domain) DO UPDATE SET
                    active_seconds = active_seconds + excluded.active_seconds,
                    visit_count = visit_count + (CASE WHEN ? THEN 1 ELSE 0 END),
                    last_updated = CURRENT_TIMESTAMP
            """, (date_str, domain, browser_name, seconds, 1 if is_new_visit else 0, category, is_new_visit))
            conn.commit()

    def record_search_query(self, date_str: str, engine: str, query_text: str, category: str = "Academic"):
        """Records consented search query locally."""
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO local_searches (date, engine, query_text, category)
                VALUES (?, ?, ?, ?)
            """, (date_str, engine, query_text, category))
            conn.commit()

    def enqueue_sync_batch(self, event_type: str, payload: Dict[str, Any], idempotency_key: Optional[str] = None) -> str:
        key = idempotency_key or f"evt_{uuid.uuid4()}"
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT OR IGNORE INTO sync_queue (event_type, payload_json, idempotency_key)
                VALUES (?, ?, ?)
            """, (event_type, json.dumps(payload), key))
            conn.commit()
        return key

    def get_pending_sync_items(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, event_type, payload_json, idempotency_key, retry_count
                FROM sync_queue
                WHERE is_synced = 0
                ORDER BY id ASC
                LIMIT ?
            """, (limit,))
            rows = cur.fetchall()
            return [
                {
                    "id": r["id"],
                    "event_type": r["event_type"],
                    "payload": json.loads(r["payload_json"]),
                    "idempotency_key": r["idempotency_key"],
                    "retry_count": r["retry_count"]
                }
                for r in rows
            ]

    def mark_items_synced(self, item_ids: List[int]):
        if not item_ids:
            return
        with self._get_connection() as conn:
            cur = conn.cursor()
            placeholders = ",".join("?" for _ in item_ids)
            cur.execute(f"""
                UPDATE sync_queue
                SET is_synced = 1
                WHERE id IN ({placeholders})
            """, item_ids)
            # Prune completed synced items older than 7 days
            cur.execute("""
                DELETE FROM sync_queue
                WHERE is_synced = 1 AND created_at < datetime('now', '-7 days')
            """)
            conn.commit()

    def record_sync_failure(self, item_id: int, error_msg: str):
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                UPDATE sync_queue
                SET retry_count = retry_count + 1, last_error = ?
                WHERE id = ?
            """, (error_msg, item_id))
            conn.commit()

    def get_daily_app_aggregates(self, date_str: str) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT app_identifier, app_name, category, foreground_seconds, launch_count, icon_hint
                FROM local_daily_apps
                WHERE date = ?
                ORDER BY foreground_seconds DESC
            """, (date_str,))
            return [dict(r) for r in cur.fetchall()]

    def get_daily_web_aggregates(self, date_str: str) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT domain, browser_name, active_seconds, visit_count, category
                FROM local_daily_web
                WHERE date = ?
                ORDER BY active_seconds DESC
            """, (date_str,))
            return [dict(r) for r in cur.fetchall()]

    def get_unflushed_searches(self, date_str: str) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, engine, query_text, category, timestamp
                FROM local_searches
                WHERE date = ?
            """, (date_str,))
            return [dict(r) for r in cur.fetchall()]
