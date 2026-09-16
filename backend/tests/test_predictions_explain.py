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
from app.models.consent import Consent, ConsentStatus
from app.models.assessments import Assessment, RiskLevel
from app.models.mood_logs import MoodLog, InputType
from app.models.emotion_analyses import EmotionAnalysis
from app.models.chat import Conversation, ChatMessage, SafetyEvent, ChatSender
from app.models.behavioral import BehavioralLog
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
async def test_unified_risk_explanation_flow(client: AsyncClient, test_db: AsyncSession):
    now = datetime.now(timezone.utc)

    # 1. Create Counselor, Student with Granted Consent, and Student with Revoked Consent
    counselor = User(
        id=uuid4(),
        email="counselor_explain@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Dr. Explainability Expert",
        role=UserRole.COUNSELOR,
        is_active=True
    )
    student = User(
        id=uuid4(),
        email="student_explain@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Alice Explainable",
        role=UserRole.STUDENT,
        is_active=True
    )
    student_revoked = User(
        id=uuid4(),
        email="student_revoked@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Bob Revoked",
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add_all([counselor, student, student_revoked])
    await test_db.flush()

    # 2. Add Consent records
    consent_granted = Consent(
        id=uuid4(),
        student_id=student.id,
        consent_type="COUNSELOR_DATA_ACCESS",
        status=ConsentStatus.GRANTED,
        granted_at=now
    )
    consent_revoked = Consent(
        id=uuid4(),
        student_id=student_revoked.id,
        consent_type="COUNSELOR_DATA_ACCESS",
        status=ConsentStatus.REVOKED,
        revoked_at=now
    )
    test_db.add_all([consent_granted, consent_revoked])

    # 3. Add Assessments for Student (showing a decline over past 7 days)
    assessment_baseline = Assessment(
        id=uuid4(),
        student_id=student.id,
        mental_wellness_score=62.0,
        risk_level=RiskLevel.MEDIUM,
        evaluated_at=now - timedelta(days=6)
    )
    assessment_latest = Assessment(
        id=uuid4(),
        student_id=student.id,
        mental_wellness_score=45.0,
        risk_level=RiskLevel.HIGH,
        evaluated_at=now - timedelta(hours=2)
    )
    test_db.add_all([assessment_baseline, assessment_latest])

    # 4. Add MoodLog & EmotionAnalysis
    mood_log = MoodLog(
        id=uuid4(),
        student_id=student.id,
        input_type=InputType.TEXT,
        raw_content="Feeling so exhausted and overwhelmed lately with exams.",
        self_reported_score=3,
        logged_at=now - timedelta(days=1)
    )
    test_db.add(mood_log)
    await test_db.flush()

    emotion_analysis = EmotionAnalysis(
        id=uuid4(),
        mood_log_id=mood_log.id,
        detected_emotions={"sadness": 0.75, "anxiety": 0.65, "joy": 0.05},
        sentiment_score=-0.65,
        primary_emotion="sadness",
        analyzed_at=now - timedelta(days=1)
    )
    test_db.add(emotion_analysis)

    # 5. Add Chat Message with Crisis Flag & Safety Event
    conv = Conversation(
        id=uuid4(),
        student_id=student.id,
        title="Check-in"
    )
    test_db.add(conv)
    await test_db.flush()

    chat_msg = ChatMessage(
        id=uuid4(),
        conversation_id=conv.id,
        student_id=student.id,
        sender=ChatSender.STUDENT,
        message="I don't think I can handle this anymore.",
        is_crisis_flag=True,
        sentiment_score=-0.8,
        risk_level="RED",
        created_at=now - timedelta(days=2)
    )
    safety_event = SafetyEvent(
        id=uuid4(),
        student_id=student.id,
        conversation_id=conv.id,
        severity="RED",
        trigger_type="ACUTE_DISTRESS",
        status="OPEN",
        created_at=now - timedelta(days=2)
    )
    test_db.add_all([chat_msg, safety_event])

    # 6. Add Behavioral Log with late night usage
    behavioral = BehavioralLog(
        id=uuid4(),
        student_id=student.id,
        date=(now - timedelta(days=1)).strftime("%Y-%m-%d"),
        total_screen_time_minutes=380,
        late_night_usage_minutes=75,
        risk_level="HIGH"
    )
    test_db.add(behavioral)
    await test_db.commit()

    # Generate Tokens
    counselor_token = create_access_token(counselor.id, role="COUNSELOR", email=counselor.email)
    student_token = create_access_token(student.id, role="STUDENT", email=student.email)

    # --- Test Case A: Counselor queries student with active consent ---
    response = await client.get(
        f"/api/v1/predictions/explain/{student.id}",
        headers={"Authorization": f"Bearer {counselor_token}"}
    )
    assert response.status_code == 200, f"Expected 200, got: {response.text}"
    data = response.json()

    # Verify (a) current risk tier
    assert data["student_id"] == str(student.id)
    assert data["current_risk_tier"] == "HIGH"
    assert data["current_wellness_score"] == 45.0

    # Verify (b) last 7/30-day trend summary
    trend = data["trend_summary"]
    assert trend["summary_7d"]["period_days"] == 7
    assert trend["summary_7d"]["wellness_delta"] == -17.0  # 45 - 62
    assert trend["summary_7d"]["direction"] == "DECLINING"
    assert trend["summary_7d"]["crisis_flags_count"] >= 1
    assert trend["summary_30d"]["period_days"] == 30
    assert trend["primary_direction"] in ("DECLINING", "CRITICAL")
    assert len(trend["headline"]) > 10

    # Verify (c) top 5 factors
    top_factors = data["top_factors"]
    assert len(top_factors) == 5
    factor_ids = [f["id"] for f in top_factors]
    # Crisis flag factor must be top priority
    assert "factor_crisis_flags" in factor_ids
    # Negative sentiment or circadian disruption should be present
    assert any(f["category"] in ("CRISIS_SAFETY", "LINGUISTIC_AFFECT", "BEHAVIORAL_CIRCADIAN", "LONGITUDINAL_TREND") for f in top_factors)
    # Check structure of factors
    for factor in top_factors:
        assert factor["severity"] in ("CRITICAL", "HIGH", "MEDIUM", "LOW", "POSITIVE")
        assert 1 <= factor["impact_pct"] <= 100
        assert len(factor["description"]) > 5

    # --- Test Case B: Counselor queries student with REVOKED consent ---
    res_revoked = await client.get(
        f"/api/v1/predictions/explain/{student_revoked.id}",
        headers={"Authorization": f"Bearer {counselor_token}"}
    )
    assert res_revoked.status_code == 403
    assert "Consent revoked" in res_revoked.json()["detail"]

    # --- Test Case C: Student queries self -> 200 OK ---
    res_student_self = await client.get(
        f"/api/v1/predictions/explain/{student.id}",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res_student_self.status_code == 200
    assert res_student_self.json()["current_wellness_score"] == 45.0

    # --- Test Case D: Student queries another student -> 403 Forbidden ---
    res_student_other = await client.get(
        f"/api/v1/predictions/explain/{student_revoked.id}",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res_student_other.status_code == 403

    # --- Test Case E: Verify Audit Log Created ---
    stmt_audit = select(AuditLog).where(
        AuditLog.action == "EXPLAIN_RISK_FACTORS",
        AuditLog.target_user_id == student.id
    )
    res_audit = await test_db.execute(stmt_audit)
    audit_entries = res_audit.scalars().all()
    assert len(audit_entries) >= 2  # Once for counselor, once for student
    assert audit_entries[0].target_resource_type == "PREDICTIONS"
