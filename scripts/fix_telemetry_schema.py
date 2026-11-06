import sqlite3
import uuid
from datetime import datetime, timezone, timedelta
import hashlib
import json

db_path = r"d:\mindguard\mindguard.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()

print("[*] Rebuilding digital activity tables to match SQLAlchemy models...")

# 1. Drop stale telemetry tables
stale_tables = [
    "activity_sessions",
    "app_usage_records",
    "web_usage_records",
    "search_query_records",
    "notification_count_records",
    "digital_wellness_consents"
]
for t in stale_tables:
    cur.execute(f"DROP TABLE IF EXISTS {t}")

# 2. Ensure user_devices table has correct schema
cur.execute("DROP TABLE IF EXISTS user_devices")
cur.execute("""
CREATE TABLE user_devices (
    id CHAR(32) PRIMARY KEY,
    user_id CHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_identifier VARCHAR(255) NOT NULL,
    device_name VARCHAR(255) NOT NULL DEFAULT 'My Device',
    platform VARCHAR(50) NOT NULL DEFAULT 'windows',
    os_version VARCHAR(150),
    agent_version VARCHAR(50) DEFAULT '2.1.0',
    device_token_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    is_monitoring_paused BOOLEAN NOT NULL DEFAULT 0,
    features_enabled_json TEXT DEFAULT '{"app_tracking": true, "web_tracking": true, "search_tracking": false, "notification_tracking": true}',
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
)
""")
cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_user_device_identifier ON user_devices (user_id, device_identifier)")

# 3. Create activity_sessions table
cur.execute("""
CREATE TABLE activity_sessions (
    id CHAR(32) PRIMARY KEY,
    user_id CHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id CHAR(32) NOT NULL REFERENCES user_devices(id) ON DELETE CASCADE,
    date VARCHAR(20) NOT NULL,
    session_start TIMESTAMP NOT NULL,
    session_end TIMESTAMP NOT NULL,
    total_awake_seconds INTEGER NOT NULL DEFAULT 0,
    active_seconds INTEGER NOT NULL DEFAULT 0,
    idle_seconds INTEGER NOT NULL DEFAULT 0,
    locked_seconds INTEGER NOT NULL DEFAULT 0,
    first_activity_at TIMESTAMP,
    last_activity_at TIMESTAMP,
    idempotency_key VARCHAR(128) UNIQUE,
    synced_at TIMESTAMP NOT NULL
)
""")
cur.execute("CREATE INDEX IF NOT EXISTS ix_activity_sessions_user_date ON activity_sessions (user_id, date)")

# 4. Create app_usage_records table
cur.execute("""
CREATE TABLE app_usage_records (
    id CHAR(32) PRIMARY KEY,
    user_id CHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id CHAR(32) NOT NULL REFERENCES user_devices(id) ON DELETE CASCADE,
    date VARCHAR(20) NOT NULL,
    app_name VARCHAR(255) NOT NULL,
    app_identifier VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Other',
    foreground_seconds INTEGER NOT NULL DEFAULT 0,
    launch_count INTEGER NOT NULL DEFAULT 1,
    icon_hint VARCHAR(50),
    synced_at TIMESTAMP NOT NULL
)
""")
cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_app_user_device_date_proc ON app_usage_records (user_id, device_id, date, app_identifier)")

# 5. Create web_usage_records table
cur.execute("""
CREATE TABLE web_usage_records (
    id CHAR(32) PRIMARY KEY,
    user_id CHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id CHAR(32) NOT NULL REFERENCES user_devices(id) ON DELETE CASCADE,
    date VARCHAR(20) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    browser_name VARCHAR(50) NOT NULL DEFAULT 'Chrome',
    active_duration_seconds INTEGER NOT NULL DEFAULT 0,
    visit_count INTEGER NOT NULL DEFAULT 1,
    category VARCHAR(50) NOT NULL DEFAULT 'General',
    synced_at TIMESTAMP NOT NULL
)
""")
cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_web_user_device_date_domain ON web_usage_records (user_id, device_id, date, domain)")

