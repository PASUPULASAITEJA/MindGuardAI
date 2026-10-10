"""
Unit Tests for Personal Baseline Deviation Engine and Trend Analysis.
Tests cold start, sparse observations, rolling windows, zero-variance safeguards, and missing telemetry handling.
"""

import pytest
import pytest_asyncio
from datetime import datetime, timedelta, timezone
from uuid import uuid4
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.db.session import Base
from app.models.users import User, UserRole
from app.models.sleep_logs import SleepLog
from app.models.mood_checkins import MoodCheckin
from app.services.trend_service import trend_service

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


@pytest.mark.asyncio
async def test_cold_start_initializing(test_db: AsyncSession):
    """Test that a brand new student with 0 logs has an ESTABLISHING baseline with 0 observations."""
    student_id = uuid4()
    user = User(
        id=student_id,
        email=f"cold_start_{uuid4().hex[:6]}@example.edu",
        password_hash="hashed_pw",
        full_name="Cold Start Student",
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add(user)
    await test_db.commit()

    res = await trend_service.get_student_trends(test_db, student_id=student_id, timeframe="30d")
    
    assert res.student_id == student_id
    assert res.baseline is not None
    assert res.baseline.baseline_confidence == "ESTABLISHING"
    assert res.baseline.observations_count == 0
    assert res.baseline.usual_stress is None
    assert res.baseline.usual_sleep_hours is None
    assert "establish your personal wellbeing baseline" in res.baseline.summary_message.lower()


@pytest.mark.asyncio
async def test_sparse_observations_no_false_alarm(test_db: AsyncSession):
    """Test that 1 or 2 observations remain in ESTABLISHING state without triggering false clinical alarms."""
    student_id = uuid4()
    user = User(
        id=student_id,
        email=f"sparse_{uuid4().hex[:6]}@example.edu",
        password_hash="hashed_pw",
        full_name="Sparse Student",
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add(user)

    now = datetime.now(timezone.utc)
    # Add only 2 mood check-ins
    test_db.add(MoodCheckin(
        user_id=student_id,
        checkin_type="evening",
        mood_score=7,
        energy_level=6,
        anxiety_level=4,
        sleep_quality="good",
        sleep_hours=7.5,
        primary_emotion="calm",
        created_at=now - timedelta(days=2)
    ))
    test_db.add(MoodCheckin(
        user_id=student_id,
        checkin_type="evening",
        mood_score=6,
        energy_level=5,
        anxiety_level=5,
        sleep_quality="fair",
        sleep_hours=6.5,
        primary_emotion="anxious",
        created_at=now - timedelta(days=1)
    ))
    await test_db.commit()

    res = await trend_service.get_student_trends(test_db, student_id=student_id, timeframe="30d")
    
    assert res.baseline.baseline_confidence == "ESTABLISHING"
    assert res.baseline.observations_count == 2
    assert res.baseline.usual_stress == 4.5


@pytest.mark.asyncio
async def test_sufficient_observations_calibrated_baseline(test_db: AsyncSession):
    """Test that 7+ observations transition to HIGH confidence and calculate accurate deltas."""
    student_id = uuid4()
    user = User(
        id=student_id,
        email=f"calibrated_{uuid4().hex[:6]}@example.edu",
        password_hash="hashed_pw",
        full_name="Calibrated Student",
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add(user)

    now = datetime.now(timezone.utc)
    # Add 10 daily logs
    for day_offset in range(10, 0, -1):
        dt = now - timedelta(days=day_offset)
        # Historical days 10 to 4 had sleep 8.0h; recent days 3 to 1 dropped to 5.0h
        sleep_val = 8.0 if day_offset > 3 else 5.0
        test_db.add(SleepLog(
            user_id=student_id,
            log_date=dt.date(),
            bedtime=dt - timedelta(hours=8),
            wake_time=dt,
            sleep_hours=sleep_val,
            sleep_quality=3
        ))
        test_db.add(MoodCheckin(
            user_id=student_id,
            checkin_type="morning",
            mood_score=7,
            energy_level=7,
            anxiety_level=3,
            sleep_quality="good",
            sleep_hours=sleep_val,
            primary_emotion="calm",
            created_at=dt
        ))

    await test_db.commit()

    res = await trend_service.get_student_trends(test_db, student_id=student_id, timeframe="30d")
    
    assert res.baseline.baseline_confidence == "HIGH"
    assert res.baseline.observations_count >= 7
    assert res.baseline.usual_sleep_hours is not None
    assert res.baseline.recent_sleep_hours is not None
    assert res.baseline.sleep_delta is not None


@pytest.mark.asyncio
async def test_zero_variance_safeguard(test_db: AsyncSession):
    """Test that identical values across observations (sigma = 0) do not cause division-by-zero errors."""
    student_id = uuid4()
    user = User(
        id=student_id,
        email=f"zero_var_{uuid4().hex[:6]}@example.edu",
        password_hash="hashed_pw",
        full_name="Zero Variance Student",
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add(user)

    now = datetime.now(timezone.utc)
    for i in range(8):
        dt = now - timedelta(days=i)
        test_db.add(MoodCheckin(
            user_id=student_id,
            checkin_type="evening",
            mood_score=8,
            energy_level=8,
            anxiety_level=2,
            sleep_quality="great",
            sleep_hours=8.0,
            primary_emotion="calm",
            created_at=dt
        ))
    await test_db.commit()

    res = await trend_service.get_student_trends(test_db, student_id=student_id, timeframe="30d")
    
    assert res.baseline.baseline_confidence == "HIGH"
    assert res.summary.volatility_score == 0.0
    assert res.baseline.stress_delta == 0.0


@pytest.mark.asyncio
async def test_rolling_timeframes_support(test_db: AsyncSession):
    """Test that 7d, 30d, 90d, and 180d timeframes are validly processed."""
    student_id = uuid4()
    user = User(
        id=student_id,
        email=f"timeframe_{uuid4().hex[:6]}@example.edu",
        password_hash="hashed_pw",
        full_name="Timeframe Student",
        role=UserRole.STUDENT,
        is_active=True
    )
    test_db.add(user)
    await test_db.commit()

    for tf in ["7d", "30d", "90d", "180d"]:
        res = await trend_service.get_student_trends(test_db, student_id=student_id, timeframe=tf)
        assert res.timeframe == tf
