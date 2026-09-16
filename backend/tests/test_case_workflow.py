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
from app.models.alerts import Alert, AlertStatus
from app.models.assessments import Assessment, RiskLevel
from app.models.consent import Consent, ConsentStatus
from app.models.case_notes import CaseNote
from app.models.counselor_notes import CounselorNote
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
async def test_counselor_case_workflow(client: AsyncClient, test_db: AsyncSession):
    # 1. Setup Users: Counselor A, Counselor B, Admin, Student
    counselor_a = User(
        id=uuid4(),
        email="counselor_a@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Dr. Counselor Alpha",
        role=UserRole.COUNSELOR,
        is_active=True
    )
    counselor_b = User(
        id=uuid4(),
        email="counselor_b@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Dr. Counselor Beta",
        role=UserRole.COUNSELOR,
        is_active=True
    )
    admin = User(
        id=uuid4(),
        email="admin_case@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Clinic Director",
        role=UserRole.ADMIN,
        is_active=True
    )
    student = User(
        id=uuid4(),
        email="student_case@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Active Student Case",
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add_all([counselor_a, counselor_b, admin, student])
    await test_db.commit()

    # Active consent
    consent = Consent(
        id=uuid4(),
        student_id=student.id,
        consent_type="COUNSELOR_DATA_ACCESS",
        status=ConsentStatus.GRANTED,
        granted_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc)
    )
    test_db.add(consent)

    # Assessment and unassigned PENDING alert
    assessment = Assessment(
        id=uuid4(),
        student_id=student.id,
        mental_wellness_score=38.0,
        risk_level=RiskLevel.HIGH,
        evaluated_at=datetime.now(timezone.utc)
    )
    test_db.add(assessment)
    await test_db.flush()

    alert = Alert(
        id=uuid4(),
        student_id=student.id,
        assessment_id=assessment.id,
        status=AlertStatus.PENDING,
        severity="HIGH",
        counselor_id=None,
        created_at=datetime.now(timezone.utc)
    )
    test_db.add(alert)
    await test_db.commit()

    # Create auth tokens
    counselor_a_token = create_access_token(counselor_a.id, role="COUNSELOR", email=counselor_a.email)
    counselor_b_token = create_access_token(counselor_b.id, role="COUNSELOR", email=counselor_b.email)
    admin_token = create_access_token(admin.id, role="ADMIN", email=admin.email)
    student_token = create_access_token(student.id, role="STUDENT", email=student.email)

    counselor_a_headers = {"Authorization": f"Bearer {counselor_a_token}"}
    counselor_b_headers = {"Authorization": f"Bearer {counselor_b_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # 2. RBAC check: Student calling assignment or status or notes is blocked with 403
    assign_block = await client.patch(f"/api/v1/counselors/alerts/{alert.id}/assign", headers=student_headers)
    assert assign_block.status_code == 403

    status_block = await client.patch(
        f"/api/v1/counselors/alerts/{alert.id}/status",
        json={"status": "REVIEWED"},
        headers=student_headers
    )
    assert status_block.status_code == 403

    notes_block = await client.post(
        f"/api/v1/counselors/alerts/{alert.id}/notes",
        json={"note": "Unauthorized student note"},
        headers=student_headers
    )
    assert notes_block.status_code == 403

    # 3. Counselor A assigns alert to themselves via PATCH /alerts/{id}/assign
    assign_resp = await client.patch(
        f"/api/v1/counselors/alerts/{alert.id}/assign",
        headers=counselor_a_headers
    )
    assert assign_resp.status_code == 200, assign_resp.text
    assign_data = assign_resp.json()
    assert assign_data["counselor_id"] == str(counselor_a.id)
    assert assign_data["status"] == "REVIEWED"

    # Verify audit log for ASSIGN_ALERT_COUNSELOR
    audit_assign_stmt = select(AuditLog).where(
        AuditLog.action == "ASSIGN_ALERT_COUNSELOR",
        AuditLog.target_resource_id == str(alert.id)
    )
    audit_assign = (await test_db.execute(audit_assign_stmt)).scalar_one_or_none()
    assert audit_assign is not None
    assert audit_assign.actor_user_id == counselor_a.id
    assert audit_assign.target_user_id == student.id

    # 4. Admin reassigns alert to Counselor B
    admin_assign_resp = await client.patch(
        f"/api/v1/counselors/alerts/{alert.id}/assign",
        json={"counselor_id": str(counselor_b.id)},
        headers=admin_headers
    )
    assert admin_assign_resp.status_code == 200
    assert admin_assign_resp.json()["counselor_id"] == str(counselor_b.id)

    # 5. Counselor B records case note via POST /alerts/{id}/notes
    note_text = "Conducted clinical intake interview. Student experiencing academic exam stress."
    note_resp = await client.post(
        f"/api/v1/counselors/alerts/{alert.id}/notes",
        json={"note": note_text},
        headers=counselor_b_headers
    )
    assert note_resp.status_code == 201, note_resp.text
    note_data = note_resp.json()
    assert note_data["note"] == note_text
    assert note_data["counselor_name"] == "Dr. Counselor Beta"

    # Verify case_notes table
    case_note_stmt = select(CaseNote).where(CaseNote.alert_id == alert.id)
    case_note_rec = (await test_db.execute(case_note_stmt)).scalar_one_or_none()
    assert case_note_rec is not None
    assert case_note_rec.note == note_text
    assert case_note_rec.counselor_id == counselor_b.id
    assert case_note_rec.student_id == student.id

    # Verify counselor_notes table also populated
    counselor_note_stmt = select(CounselorNote).where(CounselorNote.alert_id == alert.id)
    counselor_note_rec = (await test_db.execute(counselor_note_stmt)).scalar_one_or_none()
    assert counselor_note_rec is not None
    assert counselor_note_rec.note == note_text

    # Verify audit log for CREATE_CASE_NOTE
    audit_note_stmt = select(AuditLog).where(
        AuditLog.action == "CREATE_CASE_NOTE",
        AuditLog.actor_user_id == counselor_b.id
    )
    audit_note = (await test_db.execute(audit_note_stmt)).scalar_one_or_none()
    assert audit_note is not None
    assert audit_note.target_user_id == student.id

    # 6. Counselor B updates alert status to RESOLVED via PATCH /alerts/{id}/status
    resolve_resp = await client.patch(
        f"/api/v1/counselors/alerts/{alert.id}/status",
        json={"status": "RESOLVED"},
        headers=counselor_b_headers
    )
    assert resolve_resp.status_code == 200, resolve_resp.text
    resolve_data = resolve_resp.json()
    assert resolve_data["status"] == "RESOLVED"
    assert resolve_data["resolved_at"] is not None

    # Verify audit log for UPDATE_ALERT_STATUS
    audit_status_stmt = select(AuditLog).where(
        AuditLog.action == "UPDATE_ALERT_STATUS",
        AuditLog.target_resource_id == str(alert.id)
    )
    audit_status = (await test_db.execute(audit_status_stmt)).scalars().all()
    assert len(audit_status) >= 1
    assert any(log.metadata_json.get("new_status") == "RESOLVED" for log in audit_status)

    # 7. Admin can reopen alert back to REVIEWED
    reopen_resp = await client.patch(
        f"/api/v1/counselors/alerts/{alert.id}/status",
        json={"status": "REVIEWED"},
        headers=admin_headers
    )
    assert reopen_resp.status_code == 200
    assert reopen_resp.json()["status"] == "REVIEWED"
