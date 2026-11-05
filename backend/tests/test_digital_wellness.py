import pytest
import pytest_asyncio
import uuid
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.db.session import Base, get_db
from app.models.users import User, UserRole
from app.core.security import get_password_hash, create_access_token

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture(scope="function")
async def test_db():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with session_factory() as session:
        yield session
        
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        
    await engine.dispose()

@pytest_asyncio.fixture
async def client(test_db):
    async def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_multi_user_device_registration_and_sync(client: AsyncClient, test_db: AsyncSession):
    # 1. Create two test students for multi-user isolation testing
    student1_id = uuid.uuid4()
    student2_id = uuid.uuid4()

    u1 = User(
        id=student1_id,
        email=f"test_student_1_{uuid.uuid4().hex[:6]}@campus.edu",
        password_hash=get_password_hash("StudentPass123!"),
        role=UserRole.STUDENT,
        full_name="Student One",
        is_active=True
    )
    u2 = User(
        id=student2_id,
        email=f"test_student_2_{uuid.uuid4().hex[:6]}@campus.edu",
        password_hash=get_password_hash("StudentPass123!"),
        role=UserRole.STUDENT,
        full_name="Student Two",
        is_active=True
    )
    test_db.add_all([u1, u2])
    await test_db.commit()

    token1 = create_access_token(subject=str(u1.id), role="STUDENT", email=u1.email)
    token2 = create_access_token(subject=str(u2.id), role="STUDENT", email=u2.email)

    h1 = {"Authorization": f"Bearer {token1}"}
    h2 = {"Authorization": f"Bearer {token2}"}

    # 2. Register Device A for Student 1 (Windows Laptop)
    reg_payload_1 = {
        "device_identifier": f"win-hw-{uuid.uuid4()}",
        "device_name": "Student 1 ThinkPad",
        "platform": "windows",
        "os_version": "Windows 11 Pro 23H2",
        "agent_version": "2.0.0"
    }
    resp = await client.post("/api/v1/devices/register", json=reg_payload_1, headers=h1)
    assert resp.status_code == 201, resp.text
    data1 = resp.json()
    device1_id = data1["device_id"]
    device1_token = data1["device_token"]
    assert device1_token.startswith("mgd_")

    # 3. Register Device B for Student 1 (Browser Extension) -> Multi-device support
    reg_payload_ext = {
        "device_identifier": f"chrome-ext-{uuid.uuid4()}",
        "device_name": "Chrome on ThinkPad",
        "platform": "browser_extension",
        "agent_version": "1.0.0"
    }
    resp_ext = await client.post("/api/v1/devices/register", json=reg_payload_ext, headers=h1)
    assert resp_ext.status_code == 201
    device_ext_id = resp_ext.json()["device_id"]

    # 4. Verify Student 1 has 2 connected devices
    list_resp = await client.get("/api/v1/devices", headers=h1)
    assert list_resp.status_code == 200
    devices_s1 = list_resp.json()
    assert len(devices_s1) == 2
    d_ids = [d["id"] for d in devices_s1]
    assert device1_id in d_ids
    assert device_ext_id in d_ids

    # 5. Cross-user isolation: Student 2 has 0 devices and CANNOT view or access Student 1 devices
    list_s2 = await client.get("/api/v1/devices", headers=h2)
    assert list_s2.status_code == 200
    assert len(list_s2.json()) == 0

    # Attempt to delete Student 1 device as Student 2 -> must return 404
    del_resp = await client.delete(f"/api/v1/devices/{device1_id}", headers=h2)
    assert del_resp.status_code == 404

    # 6. Synchronize telemetry via Device Token header (No browser credentials required)
    sync_headers = {"X-Device-Token": device1_token}
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    now_iso = datetime.now(timezone.utc).isoformat()
    past_iso = (datetime.now(timezone.utc) - timedelta(minutes=45)).isoformat()

    telemetry_payload = {
        "date": today_str,
        "sessions": [
            {
                "start_time": past_iso,
                "end_time": now_iso,
                "active_seconds": 2400,  # 40 mins active
                "idle_seconds": 300,     # 5 mins idle
                "locked_seconds": 0,
                "total_awake_seconds": 2700,
                "idempotency_key": f"sess-{uuid.uuid4()}"
            }
        ],
        "apps": [
            {
                "app_name": "Visual Studio Code",
                "app_identifier": "code.exe",
                "category": "Programming",
                "foreground_seconds": 1800,  # 30 mins
                "launch_count": 4,
                "icon_hint": "code"
            },
            {
                "app_name": "Google Chrome",
                "app_identifier": "chrome.exe",
                "category": "Education",
                "foreground_seconds": 600,   # 10 mins
                "launch_count": 2,
                "icon_hint": "globe"
            }
        ],
        "web": [
            {
                "domain": "github.com",
                "browser_name": "Chrome",
                "active_duration_seconds": 450,
                "visit_count": 5,
                "category": "Programming"
            }
        ],
        "notifications": [
            {
                "app_name": "Slack",
                "app_identifier": "slack.exe",
                "notification_count": 8,
                "hourly_distribution": [0]*10 + [3, 5] + [0]*12
            }
        ]
    }

    sync_resp = await client.post(
        f"/api/v1/devices/{device1_id}/sync",
        json=telemetry_payload,
        headers=sync_headers
    )
    assert sync_resp.status_code == 200, sync_resp.text
    assert sync_resp.json()["status"] == "success"
    assert sync_resp.json()["records_ingested"]["apps"] == 2
    assert sync_resp.json()["records_ingested"]["web"] == 1

    # 7. Verify Overview Analytics returns strictly authentic calculated values
    overview_resp = await client.get("/api/v1/digital-wellness/overview", headers=h1)
    assert overview_resp.status_code == 200
    overview = overview_resp.json()
    assert overview["has_data"] is True
    assert overview["active_screen_minutes"] == 40
    assert overview["idle_minutes"] == 5
    assert overview["apps_count"] == 2
    assert overview["websites_count"] == 1
    assert overview["notifications_count"] == 8

    # 8. Verify Application Analytics
    app_resp = await client.get("/api/v1/digital-wellness/applications", headers=h1)
    assert app_resp.status_code == 200
    app_data = app_resp.json()
    assert app_data["has_data"] is True
    assert len(app_data["applications"]) == 2
    assert app_data["applications"][0]["app_name"] == "Visual Studio Code"
    assert app_data["applications"][0]["minutes"] == 30

    # 9. Verify Website Analytics
    web_resp = await client.get("/api/v1/digital-wellness/websites", headers=h1)
    assert web_resp.status_code == 200
    web_data = web_resp.json()
    assert web_data["has_data"] is True
    assert len(web_data["websites"]) == 1
    assert web_data["websites"][0]["domain"] == "github.com"

    # 10. Verify Notification Analytics
    notif_resp = await client.get("/api/v1/digital-wellness/notifications", headers=h1)
    assert notif_resp.status_code == 200
    notif_data = notif_resp.json()
    assert notif_data["has_data"] is True
    assert notif_data["total_notifications"] == 8

    # 11. Verify Search Privacy Consent: search queries are disabled by default
    search_resp = await client.get("/api/v1/digital-wellness/searches", headers=h1)
    assert search_resp.status_code == 200
    assert search_resp.json()["consent_enabled"] is False

    # Enable search consent explicitly
    consent_update = await client.put(
        "/api/v1/digital-wellness/consent",
        json={"search_tracking_enabled": True},
        headers=h1
    )
    assert consent_update.status_code == 200
    assert consent_update.json()["search_tracking_enabled"] is True

    # Now sync an academic search query
    search_sync = await client.post(
        f"/api/v1/devices/{device1_id}/sync",
        json={
            "date": today_str,
            "searches": [
                {
                    "search_engine": "DuckDuckGo",
                    "query_text": "graph neural networks survey arxiv",
                    "category": "Academic"
                }
            ]
        },
        headers=sync_headers
    )
    assert search_sync.status_code == 200
    assert search_sync.json()["records_ingested"]["searches"] == 1

    # Check search queries visible to Student 1
    search_after = await client.get("/api/v1/digital-wellness/searches", headers=h1)
    assert search_after.status_code == 200
    assert search_after.json()["consent_enabled"] is True
    assert len(search_after.json()["searches"]) == 1
    assert search_after.json()["searches"][0]["query"] == "graph neural networks survey arxiv"

    # Student 2 CANNOT see Student 1's search query (isolation)
    search_s2 = await client.get("/api/v1/digital-wellness/searches", headers=h2)
    assert search_s2.json()["consent_enabled"] is False

    # 12. Test Data Export & Deletion
    export_resp = await client.get("/api/v1/digital-wellness/export", headers=h1)
    assert export_resp.status_code == 200
    assert "applications" in export_resp.json()
    assert len(export_resp.json()["applications"]) >= 2

    # Purge all student data
    purge_resp = await client.delete("/api/v1/digital-wellness/data", headers=h1)
    assert purge_resp.status_code == 200

    # Verify Overview has 0 data after purge
    overview_post_purge = await client.get("/api/v1/digital-wellness/overview", headers=h1)
    assert overview_post_purge.json()["has_data"] is False
    assert overview_post_purge.json()["active_screen_minutes"] == 0
