from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.dependencies import require_role, verify_student_consent
from app.models.users import User, UserRole
from app.services.mood_checkins import mood_checkin_service
from app.schemas.mood_checkins import (
    MoodCheckinCreateRequest,
    MoodCheckinResponse,
    MoodCheckinListResponse,
    MoodCheckinSummaryResponse,
)

router = APIRouter()
counselor_checkins_router = APIRouter()


@router.post(
    "",
    response_model=MoodCheckinResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a mood micro check-in (EMA)"
)
async def create_mood_checkin(
    payload: MoodCheckinCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT]))
):
    """
    Records a rapid morning or evening Ecological Momentary Assessment (EMA) check-in.
    Captures mood, energy, anxiety, sleep hours and quality, and primary emotion.
    """
    return await mood_checkin_service.record_checkin(
        db,
        student=current_user,
        payload=payload
    )


@router.get(
    "",
    response_model=MoodCheckinListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get authenticated student's check-ins"
)
async def get_my_checkins(
    range: str = Query("7d", description="Timeline filter: '7d' or '30d'"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT]))
):
    """
    Retrieves the chronological list of check-in records for the authenticated student.
    """
    return await mood_checkin_service.get_checkins(
        db,
        student_id=current_user.id,
        range_str=range
    )


@router.get(
    "/summary",
    response_model=MoodCheckinSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get aggregated statistics and consecutive check-in streak"
)
async def get_checkins_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT]))
):
    """
    Computes aggregated averages for mood, energy, anxiety, sleep duration,
    distribution of sleep quality and emotions, and consecutive check-in streak.
    """
    return await mood_checkin_service.get_summary(db, student_id=current_user.id)


@counselor_checkins_router.get(
    "/students/{student_id}/checkins",
    response_model=MoodCheckinListResponse,
    status_code=status.HTTP_200_OK,
    summary="Counselor view of student check-in history (consent verified)"
)
async def get_student_checkins_for_counselor(
    student_id: UUID,
    range: str = Query("30d", description="Timeline filter: '7d' or '30d'"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR, UserRole.ADMIN]))
):
    """
    Allows authorized counselors to review an assigned student's EMA trajectory.
    Strictly enforces student consent check; raises 403 Forbidden if consent is missing or revoked.
    """
    # Enforce append-only student consent check
    await verify_student_consent(db, student_id=student_id)

    return await mood_checkin_service.get_checkins(
        db,
        student_id=student_id,
        range_str=range
    )


# Alias route directly on router for /api/counsellor/students/{id}/checkins compatibility
@router.get(
    "/counsellor/students/{student_id}/checkins",
    response_model=MoodCheckinListResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False
)
async def get_student_checkins_counselor_alias(
    student_id: UUID,
    range: str = Query("30d"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR, UserRole.ADMIN]))
):
    await verify_student_consent(db, student_id=student_id)
    return await mood_checkin_service.get_checkins(db, student_id=student_id, range_str=range)
