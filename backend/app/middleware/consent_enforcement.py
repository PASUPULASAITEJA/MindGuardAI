from typing import Callable
from uuid import UUID
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.users import User, UserRole
from app.models.consent_records import ConsentType
from app.services.consent_record_service import consent_record_service

def require_consent(consent_type: ConsentType) -> Callable:
    """
    FastAPI dependency factory to enforce active student consent for sensitive data endpoints.
    Raises HTTP 403 Forbidden if the user has not granted active consent.
    """
    async def consent_dependency(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
    ) -> User:
        if current_user.role == UserRole.STUDENT:
            is_granted = await consent_record_service.check_consent(db, current_user.id, consent_type)
            if not is_granted:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Consent required: Active consent for '{consent_type.value}' is required to access or process this data."
                )
        return current_user

    return consent_dependency

# Convenience dependencies
require_journal_sharing_consent = require_consent(ConsentType.JOURNAL_SHARING)
require_behavioral_consent = require_consent(ConsentType.BEHAVIORAL_TRACKING)
require_anonymous_analytics_consent = require_consent(ConsentType.ANONYMOUS_ANALYTICS)
require_counselor_access_consent = require_consent(ConsentType.COUNSELOR_ACCESS)
