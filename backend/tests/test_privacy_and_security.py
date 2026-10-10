"""
Security and Privacy Negative Unit Tests for MindGuardAI.
Tests RBAC enforcement, unauthorized record enumeration prevention, and k-anonymity suppression.
"""

import pytest
import pytest_asyncio
from uuid import uuid4
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.db.session import Base, get_db
from app.models.users import User, UserRole
from app.models.assessments import Assessment, RiskLevel
from app.models.consent_records import ConsentRecord, ConsentType
from app.core.security import create_access_token

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
async def test_student_cannot_access_admin_reports(client: AsyncClient, test_db: AsyncSession):
    """Test that a student account receives HTTP 403 Forbidden when accessing administrative macro reports."""
    student_id = uuid4()
    student = User(
        id=student_id,
        email="student_test@example.edu",
        password_hash="hashed_pw",
        full_name="Regular Student",
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add(student)
    await test_db.commit()

    token = create_access_token(str(student_id), role="STUDENT")
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.get("/api/v1/analytics/institution/reports", headers=headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_k_anonymity_department_suppression(client: AsyncClient, test_db: AsyncSession):
    """Test that academic departments with fewer than 10 students have their risk distributions suppressed."""
    admin_id = uuid4()
    admin = User(
        id=admin_id,
        email="admin_test@example.edu",
        password_hash="hashed_pw",
        full_name="Institutional Admin",
        role=UserRole.ADMIN,
        is_active=True
    )
    test_db.add(admin)

    # Add only 3 students to a small department (N=3 < 10 threshold)
    for i in range(3):
        sid = uuid4()
        u = User(
            id=sid,
            email=f"niche_student_{i}@example.edu",
            password_hash="hashed_pw",
            full_name=f"Niche Student {i}",
            role=UserRole.STUDENT,
            academic_department="Specialized Robotics",
            is_active=True
        )
        test_db.add(u)
        test_db.add(Assessment(
            id=uuid4(),
            student_id=sid,
            mental_wellness_score=45.0,
            risk_level=RiskLevel.MEDIUM
        ))

    await test_db.commit()

    token = create_access_token(str(admin_id), role="ADMIN")
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.get("/api/v1/analytics/department-risk", headers=headers)
    assert response.status_code == 200
    data = response.json()

    # Find the Specialized Robotics department entry
    dept_item = next(d for d in data["departments"] if "Specialized Robotics" in d["department"])
    assert "Protected: N < 10" in dept_item["department"]
    assert dept_item["average_wellness_score"] == 0.0
    assert dept_item["low_risk_count"] == 0
    assert dept_item["high_risk_count"] == 0
