import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.main import app
from app.db.session import Base, get_db
from app.models.users import User, UserRole
from app.models.assessments import Assessment, RiskLevel
from app.models.audit_logs import AuditLog
from app.core.security import get_password_hash, create_access_token
from app.services.audit_service import audit_service

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
async def test_audit_logs_admin_api_filters_and_rbac(client: AsyncClient, test_db: AsyncSession):
    """Verify GET /api/admin/audit-logs supports action, user_id, date_range, resource_type filters and enforces RBAC."""
    admin_id = uuid4()
    student_id = uuid4()

    admin = User(
        id=admin_id,
        email="admin_audit@example.com",
        password_hash=get_password_hash("AdminPass123!"),
        full_name="Admin Audit",
        role=UserRole.ADMIN,
        is_active=True
    )
    student = User(
        id=student_id,
        email="student_audit@example.com",
        password_hash=get_password_hash("StudentPass123!"),
        full_name="Student Audit",
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add_all([admin, student])
    await test_db.commit()

    now = datetime.now(timezone.utc)
    old_time = now - timedelta(days=45)

    # Populate direct audit records
    log1 = AuditLog(
        id=uuid4(),
        actor_user_id=student_id,
        actor_role="STUDENT",
        action="journal_create",
        target_resource_type="JOURNAL",
        target_resource_id="/api/v1/journal/entries",
        created_at=now
    )
    log2 = AuditLog(
        id=uuid4(),
        actor_user_id=student_id,
        actor_role="STUDENT",
        action="consent_change",
        target_resource_type="CONSENT",
        target_resource_id="/api/consent",
        created_at=now
    )
    log3 = AuditLog(
        id=uuid4(),
        actor_user_id=admin_id,
        actor_role="ADMIN",
        action="admin_action",
        target_resource_type="ADMIN",
        target_resource_id="/api/admin/users",
        created_at=old_time
    )
    test_db.add_all([log1, log2, log3])
    await test_db.commit()

    admin_token = create_access_token(subject=str(admin.id), role=admin.role.value)
    student_token = create_access_token(subject=str(student.id), role=student.role.value)

    # 1. Student access -> 403 Forbidden
    resp_student = await client.get(
        "/api/admin/audit-logs",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert resp_student.status_code == 403

    # 2. Admin access without filters -> returns all 3 logs
    resp_all = await client.get(
        "/api/admin/audit-logs",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resp_all.status_code == 200
    data_all = resp_all.json()
    assert data_all["total"] == 3

    # 3. Filter by action="consent_change"
    resp_action = await client.get(
        "/api/admin/audit-logs?action=consent_change",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resp_action.status_code == 200
    assert resp_action.json()["total"] == 1
    assert resp_action.json()["logs"][0]["action"] == "consent_change"

    # 4. Filter by resource_type="JOURNAL"
    resp_res = await client.get(
        "/api/admin/audit-logs?resource_type=JOURNAL",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resp_res.status_code == 200
    assert resp_res.json()["total"] == 1
    assert resp_res.json()["logs"][0]["target_resource_type"] == "JOURNAL"

    # 5. Filter by user_id
    resp_user = await client.get(
        f"/api/admin/audit-logs?user_id={student_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resp_user.status_code == 200
    assert resp_user.json()["total"] == 2

    # 6. Filter by date_range="7d" (excludes log3 from 45 days ago)
    resp_date = await client.get(
        "/api/admin/audit-logs?date_range=7d",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resp_date.status_code == 200
    assert resp_date.json()["total"] == 2


@pytest.mark.asyncio
async def test_audit_middleware_auto_logging(client: AsyncClient, test_db: AsyncSession):
    """Verify middleware automatically records auditable actions."""
    user = User(
        id=uuid4(),
        email="auto_audit@example.com",
        password_hash=get_password_hash("Pass1234!"),
        full_name="Auto User",
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add(user)
    await test_db.commit()

    token = create_access_token(subject=str(user.id), role=user.role.value)

    # 1. Hit /api/v1/auth/login -> triggers auto-logging of "login"
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "auto_audit@example.com", "password": "Pass1234!"}
    )
    assert login_resp.status_code == 200

    # 2. Hit /api/v1/mood/history -> triggers auto-logging of "journal_view"
    hist_resp = await client.get(
        "/api/v1/mood/history",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert hist_resp.status_code == 200

    # Verify audit logs in database
    res = await test_db.execute(select(AuditLog))
    logs = res.scalars().all()
    actions = [l.action for l in logs]
    assert "login" in actions
    assert "journal_view" in actions
