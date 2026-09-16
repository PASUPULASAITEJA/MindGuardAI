import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.main import app
from app.db.session import Base, get_db
from app.models.users import User, UserRole
from app.models.assessments import Assessment, RiskLevel
from app.models.audit_logs import AuditLog
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
async def test_department_risk_and_admin_rbac(client: AsyncClient, test_db: AsyncSession):
    # Create Admin
    admin = User(
        id=uuid4(),
        email="admin_dept@nmims.edu",
        password_hash=get_password_hash("AdminPass123!"),
        full_name="University Dean",
        role=UserRole.ADMIN,
        is_active=True
    )
    # Create Student
    student = User(
        id=uuid4(),
        email="student_dept@nmims.edu",
        password_hash=get_password_hash("StudentPass123!"),
        full_name="Alice Student",
        role=UserRole.STUDENT,
        academic_department="Computer Science & Engineering",
        is_active=True
    )
    test_db.add_all([admin, student])
    await test_db.commit()

    # Add assessment for student
    assessment = Assessment(
        id=uuid4(),
        student_id=student.id,
        risk_level=RiskLevel.MEDIUM,
        mental_wellness_score=62.5
    )
    test_db.add(assessment)
    await test_db.commit()

    admin_token = create_access_token(subject=admin.id, role=admin.role.value)
    student_token = create_access_token(subject=student.id, role=student.role.value)

    # Student trying to access department risk should get 403 Forbidden
    resp_student = await client.get(
        "/api/v1/analytics/department-risk",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert resp_student.status_code == 403

    # Admin accessing department risk should get 200 OK
    resp_admin = await client.get(
        "/api/v1/analytics/department-risk",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resp_admin.status_code == 200
    data = resp_admin.json()
    assert "departments" in data
    assert "total_departments" in data
    assert data["total_departments"] >= 1
    # Check that Computer Science & Engineering is present
    depts = [d["department"] for d in data["departments"]]
    assert "Computer Science & Engineering" in depts


@pytest.mark.asyncio
async def test_admin_user_directory_and_status_toggle(client: AsyncClient, test_db: AsyncSession):
    admin = User(
        id=uuid4(),
        email="admin_dir@nmims.edu",
        password_hash=get_password_hash("AdminPass123!"),
        full_name="Super Administrator",
        role=UserRole.ADMIN,
        is_active=True
    )
    target_student = User(
        id=uuid4(),
        email="target_student@nmims.edu",
        password_hash=get_password_hash("Pass123!"),
        full_name="Bob Student",
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add_all([admin, target_student])
    await test_db.commit()

    admin_token = create_access_token(subject=admin.id, role=admin.role.value)

    # 1. Fetch User Directory
    resp_users = await client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resp_users.status_code == 200
    users_data = resp_users.json()
    assert "users" in users_data
    assert len(users_data["users"]) >= 2

    # 2. Deactivate Target Student
    resp_deact = await client.patch(
        f"/api/v1/admin/users/{target_student.id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"is_active": False}
    )
    assert resp_deact.status_code == 200
    updated_student = resp_deact.json()
    assert updated_student["is_active"] is False

    # Check that audit log was registered
    audit_stmt = select(AuditLog).where(AuditLog.action == "UPDATE_USER_STATUS")
    res_audit = await test_db.execute(audit_stmt)
    logs = res_audit.scalars().all()
    assert len(logs) >= 1
    assert logs[0].actor_user_id == admin.id
    assert logs[0].target_user_id == target_student.id

    # 3. Prevent Self-Deactivation for Admin
    resp_self = await client.patch(
        f"/api/v1/admin/users/{admin.id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"is_active": False}
    )
    assert resp_self.status_code == 400
    err_detail = resp_self.json()["detail"]
    assert err_detail["error_code"] == "CANNOT_DEACTIVATE_SELF"
