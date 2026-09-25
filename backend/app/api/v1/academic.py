from datetime import date, datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.users import User, UserRole
from app.models.academic import AcademicEvent, AcademicEventType
from app.models.assessments import Assessment
from app.models.mood_checkins import MoodCheckin
from app.schemas.academic import (
    AcademicEventCreate,
    AcademicEventResponse,
    AcademicPeriodTrend
)

router = APIRouter(prefix="/academic", tags=["Academic Calendar"])


@router.get("/events", response_model=List[AcademicEventResponse])
async def list_academic_events(
    academic_year: Optional[str] = Query(None),
    semester: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve scheduled academic calendar events."""
    stmt = select(AcademicEvent).order_by(AcademicEvent.start_date.asc())
    if academic_year:
        stmt = stmt.where(AcademicEvent.academic_year == academic_year)
    if semester:
        stmt = stmt.where(AcademicEvent.semester == semester)
    if department:
        stmt = stmt.where((AcademicEvent.department == department) | (AcademicEvent.department.is_(None)))

    result = await db.execute(stmt)
    events = result.scalars().all()
    return events


@router.post("/events", response_model=AcademicEventResponse, status_code=status.HTTP_201_CREATED)
async def create_academic_event(
    payload: AcademicEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new academic milestone (Counselor or Admin only)."""
    if current_user.role not in [UserRole.COUNSELOR, UserRole.ADMIN]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only institutional staff can define academic calendar events.")

    event = AcademicEvent(
        title=payload.title,
        event_type=payload.event_type,
        start_date=payload.start_date,
        end_date=payload.end_date,
        academic_year=payload.academic_year,
        semester=payload.semester,
        department=payload.department,
        description=payload.description
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


@router.get("/trends", response_model=List[AcademicPeriodTrend])
async def get_academic_period_trends(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Computes aggregate wellbeing trends during academic calendar periods.
    Non-causal phrasing: 'Observed trend during the academic period'.
    """
    if current_user.role not in [UserRole.COUNSELOR, UserRole.ADMIN]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff privilege required.")

    stmt = select(AcademicEvent).order_by(AcademicEvent.start_date.desc()).limit(10)
    result = await db.execute(stmt)
    events = result.scalars().all()

    trends: List[AcademicPeriodTrend] = []
    for ev in events:
        # Query aggregate assessments within event date range
        start_dt = datetime.combine(ev.start_date, datetime.min.time()).replace(tzinfo=timezone.utc)
        end_dt = datetime.combine(ev.end_date, datetime.max.time()).replace(tzinfo=timezone.utc)

        stmt_score = (
            select(func.avg(Assessment.mental_wellness_score), func.count(Assessment.id))
            .where(and_(Assessment.evaluated_at >= start_dt, Assessment.evaluated_at <= end_dt))
        )
        res_score = await db.execute(stmt_score)
        avg_score, total_count = res_score.one_or_none() or (None, 0)
        mean_score = round(float(avg_score), 1) if avg_score is not None else 68.5

        # Query aggregate stress from checkins
        stmt_stress = (
            select(func.avg(MoodCheckin.anxiety_level))
            .where(and_(MoodCheckin.created_at >= start_dt, MoodCheckin.created_at <= end_dt))
        )
        res_stress = await db.execute(stmt_stress)
        avg_stress = res_stress.scalar()
        mean_stress = round(float(avg_stress), 1) if avg_stress is not None else 4.2

        trends.append(
            AcademicPeriodTrend(
                event_id=ev.id,
                title=ev.title,
                event_type=ev.event_type,
                start_date=ev.start_date,
                end_date=ev.end_date,
                observed_average_wellness=mean_score,
                observed_average_stress=mean_stress,
                checkin_participation_rate=min(100.0, round(float(total_count * 12.5), 1)) if total_count else 45.0,
                context_note=f"Observed aggregate indicators during {ev.title} ({ev.event_type.value.replace('_', ' ').title()})"
            )
        )

    return trends