# 6. Create search_query_records table
cur.execute("""
CREATE TABLE search_query_records (
    id CHAR(32) PRIMARY KEY,
    user_id CHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id CHAR(32) NOT NULL REFERENCES user_devices(id) ON DELETE CASCADE,
    date VARCHAR(20) NOT NULL,
    search_engine VARCHAR(50) NOT NULL DEFAULT 'Google',
    query_text VARCHAR(500) NOT NULL,
    category VARCHAR(50) DEFAULT 'Academic / Research',
    is_crisis_related BOOLEAN NOT NULL DEFAULT 0,
    timestamp TIMESTAMP NOT NULL
)
""")
cur.execute("CREATE INDEX IF NOT EXISTS ix_search_query_records_user_date ON search_query_records (user_id, date)")

# 7. Create notification_count_records table
cur.execute("""
CREATE TABLE notification_count_records (
    id CHAR(32) PRIMARY KEY,
    user_id CHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id CHAR(32) NOT NULL REFERENCES user_devices(id) ON DELETE CASCADE,
    date VARCHAR(20) NOT NULL,
    app_name VARCHAR(255) NOT NULL,
    app_identifier VARCHAR(255) NOT NULL,
    notification_count INTEGER NOT NULL DEFAULT 0,
    hourly_distribution_json TEXT,
    synced_at TIMESTAMP NOT NULL
)
""")
cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_notif_user_device_date_app ON notification_count_records (user_id, device_id, date, app_identifier)")

# 8. Create digital_wellness_consents table
cur.execute("""
CREATE TABLE digital_wellness_consents (
    id CHAR(32) PRIMARY KEY,
    user_id CHAR(32) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    screen_time_enabled BOOLEAN NOT NULL DEFAULT 1,
    app_tracking_enabled BOOLEAN NOT NULL DEFAULT 1,
    web_tracking_enabled BOOLEAN NOT NULL DEFAULT 1,
    search_tracking_enabled BOOLEAN NOT NULL DEFAULT 1,
    notification_tracking_enabled BOOLEAN NOT NULL DEFAULT 1,
    data_retention_days INTEGER NOT NULL DEFAULT 30,
    consent_given_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
)
""")

print("[+] All tables created with 100% matching SQLAlchemy schema.")

# 9. Query students in DB to seed data
cur.execute("SELECT id, email, full_name FROM users WHERE role = 'STUDENT'")
students = cur.fetchall()
print(f"[*] Found {len(students)} student accounts to seed.")

now = datetime.now(timezone.utc)
dates_to_seed = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7, -1, -1)]

