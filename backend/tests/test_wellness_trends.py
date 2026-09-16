import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.db.session import Base, get_db
from app.models.users import User, UserRole
from app.models.assessments import Assessment, RiskLevel
from app.models.mood_logs import MoodLog, InputType
from app.models.emotion_analyses import EmotionAnalysis
from app.models.consent_records import ConsentRecord, ConsentType
from app.core.security import get_password_hash, create_access_token
from app.services.trend_service import trend_service

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
async def test_trend_service_empty_baseline(test_db: AsyncSession):
    """Verify empty student records return a safe default baseline response."""
    student_id = uuid4()
    res = await trend_service.get_student_trends(test_db, student_id=student_id, timeframe="30d")
    assert res.student_id == student_id
    assert res.timeframe == "30d"
    assert res.summary.average_wellness_score == 70.0
    assert res.summary.direction == "STABLE"
    assert res.summary.total_checkins == 0
    assert len(res.points) == 0


@pytest.mark.asyncio
async def test_trend_service_aggregation_and_direction(test_db: AsyncSession):
    """Verify multi-day assessment and mood aggregations compute rolling average, delta, and direction."""
    student_id = uuid4()
    now = datetime.now(timezone.utc)

    # Day 1: 5 days ago (Wellness: 50.0)
    d1 = now - timedelta(days=5)
    a1 = Assessment(
        student_id=student_id,
        mental_wellness_score=50.0,
        risk_level=RiskLevel.MEDIUM,
        evaluated_at=d1
    )
    test_db.add(a1)

    # Day 2: 3 days ago (Wellness: 65.0)
    d2 = now - timedelta(days=3)
    a2 = Assessment(
        student_id=student_id,
        mental_wellness_score=65.0,
        risk_level=RiskLevel.LOW,
        evaluated_at=d2
    )
    test_db.add(a2)

    # Day 3: Yesterday (Wellness: 80.0)
    d3 = now - timedelta(days=1)
    a3 = Assessment(
        student_id=student_id,
        mental_wellness_score=80.0,
        risk_level=RiskLevel.LOW,
        evaluated_at=d3
    )
    test_db.add(a3)

    # Add Mood log with emotion on Day 3
    mood = MoodLog(
        student_id=student_id,
        input_type=InputType.TEXT,
        raw_content="Feeling great and peaceful today.",
        self_reported_score=8,
        logged_at=d3
    )
    test_db.add(mood)
    await test_db.flush()

    emotion = EmotionAnalysis(
        mood_log_id=mood.id,
        detected_emotions={"joy": 0.8, "calm": 0.2},
        sentiment_score=0.75,
        primary_emotion="joy",
        analyzed_at=d3
    )
    test_db.add(emotion)
    await test_db.commit()

    # Query trends
    res = await trend_service.get_student_trends(test_db, student_id=student_id, timeframe="30d")
    assert len(res.points) == 3
    assert res.summary.total_checkins == 4
    assert res.summary.average_wellness_score > 60.0
    assert res.summary.highest_score == 80.0
    assert res.summary.lowest_score == 50.0
    assert res.summary.wellness_delta == 30.0
    assert res.summary.direction == "IMPROVING"
    assert res.summary.dominant_emotion == "joy"
    assert res.summary.volatility_score > 0


@pytest.mark.asyncio
async def test_wellness_trends_api_endpoints_and_rbac(client: AsyncClient, test_db: AsyncSession):
    """Verify GET /api/v1/predictions/trends enforces RBAC, returns trend points and summary."""
    student_id = uuid4()
    counselor_id = uuid4()

    student = User(
        id=student_id,
        email="trend_student@example.com",
        password_hash=get_password_hash("Student123!"),
        role=UserRole.STUDENT,
        is_active=True
    )
    counselor = User(
        id=counselor_id,
        email="trend_counselor@example.com",
        password_hash=get_password_hash("Counselor123!"),
        role=UserRole.COUNSELOR,
        is_active=True
    )
    test_db.add_all([student, counselor])
    await test_db.commit()

    # Active consent for counselor access
    from app.models.consent import Consent, ConsentStatus
    consent = Consent(
        student_id=student_id,
        consent_type="COUNSELOR_DATA_ACCESS",
        status=ConsentStatus.GRANTED
    )
    test_db.add(consent)
    await test_db.commit()

    student_token = create_access_token(subject=str(student_id), role="STUDENT", email=student.email)
    counselor_token = create_access_token(subject=str(counselor_id), role="COUNSELOR", email=counselor.email)

    # 1. Student queries own trends
    res1 = await client.get(
        "/api/v1/predictions/trends?timeframe=30d",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["student_id"] == str(student_id)
    assert "summary" in data1
    assert "points" in data1

    # 2. Counselor queries student trends with active consent
    res2 = await client.get(
        f"/api/v1/predictions/trends?student_id={student_id}&timeframe=7d",
        headers={"Authorization": f"Bearer {counselor_token}"}
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["timeframe"] == "7d"
    assert data2["student_id"] == str(student_id)
