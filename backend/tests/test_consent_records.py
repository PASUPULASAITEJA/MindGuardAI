import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select
from fastapi import APIRouter, Depends

from app.main import app
from app.db.session import Base, get_db
from app.models.users import User, UserRole
from app.models.consent_records import ConsentRecord, ConsentType
from app.models.consent import Consent, ConsentStatus
from app.models.audit_logs import AuditLog
from app.core.security import get_password_hash, create_access_token
from app.middleware.consent_enforcement import require_consent

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Setup a dummy protected test router to verify require_consent dependency
mock_protected_router = APIRouter()

@mock_protected_router.get("/test/protected-journal")
async def protected_journal_route(
    current_user: User = Depends(require_consent(ConsentType.JOURNAL_SHARING))
):
    return {"message": "Journal data accessed successfully"}

app.include_router(mock_protected_router)

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
async def test_consent_management_full_lifecycle(client: AsyncClient, test_db: AsyncSession):
    # 1. Create Student User
    student = User(
        id=uuid4(),
        email="student_consent@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Charlie Consent",
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add(student)
    await test_db.commit()

    token = create_access_token(student.id, role="STUDENT", email=student.email)
    headers = {"Authorization": f"Bearer {token}"}

    # 2. GET /api/consent on new user -> Defaults to all False (Privacy-by-Design)
    res = await client.get("/api/consent", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["journal_sharing"] is False
    assert data["behavioral_tracking"] is False
    assert data["anonymous_analytics"] is False
    assert data["counselor_access"] is False
    assert data["onboarding_completed"] is False

    # 3. Protected endpoint returns 403 before consent is granted
    res_protected = await client.get("/test/protected-journal", headers=headers)
    assert res_protected.status_code == 403
    assert "journal_sharing" in res_protected.json()["detail"]

    # 4. POST /api/consent: Grant journal_sharing
    grant_payload = {
        "consent_type": "journal_sharing",
        "granted": True
    }
    res_grant = await client.post("/api/consent", json=grant_payload, headers=headers)
    assert res_grant.status_code == 200
    state_after_grant = res_grant.json()
    assert state_after_grant["journal_sharing"] is True
    assert state_after_grant["behavioral_tracking"] is False
    assert state_after_grant["onboarding_completed"] is True

    # 5. Protected endpoint returns 200 after consent is granted
    res_protected_ok = await client.get("/test/protected-journal", headers=headers)
    assert res_protected_ok.status_code == 200
    assert res_protected_ok.json()["message"] == "Journal data accessed successfully"

    # 6. POST /api/consent: Grant counselor_access (verifies legacy table synchronization)
    counselor_payload = {
        "consent_type": "counselor_access",
        "granted": True
    }
    res_counselor = await client.post("/api/consent", json=counselor_payload, headers=headers)
    assert res_counselor.status_code == 200
    assert res_counselor.json()["counselor_access"] is True

    # Verify legacy consents table has GRANTED
    stmt_legacy = select(Consent).where(Consent.student_id == student.id)
    res_legacy = await test_db.execute(stmt_legacy)
    legacy_consent = res_legacy.scalars().first()
    assert legacy_consent is not None
    assert legacy_consent.status == ConsentStatus.GRANTED

    # 7. Append-only verification: Revoke journal_sharing (never updates prior row)
    revoke_payload = {
        "consent_type": "journal_sharing",
        "granted": False
    }
    res_revoke = await client.post("/api/consent", json=revoke_payload, headers=headers)
    assert res_revoke.status_code == 200
    assert res_revoke.json()["journal_sharing"] is False

    # 8. GET /api/consent/history: Must contain immutable chronological trail
    res_history = await client.get("/api/consent/history", headers=headers)
    assert res_history.status_code == 200
    history_data = res_history.json()
    assert history_data["total"] >= 3
    actions = [(h["consent_type"], h["granted"]) for h in history_data["history"]]
    # Latest first
    assert actions[0] == ("journal_sharing", False)
    assert actions[1] == ("counselor_access", True)
    assert actions[2] == ("journal_sharing", True)

    for entry in history_data["history"]:
        assert entry["ip_address"] is not None or entry["created_at"] is not None

    # 9. Batch onboarding setup: POST /api/consent/batch
    batch_payload = {
        "consents": {
            "journal_sharing": True,
            "behavioral_tracking": True,
            "anonymous_analytics": False,
            "counselor_access": True
        }
    }
    res_batch = await client.post("/api/consent/batch", json=batch_payload, headers=headers)
    assert res_batch.status_code == 200
    batch_state = res_batch.json()
    assert batch_state["journal_sharing"] is True
    assert batch_state["behavioral_tracking"] is True
    assert batch_state["anonymous_analytics"] is False
    assert batch_state["counselor_access"] is True

    # 10. Verify Audit Log entries generated
    stmt_audit = select(AuditLog).where(
        AuditLog.action.in_(["CONSENT_CHANGE", "CONSENT_BATCH_CHANGE"]),
        AuditLog.target_user_id == student.id
    )
    res_audit = await test_db.execute(stmt_audit)
    audit_rows = res_audit.scalars().all()
    assert len(audit_rows) >= 4
