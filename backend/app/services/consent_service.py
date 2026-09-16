from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.consent import Consent, ConsentStatus

class ConsentService:
    async def get_consent(
        self,
        db: AsyncSession,
        student_id: UUID,
        consent_type: str = "COUNSELOR_DATA_ACCESS"
    ) -> Optional[Consent]:
        stmt = select(Consent).where(
            Consent.student_id == student_id,
            Consent.consent_type == consent_type
        ).order_by(Consent.created_at.desc())
        res = await db.execute(stmt)
        return res.scalars().first()

    async def get_or_create_default(
        self,
        db: AsyncSession,
        student_id: UUID,
        consent_type: str = "COUNSELOR_DATA_ACCESS"
    ) -> Consent:
        consent = await self.get_consent(db, student_id, consent_type)
        if not consent:
            now = datetime.now(timezone.utc)
            consent = Consent(
                id=uuid4(),
                student_id=student_id,
                consent_type=consent_type,
                status=ConsentStatus.PENDING,
                granted_at=None,
                revoked_at=None,
                created_at=now
            )
            db.add(consent)
            await db.commit()
            await db.refresh(consent)
        return consent

    async def grant_consent(
        self,
        db: AsyncSession,
        student_id: UUID,
        consent_type: str = "COUNSELOR_DATA_ACCESS"
    ) -> Consent:
        consent = await self.get_consent(db, student_id, consent_type)
        now = datetime.now(timezone.utc)
        if not consent:
            consent = Consent(
                id=uuid4(),
                student_id=student_id,
                consent_type=consent_type,
                status=ConsentStatus.GRANTED,
                granted_at=now,
                revoked_at=None,
                created_at=now
            )
            db.add(consent)
        else:
            consent.status = ConsentStatus.GRANTED
            consent.granted_at = now
            consent.revoked_at = None

        await db.commit()
        await db.refresh(consent)
        return consent

    async def revoke_consent(
        self,
        db: AsyncSession,
        student_id: UUID,
        consent_type: str = "COUNSELOR_DATA_ACCESS"
    ) -> Consent:
        consent = await self.get_consent(db, student_id, consent_type)
        now = datetime.now(timezone.utc)
        if not consent:
            consent = Consent(
                id=uuid4(),
                student_id=student_id,
                consent_type=consent_type,
                status=ConsentStatus.REVOKED,
                granted_at=None,
                revoked_at=now,
                created_at=now
            )
            db.add(consent)
        else:
            consent.status = ConsentStatus.REVOKED
            consent.revoked_at = now

        await db.commit()
        await db.refresh(consent)
        return consent

    async def is_consent_granted(
        self,
        db: AsyncSession,
        student_id: UUID,
        consent_type: str = "COUNSELOR_DATA_ACCESS"
    ) -> bool:
        consent = await self.get_consent(db, student_id, consent_type)
        if not consent:
            return False
        return consent.status == ConsentStatus.GRANTED

consent_service = ConsentService()
