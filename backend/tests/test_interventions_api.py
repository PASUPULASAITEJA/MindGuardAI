import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.db.session import Base, get_db
from app.models.users import User, UserRole
from app.models.interventions import Intervention, InterventionType, InterventionStatus, InterventionOutcome
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
async def test_intervention_crud_and_outcome_tracking(client: AsyncClient, test_db: AsyncSession):
    # 1. Create student and counselor
    student = User(
        id=uuid4(),
        email="student.test@wellness.edu",
        password_hash=get_password_hash("StudentPass123!"),
        role=UserRole.STUDENT,
        is_active=True
    )
    counselor = User(
        id=uuid4(),
        email="counselor.test@wellness.edu",
        password_hash=get_password_hash("CounselorPass123!"),
        role=UserRole.COUNSELOR,
        is_active=True
    )
    test_db.add_all([student, counselor])
    await test_db.commit()

    counselor_token = create_access_token(subject=str(counselor.id), role=counselor.role.value, email=counselor.email)
    student_token = create_access_token(subject=str(student.id), role=student.role.value, email=student.email)

    counselor_headers = {"Authorization": f"Bearer {counselor_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # 2. Counselor assigns intervention to student
    payload = {
        "student_id": str(student.id),
        "intervention_type": "CBT_BREATHING",
        "title": "Cognitive Reframing Routine",
        "description": "Daily 10-minute thought reframing exercise.",
        "baseline_wellness_score": 52.0,
        "baseline_stress": 7.4,
        "follow_up_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    }
    resp = await client.post("/api/v1/interventions", json=payload, headers=counselor_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Cognitive Reframing Routine"
    assert data["status"] == "ACTIVE"
    assert data["baseline_stress"] == 7.4
    intervention_id = data["id"]

    # 3. Student views their active interventions
    student_resp = await client.get("/api/v1/interventions/me", headers=student_headers)
    assert student_resp.status_code == 200
    student_interventions = student_resp.json()
    assert len(student_interventions) == 1
    assert student_interventions[0]["id"] == intervention_id

    # 4. Counselor updates outcome following follow-up
    update_payload = {
        "status": "COMPLETED",
        "outcome": "IMPROVED",
        "follow_up_wellness_score": 75.0,
        "follow_up_stress": 3.8,
        "outcome_notes": "Observed reduction in academic stress following grounding protocols."
    }
    patch_resp = await client.patch(f"/api/v1/interventions/{intervention_id}", json=update_payload, headers=counselor_headers)
    assert patch_resp.status_code == 200
    updated_data = patch_resp.json()
    assert updated_data["status"] == "COMPLETED"
    assert updated_data["outcome"] == "IMPROVED"
    assert updated_data["follow_up_stress"] == 3.8

    # 5. Counselor summary metrics
    summary_resp = await client.get("/api/v1/interventions/counselor/summary", headers=counselor_headers)
    assert summary_resp.status_code == 200
    summary = summary_resp.json()
    assert summary["total_completed"] == 1
    assert summary["observed_improvement_rate"] == 100.0
