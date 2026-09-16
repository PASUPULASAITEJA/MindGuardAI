import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
from datetime import datetime, timezone, timedelta, date
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.db.session import Base, get_db
from app.models.users import User, UserRole
from app.models.consent import Consent, ConsentStatus
from app.models.sleep_logs import SleepLog
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
async def test_student_sleep_log_lifecycle_and_analysis(client: AsyncClient, test_db: AsyncSession):
    student = User(
        id=uuid4(),
        email="student_sleep@nmims.edu",
        password_hash=get_password_hash("SleepPass123!"),
        full_name="Circadian Student",
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add(student)
    await test_db.commit()

    student_token = create_access_token(subject=student.id, role=student.role.value)
    headers = {"Authorization": f"Bearer {student_token}"}

    today = date.today()
    bedtime = datetime.now(timezone.utc).replace(hour=23, minute=30, second=0, microsecond=0) - timedelta(days=1)
    wake_time = bedtime + timedelta(hours=7, minutes=30)

    # 1. Post a new sleep log
    create_payload = {
        "log_date": today.isoformat(),
        "bedtime": bedtime.isoformat(),
        "wake_time": wake_time.isoformat(),
        "sleep_quality": 3,
        "nap_taken": True,
        "nap_duration_minutes": 25,
        "sleep_disruptions": 1,
        "source": "self_report"
    }

    res_post = await client.post("/api/v1/sleep", json=create_payload, headers=headers)
    assert res_post.status_code == 201
    log_data = res_post.json()
    assert log_data["sleep_quality"] == 3
    assert log_data["nap_taken"] is True
    assert log_data["nap_duration_minutes"] == 25
    assert log_data["sleep_disruptions"] == 1
    assert float(log_data["sleep_hours"]) == 7.5

    # 2. Get student sleep logs history
    res_get = await client.get("/api/v1/sleep?range=7d", headers=headers)
    assert res_get.status_code == 200
    list_data = res_get.json()
    assert list_data["total"] >= 1
    assert len(list_data["items"]) >= 1

    # 3. Get circadian sleep analysis
    res_analysis = await client.get("/api/v1/sleep/analysis?days=7", headers=headers)
    assert res_analysis.status_code == 200
    analysis_data = res_analysis.json()
    assert analysis_data["days_analyzed"] >= 1
    assert "avg_sleep_hours" in analysis_data
    assert "circadian_insight" in analysis_data
    assert isinstance(analysis_data["sleep_hygiene_recommendations"], list)


@pytest.mark.asyncio
async def test_counselor_sleep_consent_and_rbac(client: AsyncClient, test_db: AsyncSession):
    student = User(
        id=uuid4(),
        email="counselor_student_sleep@nmims.edu",
        password_hash=get_password_hash("Secret123!"),
        full_name="Consent Student Sleep",
        role=UserRole.STUDENT,
        is_active=True
    )
    counselor = User(
        id=uuid4(),
        email="counselor_sleep_doc@nmims.edu",
        password_hash=get_password_hash("Secret123!"),
        full_name="Dr. Sleep Specialist",
        role=UserRole.COUNSELOR,
        is_active=True
    )
    test_db.add_all([student, counselor])
    await test_db.commit()

    student_token = create_access_token(subject=student.id, role=student.role.value)
    counselor_token = create_access_token(subject=counselor.id, role=counselor.role.value)

    counselor_headers = {"Authorization": f"Bearer {counselor_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # Student posts a sleep log
    bedtime = datetime.now(timezone.utc) - timedelta(hours=6)
    wake_time = datetime.now(timezone.utc)
    await client.post(
        "/api/v1/sleep",
        json={
            "log_date": date.today().isoformat(),
            "bedtime": bedtime.isoformat(),
            "wake_time": wake_time.isoformat(),
            "sleep_quality": 2,
            "nap_taken": False,
            "sleep_disruptions": 2,
            "source": "self_report"
        },
        headers=student_headers
    )

    # 1. Counselor attempts query WITHOUT consent -> Expected 403 Forbidden
    res_no_consent = await client.get(
        f"/api/v1/counselor/students/{student.id}/sleep?days=7",
        headers=counselor_headers
    )
    assert res_no_consent.status_code == 403
    assert "consent" in res_no_consent.json()["detail"].lower()

    # 2. Grant explicit consent
    consent = Consent(
        id=uuid4(),
        student_id=student.id,
        consent_type="COUNSELOR_DATA_ACCESS",
        status=ConsentStatus.GRANTED
    )
    test_db.add(consent)
    await test_db.commit()

    # 3. Counselor queries WITH consent -> Expected 200 OK
    res_consented = await client.get(
        f"/api/v1/counselor/students/{student.id}/sleep?days=7",
        headers=counselor_headers
    )
    assert res_consented.status_code == 200
    sleep_profile = res_consented.json()
    assert sleep_profile["days_analyzed"] >= 1
    assert "avg_sleep_hours" in sleep_profile

    # 4. Student tries to access counselor route -> Expected 403
    res_student_forbidden = await client.get(
        f"/api/v1/counselor/students/{student.id}/sleep?days=7",
        headers=student_headers
    )
    assert res_student_forbidden.status_code == 403
