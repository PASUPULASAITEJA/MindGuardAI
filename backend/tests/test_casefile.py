import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.db.session import Base, get_db
from app.models.users import User, UserRole
from app.models.assessments import Assessment, RiskLevel
from app.models.consent import Consent, ConsentStatus
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
async def test_casefile_retrieval_and_consent_lock(client: AsyncClient, test_db: AsyncSession):
    # 1. Create Student & Counselor
    student = User(
        id=uuid4(),
        email="casefile_student@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Casefile Student",
        role=UserRole.STUDENT,
        is_active=True
    )
    counselor = User(
        id=uuid4(),
        email="casefile_counselor@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Dr. Clinical Supervisor",
        role=UserRole.COUNSELOR,
        is_active=True
    )
    test_db.add(student)
    test_db.add(counselor)
    await test_db.flush()

    # 2. Add an assessment
    assessment = Assessment(
        id=uuid4(),
        student_id=student.id,
        mental_wellness_score=68.5,
        risk_level=RiskLevel.MEDIUM,
        evaluated_at=datetime.now(timezone.utc)
    )
    test_db.add(assessment)

    # 3. Add default granted consent
    consent = Consent(
        id=uuid4(),
        student_id=student.id,
        consent_type="COUNSELOR_DATA_ACCESS",
        status=ConsentStatus.GRANTED,
        granted_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc)
    )
    test_db.add(consent)
    await test_db.commit()

    counselor_token = create_access_token(subject=counselor.id, role=counselor.role.value)
    headers = {"Authorization": f"Bearer {counselor_token}"}

    # 4. Counselor fetches casefile -> Should succeed (200)
    res = await client.get(f"/api/v1/counselors/students/{student.id}/casefile?days=90", headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["student"]["email"] == "casefile_student@example.com"
    assert data["student"]["consent_status"] == "GRANTED"
    assert len(data["timeline"]) >= 1
    assert data["timeline"][0]["event_type"] == "ASSESSMENT"

    # 5. Revoke consent
    consent.status = ConsentStatus.REVOKED
    consent.revoked_at = datetime.now(timezone.utc)
    await test_db.commit()

    # 6. Counselor attempts to fetch casefile -> Should be blocked (403)
    res_blocked = await client.get(f"/api/v1/counselors/students/{student.id}/casefile?days=90", headers=headers)
    assert res_blocked.status_code == 403
    assert "Consent revoked" in res_blocked.text
