from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.dependencies import require_role, verify_student_consent
from app.models.users import User, UserRole
from app.services.sleep_service import sleep_service
from app.schemas.sleep_logs import (
    SleepLogCreateRequest,
    SleepLogResponse,
    SleepLogListResponse,
    SleepAnalysisResponse,
)

router = APIRouter()
counselor_sleep_router = APIRouter()


@router.post(
    "",
    response_model=SleepLogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log nightly sleep session and daytime naps"
)
async def create_sleep_log(
    payload: SleepLogCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT]))
):
    """
    Records or updates a daily sleep cycle with bed time, wake time,
    calculated sleep duration, subjective quality (1-4), nap info, and disruptions.
    """
    return await sleep_service.record_sleep_log(
        db,
        student=current_user,
        payload=payload
    )


@router.get(
    "",
    response_model=SleepLogListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get authenticated student's sleep logs"
)
async def get_my_sleep_logs(
    range: str = Query("7d", description="Timeline window: '7d' or '30d'"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT]))
):
    """
    Retrieves chronological sleep log history for the authenticated student.
    """
    return await sleep_service.get_sleep_logs(
        db,
        student_id=current_user.id,
        range_str=range
    )


@router.get(
    "/analysis",
    response_model=SleepAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Get 7-day or 30-day circadian sleep consistency analysis"
)
async def get_my_sleep_analysis(
    days: int = Query(7, ge=1, le=90, description="Window in days for consistency STDDEV computation"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT]))
):
    """
    Calculates sleep_consistency_7d (standard deviation of sleep duration),
    evaluates clinical risk thresholds (avg < 6.0h, consistency > 2.0h, quality < 2.0),
    and delivers tailored sleep hygiene recommendations.
    """
    return await sleep_service.get_sleep_analysis(
        db,
        student_id=current_user.id,
        days=days
    )


@counselor_sleep_router.get(
    "/students/{student_id}/sleep",
    response_model=SleepAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Counselor view of student circadian sleep profile (consent verified)"
)
async def get_student_sleep_for_counselor(
    student_id: UUID,
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR, UserRole.ADMIN]))
):
    """
    Allows authorized counselors to view an assigned student's sleep consistency and circadian flags.
    Enforces explicit student consent verification.
    """
    await verify_student_consent(db, student_id=student_id)
    return await sleep_service.get_sleep_analysis(db, student_id=student_id, days=days)
