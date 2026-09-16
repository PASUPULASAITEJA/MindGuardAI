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
from app.models.consent import Consent, ConsentStatus
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
async def test_consent_lifecycle_and_enforcement(client: AsyncClient, test_db: AsyncSession):
    # 1. Create a Student and a Counselor
    student = User(
        id=uuid4(),
        email="student_consent_first@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Consent Student",
        role=UserRole.STUDENT,
        is_active=True
    )
    counselor = User(
        id=uuid4(),
        email="counselor_consent_first@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Dr. Consent Counselor",
        role=UserRole.COUNSELOR,
        is_active=True
    )
    test_db.add(student)
    test_db.add(counselor)
    await test_db.commit()

    student_token = create_access_token(subject=student.id, role=student.role.value)
    counselor_token = create_access_token(subject=counselor.id, role=counselor.role.value)

    student_headers = {"Authorization": f"Bearer {student_token}"}
    counselor_headers = {"Authorization": f"Bearer {counselor_token}"}

    # 2. Check default consent (must auto-provision PENDING state, not GRANTED)
    res = await client.get("/api/v1/consent/me", headers=student_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["status"] == "PENDING"
    assert data["student_id"] == str(student.id)

    # 3. While consent is PENDING, sensitive endpoints MUST return 403 Forbidden!
    # 3a. Counselor tries to view mood history
    res_counselor_blocked = await client.get(
        f"/api/v1/mood/history?student_id={student.id}",
        headers=counselor_headers
    )
    assert res_counselor_blocked.status_code == 403
    assert "Consent required" in res_counselor_blocked.text

    # 3b. Student tries to submit journal for emotional analysis
    res_journal_blocked = await client.post(
        "/api/v1/journal/entries",
        json={"content": "I feel stressed and anxious today.", "self_reported_score": 4},
        headers=student_headers
    )
    assert res_journal_blocked.status_code == 403
    assert "Consent required" in res_journal_blocked.text

    # 3c. Student tries to retrieve chat conversations / memory
    res_chat_blocked = await client.get("/api/v1/chat/conversations", headers=student_headers)
    assert res_chat_blocked.status_code == 403
    assert "Consent required" in res_chat_blocked.text

    # 3d. Student tries to ingest behavioral sensor telemetry
    res_telemetry_blocked = await client.post(
        "/api/v1/chat/behavioral-features",
        json={
            "date": "2026-09-16",
            "total_screen_time_minutes": 120,
            "late_night_usage_minutes": 10,
            "academic_usage_minutes": 60,
            "social_usage_minutes": 30,
            "entertainment_usage_minutes": 30
        },
        headers=student_headers
    )
    assert res_telemetry_blocked.status_code == 403
    assert "Consent required" in res_telemetry_blocked.text

    # 4. Student explicitly GRANTS consent
    res_grant = await client.post("/api/v1/consent/me/grant", headers=student_headers)
    assert res_grant.status_code == 200
    grant_data = res_grant.json()
    assert grant_data["consent"]["status"] == "GRANTED"
    assert grant_data["consent"]["granted_at"] is not None

    # 5. Sensitive endpoints now succeed!
    # 5a. Chat conversations retrieval succeeds
    res_chat_ok = await client.get("/api/v1/chat/conversations", headers=student_headers)
    assert res_chat_ok.status_code == 200

    # 5b. Journal analysis succeeds
    res_journal_ok = await client.post(
        "/api/v1/journal/entries",
        json={"content": "Feeling much better after taking a walk.", "self_reported_score": 7},
        headers=student_headers
    )
    assert res_journal_ok.status_code == 201

    # 5c. Counselor viewing mood history succeeds
    res_counselor_ok = await client.get(
        f"/api/v1/mood/history?student_id={student.id}",
        headers=counselor_headers
    )
    assert res_counselor_ok.status_code == 200

    # 6. Student explicitly DECLINES / REVOKES consent
    res_decline = await client.post("/api/v1/consent/me/decline", headers=student_headers)
    assert res_decline.status_code == 200
    decline_data = res_decline.json()
    assert decline_data["consent"]["status"] == "REVOKED"
    assert decline_data["consent"]["revoked_at"] is not None

    # 7. Sensitive endpoints are blocked again
    res_blocked_again = await client.get(
        f"/api/v1/mood/history?student_id={student.id}",
        headers=counselor_headers
    )
    assert res_blocked_again.status_code == 403
    assert "Consent revoked" in res_blocked_again.text

    # 8. Verify audit log entries exist for all consent events
    audit_res = await test_db.execute(
        select(AuditLog).where(AuditLog.target_user_id == student.id).order_by(AuditLog.created_at.asc())
    )
    audit_entries = audit_res.scalars().all()
    actions = [entry.action for entry in audit_entries]
    assert "INIT_CONSENT_PENDING" in actions
    assert "GRANT_CONSENT" in actions
    assert "DECLINE_CONSENT" in actions
