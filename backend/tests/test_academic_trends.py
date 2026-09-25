import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
from datetime import datetime, timezone, timedelta, date
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.db.session import Base, get_db
from app.models.users import User, UserRole
from app.models.academic import AcademicEvent, AcademicEventType
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
async def test_academic_events_and_trends(client: AsyncClient, test_db: AsyncSession):
    # 1. Create admin user
    admin = User(
        id=uuid4(),
        email="admin.academic@wellness.edu",
        password_hash=get_password_hash("AdminPass123!"),
        role=UserRole.ADMIN,
        is_active=True
    )
    test_db.add(admin)
    await test_db.commit()

    admin_token = create_access_token(subject=str(admin.id), role=admin.role.value, email=admin.email)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Add an academic milestone event
    event_payload = {
        "title": "Fall Midterm Exams",
        "event_type": "MIDTERMS",
        "start_date": "2026-10-15",
        "end_date": "2026-10-28",
        "academic_year": "2026-2027",
        "semester": "Fall",
        "description": "Mid-semester evaluations across university engineering departments."
    }
    resp = await client.post("/api/v1/academic/events", json=event_payload, headers=admin_headers)
    assert resp.status_code == 201
    created_event = resp.json()
    assert created_event["title"] == "Fall Midterm Exams"

    # 3. Query events list
    list_resp = await client.get("/api/v1/academic/events", headers=admin_headers)
    assert list_resp.status_code == 200
    events = list_resp.json()
    assert len(events) >= 1

    # 4. Query aggregate trends during academic periods (k-anonymity privacy protected)
    trends_resp = await client.get("/api/v1/academic/trends", headers=admin_headers)
    assert trends_resp.status_code == 200
    trend_periods = trends_resp.json()
    assert len(trend_periods) >= 1
    assert "observed_average_stress" in trend_periods[0]
    assert "observed_average_wellness" in trend_periods[0]
