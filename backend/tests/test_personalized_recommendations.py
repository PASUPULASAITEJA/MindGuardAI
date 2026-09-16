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
from app.models.mood_logs import MoodLog, InputType
from app.models.emotion_analyses import EmotionAnalysis
from app.models.recommendations import RecommendationRecord
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
async def test_high_risk_personalized_recommendations(client: AsyncClient, test_db: AsyncSession):
    student = User(
        id=uuid4(),
        email="student_crisis@nmims.edu",
        password_hash=get_password_hash("StudentSecret123!"),
        full_name="High Risk Student",
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add(student)
    await test_db.commit()

    # Create High Risk assessment
    assessment = Assessment(
        id=uuid4(),
        student_id=student.id,
        risk_level=RiskLevel.HIGH,
        mental_wellness_score=24.0
    )
    test_db.add(assessment)
    await test_db.commit()

    student_token = create_access_token(subject=student.id, role=student.role.value)

    # Fetch personalized recommendations
    resp = await client.get(
        "/api/v1/recommendations/personalized",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["risk_tier"] == "HIGH"
    assert "recommendations" in data
    assert len(data["recommendations"]) >= 2

    # Verify that Crisis Support (/student/sos) and Counselor Appointment are prioritized
    categories = [rec["category"] for rec in data["recommendations"]]
    assert "CRISIS_SUPPORT" in categories
    assert "COUNSELOR_APPOINTMENT" in categories

    action_urls = [rec["action_url"] for rec in data["recommendations"]]
    assert "/student/sos" in action_urls
    assert "/student/appointments" in action_urls


@pytest.mark.asyncio
async def test_anxiety_personalized_recommendations_and_feedback(client: AsyncClient, test_db: AsyncSession):
    student = User(
        id=uuid4(),
        email="student_anxiety@nmims.edu",
        password_hash=get_password_hash("StudentSecret123!"),
        full_name="Anxious Student",
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add(student)
    await test_db.commit()

    # Create Medium Risk assessment
    assessment = Assessment(
        id=uuid4(),
        student_id=student.id,
        risk_level=RiskLevel.MEDIUM,
        mental_wellness_score=58.0
    )
    test_db.add(assessment)
    await test_db.commit()

    # Create MoodLog with anxiety emotion analysis
    mood = MoodLog(
        id=uuid4(),
        student_id=student.id,
        raw_content="I feel overwhelming exam pressure and my chest feels tight.",
        input_type=InputType.TEXT
    )
    test_db.add(mood)
    await test_db.commit()

    analysis = EmotionAnalysis(
        id=uuid4(),
        mood_log_id=mood.id,
        primary_emotion="anxiety",
        detected_emotions={"anxiety": 0.88, "stress": 0.72},
        sentiment_score=-0.65
    )
    test_db.add(analysis)
    await test_db.commit()

    student_token = create_access_token(subject=student.id, role=student.role.value)

    # 1. Fetch Recommendations
    resp = await client.get(
        "/api/v1/recommendations/personalized",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["primary_emotion"] == "anxiety"
    recs = data["recommendations"]
    assert len(recs) >= 3

    categories = [r["category"] for r in recs]
    assert "BREATHING" in categories
    assert "GROUNDING" in categories

    first_rec = recs[0]
    rec_id = first_rec["id"]

    # 2. Record Feedback: HELPFUL and COMPLETED
    resp_feedback = await client.post(
        f"/api/v1/recommendations/{rec_id}/feedback",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"feedback": "HELPFUL", "status": "COMPLETED"}
    )
    assert resp_feedback.status_code == 200
    updated_rec = resp_feedback.json()
    assert updated_rec["feedback"] == "HELPFUL"
    assert updated_rec["status"] == "COMPLETED"
    assert updated_rec["completed_at"] is not None

    # Verify persisted in database
    from uuid import UUID
    db_rec = await test_db.get(RecommendationRecord, UUID(rec_id))
    assert db_rec.feedback == "HELPFUL"
    assert db_rec.status == "COMPLETED"
