from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import UUID, uuid4
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.consent_records import ConsentRecord, ConsentType

class ConsentRecordRepository:
    async def create(
        self,
        db: AsyncSession,
        user_id: UUID,
        consent_type: ConsentType,
        granted: bool,
        ip_address: Optional[str] = None
    ) -> ConsentRecord:
        """
        Appends an immutable consent record. Never updates existing records.
        """
        now = datetime.now(timezone.utc)
        record = ConsentRecord(
            id=uuid4(),
            user_id=user_id,
            consent_type=consent_type,
            granted=granted,
            granted_at=now if granted else None,
            revoked_at=now if not granted else None,
            ip_address=ip_address,
            created_at=now
        )
        db.add(record)
        await db.flush()
        await db.refresh(record)
        return record

    async def get_active_consents(
        self,
        db: AsyncSession,
        user_id: UUID
    ) -> Dict[str, ConsentRecord]:
        """
        Retrieves the latest consent record for each consent type for this user.
        """
        stmt = (
            select(ConsentRecord)
            .where(ConsentRecord.user_id == user_id)
            .order_by(ConsentRecord.created_at.desc())
        )
        res = await db.execute(stmt)
        all_records = res.scalars().all()

        latest_by_type: Dict[str, ConsentRecord] = {}
        for r in all_records:
            type_val = r.consent_type.value if hasattr(r.consent_type, "value") else str(r.consent_type)
            if type_val not in latest_by_type:
                latest_by_type[type_val] = r
        return latest_by_type

    async def is_consent_granted(
        self,
        db: AsyncSession,
        user_id: UUID,
        consent_type: ConsentType
    ) -> bool:
        """
        Determines whether the user currently has an active grant for the given consent type.
        """
        stmt = (
            select(ConsentRecord)
            .where(
                ConsentRecord.user_id == user_id,
                ConsentRecord.consent_type == consent_type
            )
            .order_by(ConsentRecord.created_at.desc())
            .limit(1)
        )
        res = await db.execute(stmt)
        latest = res.scalars().first()
        return bool(latest and latest.granted)

    async def get_history(
        self,
        db: AsyncSession,
        user_id: UUID,
        limit: int = 100
    ) -> List[ConsentRecord]:
        """
        Fetches chronological append-only history of consent decisions for this user.
        """
        stmt = (
            select(ConsentRecord)
            .where(ConsentRecord.user_id == user_id)
            .order_by(ConsentRecord.created_at.desc())
            .limit(limit)
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

consent_record_repository = ConsentRecordRepository()
