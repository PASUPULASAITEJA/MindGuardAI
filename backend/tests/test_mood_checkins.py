import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.main import app
from app.db.session import Base, get_db
from app.models.users import User, UserRole
from app.models.consent import Consent, ConsentStatus
from app.models.mood_checkins import MoodCheckin
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
async def test_student_mood_checkin_lifecycle_and_summary(client: AsyncClient, test_db: AsyncSession):
    student = User(
        id=uuid4(),
        email="student_ema@nmims.edu",
        password_hash=get_password_hash("SecretPass123!"),
        full_name="EMA Student",
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add(student)
    await test_db.commit()

    student_token = create_access_token(subject=student.id, role=student.role.value)

    # 1. Post Morning Check-in
    payload = {
        "checkin_type": "morning",
        "mood_score": 8,
        "energy_level": 7,
        "anxiety_level": 3,
        "sleep_quality": "good",
        "sleep_hours": 7.5,
        "primary_emotion": "calm",
        "one_word_feeling": "Refreshed",
        "stress_source": "academics"
    }

    resp = await client.post(
        "/api/checkins",
        headers={"Authorization": f"Bearer {student_token}"},
        json=payload
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["mood_score"] == 8
    assert data["energy_level"] == 7
    assert data["checkin_type"] == "morning"
    assert data["primary_emotion"] == "calm"
    checkin_id = data["id"]

    # 2. Validation bounds test: mood_score out of bounds (15) -> 422
    bad_payload = {**payload, "mood_score": 15}
    resp_bad = await client.post(
        "/api/checkins",
        headers={"Authorization": f"Bearer {student_token}"},
        json=bad_payload
    )
    assert resp_bad.status_code == 422

    # 3. Retrieve student's check-ins
    resp_list = await client.get(
        "/api/checkins?range=7d",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert resp_list.status_code == 200
    list_data = resp_list.json()
    assert list_data["total"] >= 1
    assert list_data["items"][0]["id"] == checkin_id

    # 4. Summary & Streak endpoint
    resp_summary = await client.get(
        "/api/checkins/summary",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert resp_summary.status_code == 200
    summary_data = resp_summary.json()
    assert summary_data["total_checkins"] >= 1
    assert summary_data["streak_days"] >= 1
    assert summary_data["avg_mood_score"] == 8.0
    assert "good" in summary_data["sleep_quality_breakdown"]


@pytest.mark.asyncio
async def test_counselor_checkins_consent_and_rbac(client: AsyncClient, test_db: AsyncSession):
    student = User(
        id=uuid4(),
        email="student_cons@nmims.edu",
        password_hash=get_password_hash("SecretPass123!"),
        full_name="Consented Student",
        role=UserRole.STUDENT,
        is_active=True
    )
    counselor = User(
        id=uuid4(),
        email="counselor_ema@nmims.edu",
        password_hash=get_password_hash("CounselorPass123!"),
        full_name="Dr. EMA Counselor",
        role=UserRole.COUNSELOR,
        is_active=True
    )
    test_db.add_all([student, counselor])
    await test_db.commit()

    student_token = create_access_token(subject=student.id, role=student.role.value)
    counselor_token = create_access_token(subject=counselor.id, role=counselor.role.value)

    # Student logs an evening checkin
    checkin = MoodCheckin(
        user_id=student.id,
        checkin_type="evening",
        mood_score=6,
        energy_level=5,
        anxiety_level=6,
        sleep_quality="fair",
        sleep_hours=6.0,
        primary_emotion="anxious",
        stress_source="exams"
    )
    test_db.add(checkin)
    await test_db.commit()

    # Counselor attempts to view check-ins WITHOUT student consent -> 403 Forbidden
    resp_no_consent = await client.get(
        f"/api/counsellor/students/{student.id}/checkins",
        headers={"Authorization": f"Bearer {counselor_token}"}
    )
    assert resp_no_consent.status_code == 403

    # Student explicitly GRANTS consent (append-only)
    consent = Consent(
        id=uuid4(),
        student_id=student.id,
        consent_type="COUNSELOR_DATA_ACCESS",
        status=ConsentStatus.GRANTED
    )
    test_db.add(consent)
    await test_db.commit()

    # Counselor attempts to view check-ins WITH student consent -> 200 OK
    resp_with_consent = await client.get(
        f"/api/counsellor/students/{student.id}/checkins",
        headers={"Authorization": f"Bearer {counselor_token}"}
    )
    assert resp_with_consent.status_code == 200
    counselor_view = resp_with_consent.json()
    assert counselor_view["total"] == 1
    assert counselor_view["items"][0]["mood_score"] == 6

    # Non-counselor (Student) attempting to access counselor endpoint -> 403 Forbidden
    resp_student_denied = await client.get(
        f"/api/counsellor/students/{student.id}/checkins",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert resp_student_denied.status_code == 403
