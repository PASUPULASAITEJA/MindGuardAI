import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.db.session import Base, get_db
from app.models.users import User, UserRole
from app.models.notification_deliveries import NotificationDelivery
from app.services.email_service import email_service
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
async def test_email_notifications_workflow(client: AsyncClient, test_db: AsyncSession):
    # 1. Create Student, Counselor, and Admin
    student = User(
        id=uuid4(),
        email="student_notify@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Notify Student",
        role=UserRole.STUDENT,
        is_active=True
    )
    counselor = User(
        id=uuid4(),
        email="counselor_notify@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Dr. Notification Counselor",
        role=UserRole.COUNSELOR,
        is_active=True
    )
    admin = User(
        id=uuid4(),
        email="admin_notify@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Campus Admin",
        role=UserRole.ADMIN,
        is_active=True
    )
    test_db.add(student)
    test_db.add(counselor)
    test_db.add(admin)
    await test_db.commit()

    student_token = create_access_token(subject=student.id, role=student.role.value)
    admin_token = create_access_token(subject=admin.id, role=admin.role.value)

    student_headers = {"Authorization": f"Bearer {student_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Dispatch high-risk notification via email_service
    deliveries = await email_service.notify_counselors_on_high_risk(
        test_db,
        student=student,
        event_type="HIGH_RISK_ALERT",
        custom_message="Student exhibited acute stress markers."
    )
    assert len(deliveries) >= 1
    assert deliveries[0].event_type == "HIGH_RISK_ALERT"
    assert deliveries[0].recipient_email == "counselor_notify@example.com"
    assert deliveries[0].status == "SENT"
    assert deliveries[0].sent_at is not None

    # 3. Trigger Emergency SOS via API endpoint -> dispatches email notification
    res_sos = await client.post("/api/v1/alerts/sos", headers=student_headers)
    assert res_sos.status_code == 201, res_sos.text
    sos_data = res_sos.json()
    assert sos_data["status"] == "success"

    # 4. Student tries to view notification deliveries log -> Blocked 403 Forbidden
    res_block = await client.get("/api/v1/admin/notifications/deliveries", headers=student_headers)
    assert res_block.status_code == 403

    # 5. Admin views notification deliveries log -> 200 OK
    res_admin = await client.get("/api/v1/admin/notifications/deliveries", headers=admin_headers)
    assert res_admin.status_code == 200, res_admin.text
    log_data = res_admin.json()
    assert log_data["total"] >= 2
    event_types = [d["event_type"] for d in log_data["deliveries"]]
    assert "HIGH_RISK_ALERT" in event_types
    assert "EMERGENCY_SOS" in event_types
