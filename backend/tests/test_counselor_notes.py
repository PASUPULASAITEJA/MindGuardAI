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
from app.models.alerts import Alert, AlertStatus
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
async def test_counselor_notes_lifecycle(client: AsyncClient, test_db: AsyncSession):
    # 1. Create Student & Counselor
    student = User(
        id=uuid4(),
        email="notes_student@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Notes Student",
        role=UserRole.STUDENT,
        is_active=True
    )
    counselor = User(
        id=uuid4(),
        email="notes_counselor@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Dr. Clinical Notes",
        role=UserRole.COUNSELOR,
        is_active=True
    )
    test_db.add(student)
    test_db.add(counselor)
    await test_db.flush()

    # 2. Create Assessment and Alert
    assessment = Assessment(
        id=uuid4(),
        student_id=student.id,
        mental_wellness_score=45.0,
        risk_level=RiskLevel.HIGH,
        evaluated_at=datetime.now(timezone.utc)
    )
    test_db.add(assessment)
    await test_db.flush()

    alert = Alert(
        id=uuid4(),
        assessment_id=assessment.id,
        student_id=student.id,
        status=AlertStatus.PENDING,
        created_at=datetime.now(timezone.utc)
    )
    test_db.add(alert)

    # 3. Create active consent
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
    student_token = create_access_token(subject=student.id, role=student.role.value)

    counselor_headers = {"Authorization": f"Bearer {counselor_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # 4. Student tries to post a counselor note -> Blocked 403
    res_student_block = await client.post(
        f"/api/v1/counselors/alerts/{alert.id}/notes",
        json={"note": "Student writing note"},
        headers=student_headers
    )
    assert res_student_block.status_code == 403

    # 5. Counselor posts note on the alert -> 201 Created
    res_create = await client.post(
        f"/api/v1/counselors/alerts/{alert.id}/notes",
        json={"note": "Reached out to student via campus portal. Scheduled 1-on-1 check-in."},
        headers=counselor_headers
    )
    assert res_create.status_code == 201, res_create.text
    note_data = res_create.json()
    assert note_data["note"] == "Reached out to student via campus portal. Scheduled 1-on-1 check-in."
    assert note_data["counselor_name"] == "Dr. Clinical Notes"

    # 6. Retrieve notes for the alert
    res_list = await client.get(f"/api/v1/counselors/alerts/{alert.id}/notes", headers=counselor_headers)
    assert res_list.status_code == 200
    list_data = res_list.json()
    assert list_data["total"] >= 1
    assert list_data["notes"][0]["note"] == "Reached out to student via campus portal. Scheduled 1-on-1 check-in."

    # 7. Retrieve all notes for student
    res_student_notes = await client.get(f"/api/v1/counselors/students/{student.id}/notes", headers=counselor_headers)
    assert res_student_notes.status_code == 200
    assert res_student_notes.json()["total"] >= 1

    # 8. Revoke consent and verify student notes endpoint blocks counselor with 403
    consent.status = ConsentStatus.REVOKED
    await test_db.commit()

    res_blocked_notes = await client.get(f"/api/v1/counselors/students/{student.id}/notes", headers=counselor_headers)
    assert res_blocked_notes.status_code == 403
    assert "Consent revoked" in res_blocked_notes.text
