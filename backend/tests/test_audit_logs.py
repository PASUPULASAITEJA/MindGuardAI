import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.db.session import Base, get_db
from app.models.users import User, UserRole
from app.services.audit_service import audit_service
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
async def test_audit_logs_workflow_and_rbac(client: AsyncClient, test_db: AsyncSession):
    # 1. Create Admin, Counselor, and Student
    admin = User(
        id=uuid4(),
        email="admin_audit@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Chief Compliance Officer",
        role=UserRole.ADMIN,
        is_active=True
    )
    counselor = User(
        id=uuid4(),
        email="counselor_audit@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Dr. Audit Counselor",
        role=UserRole.COUNSELOR,
        is_active=True
    )
    student = User(
        id=uuid4(),
        email="student_audit@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Audit Student",
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add(admin)
    test_db.add(counselor)
    test_db.add(student)
    await test_db.commit()

    admin_token = create_access_token(subject=admin.id, role=admin.role.value)
    counselor_token = create_access_token(subject=counselor.id, role=counselor.role.value)

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    counselor_headers = {"Authorization": f"Bearer {counselor_token}"}

    # 2. Record several audit events
    await audit_service.log_event(
        test_db,
        action="VIEW_STUDENT_CASEFILE",
        actor_user_id=counselor.id,
        actor_role=counselor.role.value,
        target_user_id=student.id,
        target_resource_type="CASEFILE",
        metadata={"timeframe_days": "90"}
    )
    await audit_service.log_event(
        test_db,
        action="GRANT_CONSENT",
        actor_user_id=student.id,
        actor_role=student.role.value,
        target_user_id=student.id,
        target_resource_type="CONSENT",
        metadata={"status": "GRANTED"}
    )

    # 3. Counselor tries to fetch audit logs -> Blocked 403 Forbidden
    res_block = await client.get("/api/v1/admin/audit-logs", headers=counselor_headers)
    assert res_block.status_code == 403

    # 4. Admin fetches audit logs -> 200 OK
    res_admin = await client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert res_admin.status_code == 200, res_admin.text
    data = res_admin.json()
    assert data["total"] >= 2
    actions = [log["action"] for log in data["logs"]]
    assert "VIEW_STUDENT_CASEFILE" in actions
    assert "GRANT_CONSENT" in actions

    # 5. Admin filters by action
    res_filter = await client.get("/api/v1/admin/audit-logs?action=VIEW_STUDENT_CASEFILE", headers=admin_headers)
    assert res_filter.status_code == 200
    filter_data = res_filter.json()
    assert filter_data["total"] == 1
    assert filter_data["logs"][0]["action"] == "VIEW_STUDENT_CASEFILE"
    assert filter_data["logs"][0]["actor_name"] == "Dr. Audit Counselor"
