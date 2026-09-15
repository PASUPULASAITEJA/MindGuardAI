from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.db.session import get_db
from app.api.dependencies import get_current_user, require_role
from app.models.users import User, UserRole
from app.models.consent import ConsentStatus
from app.schemas.consent import ConsentResponse, ConsentActionResponse
from app.services.consent_service import consent_service

consent_router = APIRouter()

@consent_router.get(
    "/me",
    response_model=ConsentResponse,
    status_code=status.HTTP_200_OK,
    summary="Get active user consent status"
)
async def get_my_consent(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT, UserRole.COUNSELOR, UserRole.ADMIN]))
):
    """
    Returns the student's consent record for clinical data sharing.
    If no record exists yet, automatically provisions the default GRANTED state.
    """
    consent = await consent_service.get_or_create_default(db, current_user.id)
    return consent

@consent_router.post(
    "/me/grant",
    response_model=ConsentActionResponse,
    status_code=status.HTTP_200_OK,
    summary="Grant consent to share wellness insights with counselors"
)
async def grant_consent(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT, UserRole.COUNSELOR, UserRole.ADMIN]))
):
    """
    Grants or re-enables counselor access to wellness logs, trend data, and timeline history.
    """
    consent = await consent_service.grant_consent(db, current_user.id)
    return ConsentActionResponse(
        status="success",
        message="Consent granted. Counselors can view your wellness trends and case file.",
        consent=ConsentResponse.model_validate(consent)
    )

@consent_router.post(
    "/me/revoke",
    response_model=ConsentActionResponse,
    status_code=status.HTTP_200_OK,
    summary="Revoke consent to share wellness insights with counselors"
)
async def revoke_consent(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT, UserRole.COUNSELOR, UserRole.ADMIN]))
):
    """
    Revokes counselor access to student wellness data. Counselors attempting to view
    casefiles or detailed trends will receive HTTP 403 Forbidden.
    """
    consent = await consent_service.revoke_consent(db, current_user.id)
    return ConsentActionResponse(
        status="success",
        message="Consent revoked. Counselors can no longer access your wellness data or timeline.",
        consent=ConsentResponse.model_validate(consent)
    )

@consent_router.get(
    "/status/{student_id}",
    response_model=ConsentResponse,
    status_code=status.HTTP_200_OK,
    summary="Check student consent status (Counselor/Admin only)"
)
async def check_student_consent_status(
    student_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR, UserRole.ADMIN]))
):
    """
    Allows clinical staff to check whether a student has an active consent grant before opening casefiles.
    """
    consent = await consent_service.get_or_create_default(db, student_id)
    return consent
