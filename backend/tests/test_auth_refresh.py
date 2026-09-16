import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.db.session import Base, get_db
from app.models.users import User, UserRole
from app.core.security import get_password_hash
from app.core.config import settings

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
    async with AsyncClient(transport=transport, base_url="http://localhost") as ac:
        yield ac
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_localhost_refresh_cookie_workflow(client: AsyncClient, test_db: AsyncSession):
    # 1. Create a student user
    student = User(
        id=uuid4(),
        email="test_refresh@student.edu",
        password_hash=get_password_hash("Password123!"),
        full_name="Localhost Tester",
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add(student)
    await test_db.commit()

    # 2. Login on localhost (HTTP)
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "test_refresh@student.edu", "password": "Password123!"}
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    data = login_resp.json()
    assert "access_token" in data
    assert "refresh_token" in data

    # 3. Check refresh_token cookie attributes for localhost / dev
    cookie_header = login_resp.headers.get("set-cookie", "")
    assert "refresh_token=" in cookie_header
    assert "HttpOnly" in cookie_header or "httponly" in cookie_header.lower()
    
    # In development mode, secure must be False to allow localhost HTTP
    if settings.ENVIRONMENT.lower() == "development":
        assert "Secure" not in cookie_header

    # 4. Refresh token using the cookie captured by client
    refresh_resp = await client.post("/api/v1/auth/refresh")
    assert refresh_resp.status_code == 200, f"Refresh failed: {refresh_resp.text}"
    refresh_data = refresh_resp.json()
    assert "access_token" in refresh_data
    assert refresh_data["access_token"] != ""
    assert "refresh_token" in refresh_data

    # Verify new cookie was also set on rotation
    rot_cookie_header = refresh_resp.headers.get("set-cookie", "")
    assert "refresh_token=" in rot_cookie_header

    # 5. Refresh without cookie should fail with 401
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://localhost") as no_cookie_client:
        fail_resp = await no_cookie_client.post("/api/v1/auth/refresh")
        assert fail_resp.status_code == 401
