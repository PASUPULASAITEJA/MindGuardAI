from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.consent_records import ConsentRecord, ConsentType
from app.models.consent import Consent, ConsentStatus
from app.repositories.consent_records import consent_record_repository
from app.schemas.consent_records import (
    ConsentTypeEnum,
    ConsentRecordItem,
    UserConsentsSummaryResponse,
    ConsentHistoryResponse
)
from app.services.audit_service import audit_service

class ConsentRecordService:
    async def get_user_consent_state(
        self,
        db: AsyncSession,
        user_id: UUID
    ) -> UserConsentsSummaryResponse:
        """
        Computes the current effective consent flags across all 4 surfaces.
        Defaults to False (privacy-by-design) if not yet decided.
        """
        active = await consent_record_repository.get_active_consents(db, user_id)
        
        has_any_records = len(active) > 0
        last_updated: Optional[datetime] = None

        if has_any_records:
            last_updated = max(r.created_at for r in active.values())

        return UserConsentsSummaryResponse(
            user_id=user_id,
            journal_sharing=bool(active.get(ConsentType.JOURNAL_SHARING.value) and active[ConsentType.JOURNAL_SHARING.value].granted),
            behavioral_tracking=bool(active.get(ConsentType.BEHAVIORAL_TRACKING.value) and active[ConsentType.BEHAVIORAL_TRACKING.value].granted),
            anonymous_analytics=bool(active.get(ConsentType.ANONYMOUS_ANALYTICS.value) and active[ConsentType.ANONYMOUS_ANALYTICS.value].granted),
            counselor_access=bool(active.get(ConsentType.COUNSELOR_ACCESS.value) and active[ConsentType.COUNSELOR_ACCESS.value].granted),
            last_updated=last_updated,
            onboarding_completed=has_any_records
        )

    async def record_consent_change(
        self,
        db: AsyncSession,
        user_id: UUID,
        consent_type: ConsentTypeEnum,
        granted: bool,
        ip_address: Optional[str] = None,
        actor_role: str = "STUDENT"
    ) -> UserConsentsSummaryResponse:
        """
        Appends an immutable consent decision. Also synchronizes the legacy consents table
        if counselor_access is changed, maintaining backward compatibility.
        """
        type_model = ConsentType(consent_type.value)
        record = await consent_record_repository.create(
            db=db,
            user_id=user_id,
            consent_type=type_model,
            granted=granted,
            ip_address=ip_address
        )

        # Synchronize legacy consent table for counselor access
        if type_model == ConsentType.COUNSELOR_ACCESS:
            from app.services.consent_service import consent_service
            if granted:
                await consent_service.grant_consent(db, user_id)
            else:
                await consent_service.revoke_consent(db, user_id)

        # Audit log event
        await audit_service.log_event(
            db=db,
            action="CONSENT_CHANGE",
            target_resource_type="CONSENT_RECORD",
            actor_user_id=user_id,
            actor_role=actor_role,
            target_user_id=user_id,
            target_resource_id=str(record.id),
            ip_address=ip_address,
            metadata={
                "consent_type": consent_type.value,
                "granted": granted,
                "record_id": str(record.id)
            }
        )

        await db.commit()
        return await self.get_user_consent_state(db, user_id)

    async def record_batch_consents(
        self,
        db: AsyncSession,
        user_id: UUID,
        consents: Dict[ConsentTypeEnum, bool],
        ip_address: Optional[str] = None,
        actor_role: str = "STUDENT"
    ) -> UserConsentsSummaryResponse:
        """
        Appends immutable records for a batch of consent decisions (e.g. during onboarding).
        """
        for consent_type, granted in consents.items():
            type_model = ConsentType(consent_type.value)
            record = await consent_record_repository.create(
                db=db,
                user_id=user_id,
                consent_type=type_model,
                granted=granted,
                ip_address=ip_address
            )
            if type_model == ConsentType.COUNSELOR_ACCESS:
                from app.services.consent_service import consent_service
                if granted:
                    await consent_service.grant_consent(db, user_id)
                else:
                    await consent_service.revoke_consent(db, user_id)

        await audit_service.log_event(
            db=db,
            action="CONSENT_BATCH_CHANGE",
            target_resource_type="CONSENT_RECORD",
            actor_user_id=user_id,
            actor_role=actor_role,
            target_user_id=user_id,
            ip_address=ip_address,
            metadata={
                "consents": {k.value: v for k, v in consents.items()}
            }
        )

        await db.commit()
        return await self.get_user_consent_state(db, user_id)

    async def get_user_consent_history(
        self,
        db: AsyncSession,
        user_id: UUID,
        limit: int = 100
    ) -> ConsentHistoryResponse:
        """
        Fetches chronological immutable audit records of all consent actions.
        """
        records = await consent_record_repository.get_history(db, user_id, limit=limit)
        items = [
            ConsentRecordItem(
                id=r.id,
                user_id=r.user_id,
                consent_type=r.consent_type.value if hasattr(r.consent_type, "value") else str(r.consent_type),
                granted=r.granted,
                granted_at=r.granted_at,
                revoked_at=r.revoked_at,
                ip_address=r.ip_address,
                created_at=r.created_at
            )
            for r in records
        ]
        return ConsentHistoryResponse(history=items, total=len(items))

    async def check_consent(
        self,
        db: AsyncSession,
        user_id: UUID,
        consent_type: ConsentType
    ) -> bool:
        """
        Quick check whether a given consent is actively granted.
        """
        return await consent_record_repository.is_consent_granted(db, user_id, consent_type)

consent_record_service = ConsentRecordService()
