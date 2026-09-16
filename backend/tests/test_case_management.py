import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.db.session import Base, get_db
from app.models.users import User, UserRole
from app.models.alerts import Alert, AlertStatus
from app.models.assessments import Assessment, RiskLevel
from app.models.consent import Consent, ConsentStatus
from app.core.security import get_password_hash, create_access_token
from app.repositories.case_notes import case_note_repository
from app.services.casefile_service import casefile_service

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
async def test_case_notes_repository(test_db: AsyncSession):
    """Verify CaseNoteRepository creates, retrieves by student, and retrieves by alert."""
    student_id = uuid4()
    counselor_id = uuid4()

    student = User(
        id=student_id,
        email="case_student@example.com",
        password_hash=get_password_hash("Pass123!"),
        role=UserRole.STUDENT,
        is_active=True
    )
    counselor = User(
        id=counselor_id,
        email="case_counselor@example.com",
        password_hash=get_password_hash("Pass123!"),
        role=UserRole.COUNSELOR,
        is_active=True
    )
    test_db.add_all([student, counselor])
    await test_db.commit()

    note = await case_note_repository.create_note(
        test_db,
        student_id=student_id,
        counselor_id=counselor_id,
        note="Initial intake consultation completed. Student receptive to grounding techniques.",
        category="CONSULTATION"
    )
    assert note.id is not None
    assert note.category == "CONSULTATION"

    student_notes = await case_note_repository.get_for_student(test_db, student_id)
    assert len(student_notes) == 1
    assert student_notes[0].id == note.id


@pytest.mark.asyncio
async def test_counselor_case_management_api(client: AsyncClient, test_db: AsyncSession):
    """Verify alert assignment, status update, clinical note creation, and casefile access."""
    student_id = uuid4()
    counselor_id = uuid4()

    student = User(
        id=student_id,
        email="stu_case@example.com",
        password_hash=get_password_hash("Pass123!"),
        role=UserRole.STUDENT,
        is_active=True
    )
    counselor = User(
        id=counselor_id,
        email="coun_case@example.com",
        password_hash=get_password_hash("Pass123!"),
        role=UserRole.COUNSELOR,
        is_active=True
    )
    test_db.add_all([student, counselor])
    await test_db.commit()

    # Active consent
    consent = Consent(
        student_id=student_id,
        consent_type="COUNSELOR_DATA_ACCESS",
        status=ConsentStatus.GRANTED
    )
    test_db.add(consent)

    # Assessment and Alert
    assessment = Assessment(
        student_id=student_id,
        mental_wellness_score=32.0,
        risk_level=RiskLevel.HIGH,
        evaluated_at=datetime.now(timezone.utc)
    )
    test_db.add(assessment)
    await test_db.flush()

    alert = Alert(
        assessment_id=assessment.id,
        student_id=student_id,
        counselor_id=None,
        status=AlertStatus.PENDING,
        created_at=datetime.now(timezone.utc)
    )
    test_db.add(alert)
    await test_db.commit()

    counselor_token = create_access_token(subject=str(counselor_id), role="COUNSELOR", email=counselor.email)
    headers = {"Authorization": f"Bearer {counselor_token}"}

    # 1. Self-assign alert
    assign_res = await client.patch(
        f"/api/v1/counselors/alerts/{alert.id}/assign",
        headers=headers,
        json={"counselor_id": str(counselor_id)}
    )
    assert assign_res.status_code == 200
    assert assign_res.json()["status"] == "REVIEWED"
    assert assign_res.json()["counselor_id"] == str(counselor_id)

    # 2. Add clinical note
    note_res = await client.post(
        f"/api/v1/counselors/alerts/{alert.id}/notes",
        headers=headers,
        json={"note": "Contacted student via email to schedule triage session."}
    )
    assert note_res.status_code == 201
    assert "Contacted student" in note_res.json()["note"]

    # 3. Transition alert to RESOLVED
    status_res = await client.patch(
        f"/api/v1/counselors/alerts/{alert.id}/status",
        headers=headers,
        json={"status": "RESOLVED"}
    )
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "RESOLVED"
    assert status_res.json()["resolved_at"] is not None

    # 4. Fetch unified student casefile
    casefile_res = await client.get(
        f"/api/v1/counselors/students/{student_id}/casefile?days=30",
        headers=headers
    )
    assert casefile_res.status_code == 200
    case_data = casefile_res.json()
    assert case_data["student"]["id"] == str(student_id)
    assert len(case_data["timeline"]) >= 1
