import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.main import app
from app.db.session import Base, get_db
from app.models.users import User, UserRole
from app.models.alerts import Alert, AlertStatus
from app.models.assessments import Assessment, RiskLevel
from app.models.notification_deliveries import NotificationDelivery
from app.models.audit_logs import AuditLog
from app.core.security import get_password_hash, create_access_token
from app.api.v1.alerts import _sos_cooldown_tracker

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
async def test_emergency_sos_critical_alert_flow(client: AsyncClient, test_db: AsyncSession):
    # Reset in-memory rate limit tracker
    _sos_cooldown_tracker.clear()

    # 1. Setup Counselor, Admin, and Student
    counselor = User(
        id=uuid4(),
        email="counselor_sos@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Dr. Crisis Responder",
        role=UserRole.COUNSELOR,
        is_active=True
    )
    admin = User(
        id=uuid4(),
        email="admin_sos@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Campus Admin",
        role=UserRole.ADMIN,
        is_active=True
    )
    student = User(
        id=uuid4(),
        email="student_sos@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Distressed Student",
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add_all([counselor, admin, student])
    await test_db.commit()

    student_token = create_access_token(student.id, role="STUDENT", email=student.email)
    student_headers = {"Authorization": f"Bearer {student_token}"}
    counselor_token = create_access_token(counselor.id, role="COUNSELOR", email=counselor.email)
    counselor_headers = {"Authorization": f"Bearer {counselor_token}"}

    # 2. Add an existing HIGH risk alert created earlier for another student to verify sorting
    other_student = User(
        id=uuid4(),
        email="other_student@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Other Student",
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add(other_student)
    await test_db.commit()

    earlier_assessment = Assessment(
        id=uuid4(),
        student_id=other_student.id,
        risk_level=RiskLevel.HIGH,
        mental_wellness_score=25.0,
        evaluated_at=datetime.now(timezone.utc)
    )
    test_db.add(earlier_assessment)
    await test_db.commit()

    earlier_alert = Alert(
        id=uuid4(),
        student_id=other_student.id,
        assessment_id=earlier_assessment.id,
        status=AlertStatus.PENDING,
        severity="HIGH",
        created_at=datetime.now(timezone.utc)
    )
    test_db.add(earlier_alert)
    await test_db.commit()

    # 3. Student triggers POST /api/v1/alerts/sos
    resp = await client.post("/api/v1/alerts/sos", headers=student_headers)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["status"] == "success"
    assert data["severity"] == "CRITICAL"
    assert "alert_id" in data
    assert len(data["helplines"]) > 0

    # 4. Rate-limiting check: consecutive call within cooldown raises 429
    rate_limit_resp = await client.post("/api/v1/alerts/sos", headers=student_headers)
    assert rate_limit_resp.status_code == 429
    assert "cooldown" in rate_limit_resp.json()["detail"].lower()

    # 5. Verify database records:
    # Audit log
    audit_stmt = select(AuditLog).where(AuditLog.action == "DISPATCH_EMERGENCY_SOS")
    audit_res = await test_db.execute(audit_stmt)
    audit_entry = audit_res.scalar_one_or_none()
    assert audit_entry is not None
    assert audit_entry.actor_user_id == student.id
    assert audit_entry.metadata_json.get("severity") == "CRITICAL"

    # In-app notifications for Counselor and Admin
    notif_stmt = select(NotificationDelivery).where(
        NotificationDelivery.event_type == "EMERGENCY_SOS",
        NotificationDelivery.channel == "IN_APP"
    )
    notif_res = await test_db.execute(notif_stmt)
    notifications = notif_res.scalars().all()
    notif_recipients = {n.recipient_user_id for n in notifications}
    assert counselor.id in notif_recipients
    assert admin.id in notif_recipients

    # 6. Counselor dashboard alerts endpoint orders CRITICAL alerts at the top
    counselor_alerts_resp = await client.get("/api/v1/counselors/alerts", headers=counselor_headers)
    assert counselor_alerts_resp.status_code == 200
    alerts_list = counselor_alerts_resp.json()["alerts"]
    assert len(alerts_list) >= 2
    # The first alert must be the CRITICAL one
    assert alerts_list[0]["severity"] == "CRITICAL"
    assert alerts_list[0]["student_id"] == str(student.id)
    # The second alert is the HIGH one
    assert alerts_list[1]["severity"] == "HIGH"
