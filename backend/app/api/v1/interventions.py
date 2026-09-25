from datetime import datetime, timezone, timedelta
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.users import User, UserRole
from app.models.interventions import Intervention, InterventionStatus, InterventionOutcome
from app.schemas.interventions import (
    InterventionCreate,
    InterventionUpdate,
    InterventionResponse,
    InterventionSummary
)

router = APIRouter(prefix="/interventions", tags=["Interventions"])


@router.get("/me", response_model=List[InterventionResponse])
async def get_my_interventions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all interventions assigned to the currently authenticated student."""
    stmt = (
        select(Intervention)
        .where(Intervention.student_id == current_user.id)
        .order_by(Intervention.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/student/{student_id}", response_model=List[InterventionResponse])
async def get_student_interventions(
    student_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve interventions for a specific student (Accessible by Counselors and Admins)."""
    if current_user.role not in [UserRole.COUNSELOR, UserRole.ADMIN] and current_user.id != student_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    stmt = (
        select(Intervention)
        .where(Intervention.student_id == student_id)
        .order_by(Intervention.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=InterventionResponse, status_code=status.HTTP_201_CREATED)
async def create_intervention(
    payload: InterventionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new intervention assignment."""
    counselor_id = current_user.id if current_user.role in [UserRole.COUNSELOR, UserRole.ADMIN] else None

    # Default follow-up date to 14 days if not specified
    follow_up = payload.follow_up_date or (datetime.now(timezone.utc) + timedelta(days=14))

    intervention = Intervention(
        student_id=payload.student_id,
        counselor_id=counselor_id,
        intervention_type=payload.intervention_type,
        title=payload.title,
        description=payload.description,
        status=InterventionStatus.ACTIVE,
        target_date=payload.target_date,
        follow_up_date=follow_up,
        baseline_wellness_score=payload.baseline_wellness_score,
        baseline_stress=payload.baseline_stress,
        clinical_notes=payload.clinical_notes,
    )
    db.add(intervention)
    await db.commit()
    await db.refresh(intervention)
    return intervention


@router.patch("/{intervention_id}", response_model=InterventionResponse)
async def update_intervention(
    intervention_id: UUID,
    payload: InterventionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update intervention status, clinical follow-up observations, and outcomes."""
    stmt = select(Intervention).where(Intervention.id == intervention_id)
    result = await db.execute(stmt)
    intervention = result.scalar_one_or_none()

    if not intervention:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intervention not found.")

    if current_user.role not in [UserRole.COUNSELOR, UserRole.ADMIN] and current_user.id != intervention.student_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    if payload.status is not None:
        intervention.status = payload.status
    if payload.outcome is not None:
        intervention.outcome = payload.outcome
    if payload.follow_up_wellness_score is not None:
        intervention.follow_up_wellness_score = payload.follow_up_wellness_score
        # Automatically determine outcome if scores exist
        if intervention.baseline_wellness_score is not None:
            diff = intervention.follow_up_wellness_score - intervention.baseline_wellness_score
            if diff >= 5.0:
                intervention.outcome = InterventionOutcome.IMPROVED
            elif diff <= -5.0:
                intervention.outcome = InterventionOutcome.DECLINED
            else:
                intervention.outcome = InterventionOutcome.STABLE
    if payload.follow_up_stress is not None:
        intervention.follow_up_stress = payload.follow_up_stress
    if payload.follow_up_date is not None:
        intervention.follow_up_date = payload.follow_up_date
    if payload.outcome_notes is not None:
        intervention.outcome_notes = payload.outcome_notes
    if payload.clinical_notes is not None and current_user.role in [UserRole.COUNSELOR, UserRole.ADMIN]:
        intervention.clinical_notes = payload.clinical_notes

    intervention.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(intervention)
    return intervention


@router.get("/counselor/summary", response_model=InterventionSummary)
async def get_counselor_intervention_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Counselor executive KPI summary of active interventions, follow-ups due, and observed improvement rate."""
    if current_user.role not in [UserRole.COUNSELOR, UserRole.ADMIN]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    today_end = today_start + timedelta(days=1)

    # Active count
    stmt_active = select(func.count()).select_from(Intervention).where(Intervention.status == InterventionStatus.ACTIVE)
    active_count = (await db.execute(stmt_active)).scalar() or 0

    # Completed count
    stmt_completed = select(func.count()).select_from(Intervention).where(Intervention.status == InterventionStatus.COMPLETED)
    completed_count = (await db.execute(stmt_completed)).scalar() or 0

    # Follow-ups due today
    stmt_due = select(func.count()).select_from(Intervention).where(
        and_(
            Intervention.status == InterventionStatus.ACTIVE,
            Intervention.follow_up_date >= today_start,
            Intervention.follow_up_date < today_end
        )
    )
    due_today = (await db.execute(stmt_due)).scalar() or 0

    # Observed improvement rate
    stmt_improved = select(func.count()).select_from(Intervention).where(Intervention.outcome == InterventionOutcome.IMPROVED)
    improved_count = (await db.execute(stmt_improved)).scalar() or 0

    total_evaluated = active_count + completed_count
    rate = round((improved_count / total_evaluated * 100), 1) if total_evaluated > 0 else 0.0

    return InterventionSummary(
        total_active=active_count,
        total_completed=completed_count,
        follow_ups_due_today=due_today,
        observed_improvement_rate=rate
    )
