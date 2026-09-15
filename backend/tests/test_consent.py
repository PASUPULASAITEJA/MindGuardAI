import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.db.session import Base, get_db
from app.models.users import User, UserRole
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
async def test_consent_lifecycle_and_enforcement(client: AsyncClient, test_db: AsyncSession):
    # 1. Create a Student and a Counselor
    student = User(
        id=uuid4(),
        email="student_test@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Test Student",
        role=UserRole.STUDENT,
        is_active=True
    )
    counselor = User(
        id=uuid4(),
        email="counselor_test@example.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Dr. Test Counselor",
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

    # 2. Check default consent (auto-provisions GRANTED)
    res = await client.get("/api/v1/consent/me", headers=student_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["status"] == "GRANTED"
    assert data["student_id"] == str(student.id)

    # 3. Student explicitly Revokes consent
    res_revoke = await client.post("/api/v1/consent/me/revoke", headers=student_headers)
    assert res_revoke.status_code == 200
    revoke_data = res_revoke.json()
    assert revoke_data["consent"]["status"] == "REVOKED"
    assert revoke_data["consent"]["revoked_at"] is not None

    # 4. Counselor tries to view student mood history while REVOKED -> must be 403 Forbidden!
    res_blocked = await client.get(f"/api/v1/mood/history?student_id={student.id}", headers=counselor_headers)
    assert res_blocked.status_code == 403
    assert "Consent revoked" in res_blocked.text

    # 5. Counselor tries to view student latest assessment while REVOKED -> must be 403 Forbidden!
    res_pred_blocked = await client.get(f"/api/v1/predictions/assessment/latest?student_id={student.id}", headers=counselor_headers)
    assert res_pred_blocked.status_code == 403
    assert "Consent revoked" in res_pred_blocked.text

    # 6. Student grants consent again
    res_grant = await client.post("/api/v1/consent/me/grant", headers=student_headers)
    assert res_grant.status_code == 200
    grant_data = res_grant.json()
    assert grant_data["consent"]["status"] == "GRANTED"
    assert grant_data["consent"]["granted_at"] is not None

    # 7. Counselor now allowed to access mood history
    res_allowed = await client.get(f"/api/v1/mood/history?student_id={student.id}", headers=counselor_headers)
    assert res_allowed.status_code == 200
