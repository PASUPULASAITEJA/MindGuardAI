from typing import Optional
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.users import User
from app.schemas.consent_records import (
    ConsentChangeRequest,
    ConsentBatchChangeRequest,
    UserConsentsSummaryResponse,
    ConsentHistoryResponse
)
from app.services.consent_record_service import consent_record_service

consent_records_router = APIRouter()

def get_client_ip(request: Request) -> Optional[str]:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None

@consent_records_router.get(
    "",
    response_model=UserConsentsSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user consent summary across all 4 categories"
)
async def get_consents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns current active consent states for:
    - journal_sharing
    - behavioral_tracking
    - anonymous_analytics
    - counselor_access
    """
    return await consent_record_service.get_user_consent_state(db, current_user.id)

@consent_records_router.post(
    "",
    response_model=UserConsentsSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Record an append-only consent decision"
)
async def update_consent(
    payload: ConsentChangeRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Appends an immutable consent record with timestamp and client IP logging.
    Never mutates existing rows.
    """
    client_ip = get_client_ip(request)
    return await consent_record_service.record_consent_change(
        db=db,
        user_id=current_user.id,
        consent_type=payload.consent_type,
        granted=payload.granted,
        ip_address=client_ip,
        actor_role=current_user.role.value
    )

@consent_records_router.post(
    "/batch",
    response_model=UserConsentsSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Record batch consent decisions (onboarding)"
)
async def batch_update_consents(
    payload: ConsentBatchChangeRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Appends immutable consent records for multiple categories at once.
    Used during initial student onboarding flow.
    """
    client_ip = get_client_ip(request)
    return await consent_record_service.record_batch_consents(
        db=db,
        user_id=current_user.id,
        consents=payload.consents,
        ip_address=client_ip,
        actor_role=current_user.role.value
    )

@consent_records_router.get(
    "/history",
    response_model=ConsentHistoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user append-only consent audit trail"
)
async def get_consent_history(
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the complete chronological append-only audit trail of consent decisions.
    """
    return await consent_record_service.get_user_consent_history(
        db=db,
        user_id=current_user.id,
        limit=limit
    )
