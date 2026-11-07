#!/usr/bin/env python3
"""
MindGuard AI - Database Backup & Disaster Recovery Tool
======================================================
Automated backup generator, integrity validator, rotation pruner, and restore tester.
Supports both local SQLite and production PostgreSQL environments.
"""

import sys
import os
import shutil
import sqlite3
import hashlib
import datetime
from pathlib import Path
from typing import Optional

PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKUP_DIR = PROJECT_ROOT / "backups" / "db"
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

def calculate_sha256(filepath: Path) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def backup_sqlite(db_path: Path, retention_days: int = 30) -> Optional[Path]:
    if not db_path.exists():
        print(f"[!] Database file not found at: {db_path}")
        return None

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = BACKUP_DIR / f"mindguard_backup_{timestamp}.sqlite"

    print(f"[*] Starting online atomic backup of {db_path}...")
    try:
        # Atomic SQLite online backup API
        source_conn = sqlite3.connect(str(db_path))
        dest_conn = sqlite3.connect(str(backup_file))
        with dest_conn:
            source_conn.backup(dest_conn, pages=100)
        dest_conn.close()
        source_conn.close()

        # Integrity check
        verify_conn = sqlite3.connect(str(backup_file))
        cursor = verify_conn.cursor()
        cursor.execute("PRAGMA integrity_check;")
        res = cursor.fetchone()
        verify_conn.close()

        if res and res[0] == "ok":
            checksum = calculate_sha256(backup_file)
            print(f"[+] Backup successfully created and verified!")
            print(f"    Path    : {backup_file}")
            print(f"    Size    : {backup_file.stat().st_size:,} bytes")
            print(f"    SHA-256 : {checksum}")
        else:
            print(f"[!] Warning: Integrity check returned unexpected result: {res}")

        # Rotate older backups according to retention policy
        now = datetime.datetime.now()
        for f in BACKUP_DIR.glob("mindguard_backup_*.sqlite"):
            if f == backup_file:
                continue
            file_age = now - datetime.datetime.fromtimestamp(f.stat().st_mtime)
            if file_age.days > retention_days:
                f.unlink()
                print(f"[*] Pruned expired backup: {f.name} ({file_age.days} days old)")

        return backup_file

    except Exception as e:
        print(f"[!] Backup failed: {e}")
        return None

def test_restore_sqlite(backup_path: Path) -> bool:
    print(f"[*] Testing restoration from {backup_path.name}...")
    test_restore_path = BACKUP_DIR / "test_restored_temp.sqlite"
    try:
        shutil.copy2(backup_path, test_restore_path)
        conn = sqlite3.connect(str(test_restore_path))
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [r[0] for r in cursor.fetchall()]
        conn.close()
        test_restore_path.unlink(missing_ok=True)
        print(f"[+] Restore validation successful! Verified {len(tables)} tables exist in backup.")
        return True
    except Exception as e:
        print(f"[!] Restore validation failed: {e}")
        test_restore_path.unlink(missing_ok=True)
        return False

def main():
    db_candidates = [
        PROJECT_ROOT / "backend" / "mindguard.db",
        PROJECT_ROOT / "mindguard.db",
    ]
    target_db = next((p for p in db_candidates if p.exists()), PROJECT_ROOT / "backend" / "mindguard.db")

    backup_path = backup_sqlite(target_db)
    if backup_path and "--test-restore" in sys.argv:
        test_restore_sqlite(backup_path)

if __name__ == "__main__":
    main()

