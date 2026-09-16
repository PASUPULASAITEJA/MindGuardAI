import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.db.session import Base, get_db
from app.models.users import User, UserRole
from app.models.notifications import Notification, NotificationType, NotificationChannel
from app.core.security import get_password_hash, create_access_token
from app.repositories.notifications import notification_repository
from app.services.notification_service import notification_service, connection_manager

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
async def test_notification_repository_crud(test_db: AsyncSession):
    """Verify repository creation, querying, unread counting, and mark-read operations."""
    user_id = uuid4()
    user = User(
        id=user_id,
        email="student_notif@example.com",
        password_hash=get_password_hash("StudentPass123!"),
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add(user)
    await test_db.commit()

    # 1. Create notification
    notif = await notification_repository.create_notification(
        test_db,
        user_id=user_id,
        type=NotificationType.SYSTEM,
        title="Welcome to MindGuard",
        message="Your account is active.",
        channel=NotificationChannel.IN_APP
    )
    assert notif.id is not None
    assert notif.is_read is False
    assert notif.title == "Welcome to MindGuard"

    # 2. Query unread count
    unread = await notification_repository.get_unread_count(test_db, user_id)
    assert unread == 1

    # 3. Fetch list
    items = await notification_repository.get_for_user(test_db, user_id)
    assert len(items) == 1
    assert items[0].id == notif.id

    # 4. Mark single read
    updated = await notification_repository.mark_as_read(test_db, notif.id, user_id)
    assert updated is not None
    assert updated.is_read is True
    assert updated.read_at is not None

    unread_after = await notification_repository.get_unread_count(test_db, user_id)
    assert unread_after == 0

    # 5. Create multiple and test mark_all_read
    await notification_repository.create_notification(
        test_db,
        user_id=user_id,
        type=NotificationType.SESSION_REMINDER,
        title="Reminder 1",
        message="Session tomorrow",
        channel=NotificationChannel.IN_APP
    )
    await notification_repository.create_notification(
        test_db,
        user_id=user_id,
        type=NotificationType.SESSION_REMINDER,
        title="Reminder 2",
        message="Session next week",
        channel=NotificationChannel.IN_APP
    )

    count = await notification_repository.get_unread_count(test_db, user_id)
    assert count == 2

    marked = await notification_repository.mark_all_read_for_user(test_db, user_id)
    assert marked == 2

    count_zero = await notification_repository.get_unread_count(test_db, user_id)
    assert count_zero == 0


@pytest.mark.asyncio
async def test_notification_api_endpoints(client: AsyncClient, test_db: AsyncSession):
    """Verify GET /api/v1/notifications, PATCH /{id}/read, PUT /{id}/read, and POST /mark-all-read."""
    user_id = uuid4()
    user = User(
        id=user_id,
        email="api_student@example.com",
        password_hash=get_password_hash("StudentPass123!"),
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add(user)
    await test_db.commit()

    token = create_access_token(subject=str(user_id), role="STUDENT", email=user.email)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a test notification via POST /test
    create_res = await client.post(
        "/api/v1/notifications/test",
        headers=headers,
        json={
            "title": "Test Alert",
            "message": "This is a test notification",
            "type": "system",
            "channel": "in_app"
        }
    )
    assert create_res.status_code == 201
    created_data = create_res.json()
    notif_id = created_data["id"]
    assert created_data["title"] == "Test Alert"

    # 2. Retrieve notifications list
    get_res = await client.get("/api/v1/notifications", headers=headers)
    assert get_res.status_code == 200
    data = get_res.json()
    assert "items" in data
    assert "unread_count" in data
    assert data["unread_count"] == 1
    assert len(data["items"]) == 1

    # Also test mounted prefix /api/notifications
    alias_res = await client.get("/api/notifications", headers=headers)
    assert alias_res.status_code == 200
    assert alias_res.json()["unread_count"] == 1

    # 3. Mark single notification read via PATCH
    patch_res = await client.patch(f"/api/v1/notifications/{notif_id}/read", headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["is_read"] is True

    # Check unread count is now 0
    get_res2 = await client.get("/api/v1/notifications", headers=headers)
    assert get_res2.json()["unread_count"] == 0

    # 4. Create another and test legacy PUT /read
    notif2 = await notification_repository.create_notification(
        test_db,
        user_id=user_id,
        type=NotificationType.COUNSELOR_MESSAGE,
        title="Check in",
        message="How are you?",
        channel=NotificationChannel.IN_APP
    )
    put_res = await client.put(f"/api/v1/notifications/{notif2.id}/read", headers=headers)
    assert put_res.status_code == 200
    assert put_res.json()["is_read"] is True

    # 5. Create multiple and test POST /mark-all-read
    await notification_repository.create_notification(
        test_db,
        user_id=user_id,
        type=NotificationType.SYSTEM,
        title="Notice 1",
        message="Notice 1 body",
        channel=NotificationChannel.IN_APP
    )
    await notification_repository.create_notification(
        test_db,
        user_id=user_id,
        type=NotificationType.SYSTEM,
        title="Notice 2",
        message="Notice 2 body",
        channel=NotificationChannel.IN_APP
    )

    mark_all_res = await client.post("/api/v1/notifications/mark-all-read", headers=headers)
    assert mark_all_res.status_code == 200
    assert mark_all_res.json()["success"] is True
    assert mark_all_res.json()["marked_count"] >= 2
    assert mark_all_res.json()["unread_count"] == 0


@pytest.mark.asyncio
async def test_notify_high_risk_dispatches_to_counselors_and_student(test_db: AsyncSession):
    """Verify notify_high_risk automatically alerts all active counselors and provides gentle student check-in."""
    student_id = uuid4()
    counselor1_id = uuid4()
    counselor2_id = uuid4()

    student = User(
        id=student_id,
        email="student_hr@example.com",
        password_hash=get_password_hash("Pass123!"),
        role=UserRole.STUDENT,
        is_active=True
    )
    counselor1 = User(
        id=counselor1_id,
        email="counselor1@example.com",
        password_hash=get_password_hash("Pass123!"),
        role=UserRole.COUNSELOR,
        is_active=True
    )
    counselor2 = User(
        id=counselor2_id,
        email="counselor2@example.com",
        password_hash=get_password_hash("Pass123!"),
        role=UserRole.COUNSELOR,
        is_active=True
    )
    test_db.add_all([student, counselor1, counselor2])
    await test_db.commit()

    # Trigger high-risk notification dispatch
    await notification_service.notify_high_risk(
        test_db,
        student_id=student_id,
        student_email=student.email,
        risk_tier="HIGH",
        wellness_score=28.5
    )

    # 1. Verify counselor 1 received risk alert
    c1_notifs, c1_unread = await notification_service.get_user_notifications(test_db, counselor1_id)
    assert c1_unread == 1
    assert c1_notifs[0].type == NotificationType.RISK_ALERT
    assert c1_notifs[0].channel == NotificationChannel.BOTH
    assert "High Risk" in c1_notifs[0].title

    # 2. Verify counselor 2 received risk alert
    c2_notifs, c2_unread = await notification_service.get_user_notifications(test_db, counselor2_id)
    assert c2_unread == 1
    assert c2_notifs[0].type == NotificationType.RISK_ALERT

    # 3. Verify student received gentle supportive notification
    st_notifs, st_unread = await notification_service.get_user_notifications(test_db, student_id)
    assert st_unread == 1
    assert st_notifs[0].type == NotificationType.SYSTEM
    assert st_notifs[0].channel == NotificationChannel.IN_APP
    assert "Wellness Check-in" in st_notifs[0].title
    assert "counseling and self-care tools are always available" in st_notifs[0].message


@pytest.mark.asyncio
async def test_websocket_connection_manager_behavior():
    """Verify WebSocketConnectionManager methods function cleanly without error."""
    user_id = uuid4()

    class MockWebSocket:
        def __init__(self):
            self.accepted = False
            self.sent = []

        async def accept(self):
            self.accepted = True

        async def send_json(self, data):
            self.sent.append(data)

    mock_ws = MockWebSocket()
    await connection_manager.connect(user_id, mock_ws)
    assert mock_ws.accepted is True
    assert user_id in connection_manager._active_connections

    await connection_manager.send_personal_message({"test": "hello"}, user_id)
    assert len(mock_ws.sent) == 1
    assert mock_ws.sent[0] == {"test": "hello"}

    connection_manager.disconnect(user_id, mock_ws)
    assert user_id not in connection_manager._active_connections
