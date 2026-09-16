import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.main import app
from app.db.session import Base, get_db
from app.models.users import User, UserRole
from app.models.assessments import Assessment, RiskLevel
from app.models.consent import Consent, ConsentStatus
from app.models.risk_explanations import RiskExplanation, ExplanationDirection
from app.repositories.risk_explanations import risk_explanation_repository
from app.services.shap_service import shap_service
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
async def test_shap_service_top3_computation():
    """Verify SHAP explainer produces top 3 factors with proper directions and ranks."""
    pred_id = uuid4()
    features = {
        "anxiety": 0.85,
        "sadness": 0.70,
        "joy": 0.10,
        "sentiment_score": -0.75,
        "self_reported_score": 18.0,
        "sleep_hours": 4.0,
        "study_hours": 2.0,
        "exam_stress_index": 8.0,
        "rolling_sentiment_7d": -0.6
    }
    
    explanations = shap_service.compute_shap_factors(pred_id, features)
    
    assert len(explanations) == 3
    ranks = [e.rank for e in explanations]
    assert ranks == [1, 2, 3]
    
    for e in explanations:
        assert e.prediction_id == pred_id
        assert isinstance(e.shap_value, float)
        assert e.direction in (ExplanationDirection.INCREASING_RISK, ExplanationDirection.DECREASING_RISK)
        if e.shap_value >= 0:
            assert e.direction == ExplanationDirection.INCREASING_RISK
        else:
            assert e.direction == ExplanationDirection.DECREASING_RISK


@pytest.mark.asyncio
async def test_shap_persistence_and_repository(test_db: AsyncSession):
    """Verify storing and querying risk explanations in DB."""
    student_id = uuid4()
    pred_id = uuid4()
    
    assessment = Assessment(
        id=pred_id,
        student_id=student_id,
        mental_wellness_score=35.0,
        risk_level=RiskLevel.HIGH,
        evaluated_at=datetime.now(timezone.utc)
    )
    test_db.add(assessment)
    await test_db.commit()
    
    # Store explanations
    stored = await shap_service.explain_and_store(
        test_db,
        pred_id,
        {"anxiety": 0.8, "sentiment_score": -0.5, "self_reported_score": 14.0}
    )
    assert len(stored) == 3
    
    # Retrieve via repository
    fetched = await risk_explanation_repository.get_by_prediction_id(test_db, pred_id)
    assert len(fetched) == 3
    assert [f.rank for f in fetched] == [1, 2, 3]


@pytest.mark.asyncio
async def test_prediction_explanation_api_endpoint(client: AsyncClient, test_db: AsyncSession):
    """Test GET /api/predictions/{id}/explanation returns 200 with non-diagnostic language."""
    student = User(
        id=uuid4(),
        email="student_shap@example.com",
        password_hash=get_password_hash("Pass1234!"),
        full_name="Alex Student",
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add(student)
    await test_db.commit()
    
    pred_id = uuid4()
    assessment = Assessment(
        id=pred_id,
        student_id=student.id,
        mental_wellness_score=42.5,
        risk_level=RiskLevel.MEDIUM,
        evaluated_at=datetime.now(timezone.utc)
    )
    test_db.add(assessment)
    await test_db.commit()
    
    student_token = create_access_token(subject=str(student.id), role=student.role.value)
    
    # Query /api/predictions/{id}/explanation
    resp = await client.get(
        f"/api/predictions/{pred_id}/explanation",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    
    assert data["prediction_id"] == str(pred_id)
    assert data["wellness_score"] == 42.5
    assert data["risk_tier"] in ("MEDIUM", "HIGH", "LOW", "CRITICAL")
    assert "Factors that influenced your wellness score" in data["heading"]
    assert "These are factors that influenced your wellness score, not diagnosis factors." in data["disclaimer"]
    
    assert len(data["top_factors"]) == 3
    for factor in data["top_factors"]:
        assert "feature_name" in factor
        assert "shap_value" in factor
        assert factor["direction"] in ("increasing_risk", "decreasing_risk")
        assert factor["rank"] in (1, 2, 3)
        assert factor["impact_symbol"] in ("↑", "↓ (protective)")
        assert "description" in factor
        # Ensure non-diagnostic wording
        assert "diagnosis" not in factor["description"].lower()


@pytest.mark.asyncio
async def test_prediction_explanation_rbac_and_consent(client: AsyncClient, test_db: AsyncSession):
    """Test RBAC restrictions and counselor consent requirement."""
    student_a = User(
        id=uuid4(),
        email="student_a@example.com",
        password_hash=get_password_hash("Pass1234!"),
        full_name="Student Alpha",
        role=UserRole.STUDENT,
        is_active=True
    )
    student_b = User(
        id=uuid4(),
        email="student_b@example.com",
        password_hash=get_password_hash("Pass1234!"),
        full_name="Student Beta",
        role=UserRole.STUDENT,
        is_active=True
    )
    counselor = User(
        id=uuid4(),
        email="counselor_shap@example.com",
        password_hash=get_password_hash("Pass1234!"),
        full_name="Dr. Counselor",
        role=UserRole.COUNSELOR,
        is_active=True
    )
    test_db.add_all([student_a, student_b, counselor])
    await test_db.commit()
    
    pred_a = uuid4()
    assessment_a = Assessment(
        id=pred_a,
        student_id=student_a.id,
        mental_wellness_score=68.0,
        risk_level=RiskLevel.LOW,
        evaluated_at=datetime.now(timezone.utc)
    )
    test_db.add(assessment_a)
    await test_db.commit()
    
    student_b_token = create_access_token(subject=str(student_b.id), role=student_b.role.value)
    counselor_token = create_access_token(subject=str(counselor.id), role=counselor.role.value)
    
    # 1. Student B tries to access Student A's prediction -> 403 Forbidden
    resp = await client.get(
        f"/api/predictions/{pred_a}/explanation",
        headers={"Authorization": f"Bearer {student_b_token}"}
    )
    assert resp.status_code == 403
    
    # 2. Counselor queries Student A before consent -> 403 Forbidden
    resp_counselor = await client.get(
        f"/api/predictions/{pred_a}/explanation",
        headers={"Authorization": f"Bearer {counselor_token}"}
    )
    assert resp_counselor.status_code == 403
    
    # 3. Grant consent from Student A
    consent = Consent(
        id=uuid4(),
        student_id=student_a.id,
        status=ConsentStatus.GRANTED,
        granted_at=datetime.now(timezone.utc)
    )
    test_db.add(consent)
    await test_db.commit()
    
    # 4. Counselor queries after consent -> 200 OK
    resp_counselor_allowed = await client.get(
        f"/api/predictions/{pred_a}/explanation",
        headers={"Authorization": f"Bearer {counselor_token}"}
    )
    assert resp_counselor_allowed.status_code == 200
    assert len(resp_counselor_allowed.json()["top_factors"]) == 3
