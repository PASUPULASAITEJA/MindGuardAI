"""
Security and Privacy Negative Unit Tests for MindGuardAI.
Tests RBAC enforcement, unauthorized record enumeration prevention, and k-anonymity suppression.
"""

import pytest
import pytest_asyncio
from uuid import uuid4
from datetime import datetime, timezone, timedelta, date
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


@pytest.mark.asyncio
async def test_k_anonymity_exact_boundary_conditions(client: AsyncClient, test_db: AsyncSession):
    """
    Test exact boundary conditions:
    - 9 students -> Suppressed (N < 10)
    - 10 students -> Released (N >= 10 unmasked)
    """
    admin_id = uuid4()
    admin = User(
        id=admin_id,
        email="admin_boundary@example.edu",
        password_hash="hashed_pw",
        full_name="Admin Boundary",
        role=UserRole.ADMIN,
        is_active=True
    )
    test_db.add(admin)

    # Department A: exactly 9 students (should be suppressed)
    for i in range(9):
        sid = uuid4()
        test_db.add(User(
            id=sid,
            email=f"dept9_student_{i}@example.edu",
            password_hash="hashed_pw",
            full_name=f"Dept9 Student {i}",
            role=UserRole.STUDENT,
            academic_department="Biomedical Informatics",
            is_active=True
        ))
        test_db.add(Assessment(
            id=uuid4(),
            student_id=sid,
            mental_wellness_score=60.0,
            risk_level=RiskLevel.LOW
        ))

    # Department B: exactly 10 students (should be unmasked and released)
    for i in range(10):
        sid = uuid4()
        test_db.add(User(
            id=sid,
            email=f"dept10_student_{i}@example.edu",
            password_hash="hashed_pw",
            full_name=f"Dept10 Student {i}",
            role=UserRole.STUDENT,
            academic_department="Data Science & AI",
            is_active=True
        ))
        test_db.add(Assessment(
            id=uuid4(),
            student_id=sid,
            mental_wellness_score=75.0,
            risk_level=RiskLevel.LOW
        ))

    await test_db.commit()

    token = create_access_token(str(admin_id), role="ADMIN")
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.get("/api/v1/analytics/department-risk", headers=headers)
    assert response.status_code == 200
    data = response.json()

    # Verify Dept 9 is suppressed
    dept9 = next(d for d in data["departments"] if "Biomedical Informatics" in d["department"])
    assert "Protected: N < 10" in dept9["department"]
    assert dept9["average_wellness_score"] == 0.0

    # Verify Dept 10 is unmasked
    dept10 = next(d for d in data["departments"] if "Data Science & AI" in d["department"])
    assert "Protected" not in dept10["department"]
    assert dept10["average_wellness_score"] == 75.0
    assert dept10["student_count"] == 10


@pytest.mark.asyncio
async def test_academic_trends_k_anonymity_suppression(client: AsyncClient, test_db: AsyncSession):
    """Test that academic trends with fewer than 10 participants are suppressed for privacy."""
    from datetime import date
    from app.models.academic import AcademicEvent, AcademicEventType

    admin_id = uuid4()
    admin = User(
        id=admin_id,
        email="admin_acad@example.edu",
        password_hash="hashed_pw",
        full_name="Admin Academic",
        role=UserRole.ADMIN,
        is_active=True
    )
    test_db.add(admin)

    # Academic event
    ev = AcademicEvent(
        id=str(uuid4()),
        title="Privacy Test Quiz",
        event_type=AcademicEventType.MIDTERMS,
        start_date=date(2026, 10, 1),
        end_date=date(2026, 10, 5),
        academic_year="2026-2027",
        semester="Fall"
    )
    test_db.add(ev)

    # Only 2 students participate (N < 10)
    for i in range(2):
        sid = uuid4()
        test_db.add(User(id=sid, email=f"quiz_stu_{i}@example.edu", password_hash="hashed_pw", role=UserRole.STUDENT, is_active=True))
        test_db.add(Assessment(
            id=uuid4(), student_id=sid, mental_wellness_score=50.0, risk_level=RiskLevel.MEDIUM,
            evaluated_at=datetime(2026, 10, 2, tzinfo=timezone.utc)
        ))

    await test_db.commit()

    token = create_access_token(str(admin_id), role="ADMIN")
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.get("/api/v1/academic/trends", headers=headers)
    assert res.status_code == 200
    trends = res.json()
    quiz_trend = next(t for t in trends if t["title"] == "Privacy Test Quiz")
    assert "Protected: N=" in quiz_trend["context_note"]
    assert quiz_trend["observed_average_wellness"] == 0.0


@pytest.mark.asyncio
async def test_retention_service_purge(test_db: AsyncSession):
    """Test automated data retention purge and right-to-erasure workflows."""
    from app.services.retention_service import retention_service
    from app.models.sleep_logs import SleepLog
    from datetime import date

    student_id = uuid4()
    test_db.add(User(id=student_id, email="retention_stu@example.edu", password_hash="hashed_pw", role=UserRole.STUDENT, is_active=True))

    # Add old sleep log (> 180 days ago) and recent sleep log
    old_date = (datetime.now(timezone.utc) - timedelta(days=200)).date()
    test_db.add(SleepLog(
        user_id=student_id, log_date=old_date, bedtime=datetime.now(timezone.utc),
        wake_time=datetime.now(timezone.utc), sleep_hours=7.0, sleep_quality=3
    ))
    recent_date = (datetime.now(timezone.utc) - timedelta(days=5)).date()
    test_db.add(SleepLog(
        user_id=student_id, log_date=recent_date, bedtime=datetime.now(timezone.utc),
        wake_time=datetime.now(timezone.utc), sleep_hours=8.0, sleep_quality=4
    ))
    await test_db.commit()

    # 1. Run retention purge (180 days)
    purge_summary = await retention_service.purge_expired_behavioral_telemetry(test_db, retention_days=180)
    assert purge_summary["purged_sleep_logs"] >= 1

    # 2. Run right-to-erasure on remaining data
    erasure_summary = await retention_service.execute_right_to_erasure(test_db, student_id=student_id)
    assert erasure_summary["status"] == "PURGED"