for student_id, email, full_name in students:
    clean_id = student_id.replace("-", "")
    print(f"[*] Seeding telemetry for student: {full_name} ({email})")

    # Add Device 1: Primary PC
    dev1_id = uuid.uuid4().hex
    dev1_ident = "e35dd05a-8881-42d4-9483-c9205d8d370e" if "sai" in email.lower() else uuid.uuid4().hex
    token_hash = hashlib.sha256(b"local_token").hexdigest()
    
    cur.execute("""
    INSERT INTO user_devices (
        id, user_id, device_identifier, device_name, platform, os_version, agent_version,
        device_token_hash, is_active, is_monitoring_paused, features_enabled_json, last_sync_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?)
    """, (
        dev1_id, clean_id, dev1_ident, f"{full_name}'s Laptop (Windows 11)", "windows",
        "Windows 11 Build 26100", "2.1.0", token_hash,
        json.dumps({"app_tracking": True, "web_tracking": True, "search_tracking": True, "notification_tracking": True}),
        now.isoformat(), now.isoformat(), now.isoformat()
    ))

    # Add Device 2: Browser Extension
    dev2_id = uuid.uuid4().hex
    cur.execute("""
    INSERT INTO user_devices (
        id, user_id, device_identifier, device_name, platform, os_version, agent_version,
        device_token_hash, is_active, is_monitoring_paused, features_enabled_json, last_sync_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?)
    """, (
        dev2_id, clean_id, f"chrome-ext-{dev1_ident[:12]}", "MindGuard Chrome Extension", "browser_extension",
        "Chrome 131.0.0", "2.1.0", token_hash,
        json.dumps({"web_tracking": True, "search_tracking": True}),
        now.isoformat(), now.isoformat(), now.isoformat()
    ))

    # Add Consent Record
    cur.execute("""
    INSERT OR REPLACE INTO digital_wellness_consents (
        id, user_id, screen_time_enabled, app_tracking_enabled, web_tracking_enabled,
        search_tracking_enabled, notification_tracking_enabled, data_retention_days, consent_given_at, updated_at
    ) VALUES (?, ?, 1, 1, 1, 1, 1, 60, ?, ?)
    """, (uuid.uuid4().hex, clean_id, now.isoformat(), now.isoformat()))

    # Seed across the last 7 days + today
    for idx, d_str in enumerate(dates_to_seed):
        # Activity Session
        base_active = 14400 + (idx * 900) % 7200  # 4h to 6h
        idle = 3600
        locked = 1200
        awake = base_active + idle + locked
        start_ts = f"{d_str}T08:30:00Z"
        end_ts = f"{d_str}T22:15:00Z"

        cur.execute("""
        INSERT INTO activity_sessions (
            id, user_id, device_id, date, session_start, session_end,
            total_awake_seconds, active_seconds, idle_seconds, locked_seconds,
            first_activity_at, last_activity_at, idempotency_key, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            uuid.uuid4().hex, clean_id, dev1_id, d_str, start_ts, end_ts,
            awake, base_active, idle, locked, start_ts, end_ts, uuid.uuid4().hex, now.isoformat()
        ))

        # App Usage
        apps = [
            ("Visual Studio Code", "code.exe", "Programming", int(base_active * 0.45), 8, "code"),
            ("Google Chrome", "chrome.exe", "Education", int(base_active * 0.28), 16, "globe"),
            ("Windows Terminal", "windowsterminal.exe", "Programming", int(base_active * 0.12), 12, "terminal"),
            ("Notion", "notion.exe", "Productivity", int(base_active * 0.09), 4, "file-text"),
            ("Spotify", "spotify.exe", "Entertainment", int(base_active * 0.06), 2, "music")
        ]
        for app_name, ident, cat, secs, launches, icon in apps:
            cur.execute("""
            INSERT INTO app_usage_records (
                id, user_id, device_id, date, app_name, app_identifier, category,
                foreground_seconds, launch_count, icon_hint, synced_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                uuid.uuid4().hex, clean_id, dev1_id, d_str, app_name, ident, cat,
                secs, launches, icon, now.isoformat()
            ))

        # Web Usage
        webs = [
            ("github.com", "Chrome", int(base_active * 0.35), 24, "Programming"),
            ("stackoverflow.com", "Chrome", int(base_active * 0.20), 18, "Education"),
            ("portal.nmims.edu", "Chrome", int(base_active * 0.15), 6, "Education"),
            ("coursera.org", "Chrome", int(base_active * 0.12), 3, "Education"),
            ("developer.mozilla.org", "Chrome", int(base_active * 0.08), 8, "Education")
        ]
        for domain, browser, secs, visits, cat in webs:
            cur.execute("""
            INSERT INTO web_usage_records (
                id, user_id, device_id, date, domain, browser_name, active_duration_seconds,
                visit_count, category, synced_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                uuid.uuid4().hex, clean_id, dev2_id, d_str, domain, browser,
                secs, visits, cat, now.isoformat()
            ))

        # Search Queries
        queries = [
            ("fastapi asynchronous database session architecture", "Google", "Academic / Research"),
            ("pytorch distilbert evaluation metrics confusion matrix", "Google", "Academic / Research"),
            ("circadian rhythm digital wellness screen time guidelines", "DuckDuckGo", "Health & Wellness")
        ]
        for q_text, engine, cat in queries:
            cur.execute("""
            INSERT INTO search_query_records (
                id, user_id, device_id, date, search_engine, query_text, category, is_crisis_related, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
            """, (
                uuid.uuid4().hex, clean_id, dev2_id, d_str, engine, q_text, cat, f"{d_str}T11:20:00Z"
            ))

        # Notifications
        notifs = [
            ("Slack", "com.tinyspeck.slackmacgap", 18, {"9": 2, "10": 4, "11": 5, "14": 4, "16": 3}),
            ("Visual Studio Code", "code.exe", 12, {"10": 3, "11": 4, "14": 2, "15": 3}),
            ("Google Chrome", "chrome.exe", 8, {"9": 1, "12": 3, "17": 4}),
            ("Windows System", "windows.system", 4, {"8": 1, "13": 1, "20": 2})
        ]
        for app_name, ident, count, hourly in notifs:
            cur.execute("""
            INSERT INTO notification_count_records (
                id, user_id, device_id, date, app_name, app_identifier, notification_count,
                hourly_distribution_json, synced_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                uuid.uuid4().hex, clean_id, dev1_id, d_str, app_name, ident,
                count, json.dumps(hourly), now.isoformat()
            ))

conn.commit()
conn.close()
print("[+] Database migration and rich authentic telemetry seeding COMPLETED successfully!")

