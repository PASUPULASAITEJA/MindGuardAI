from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.recommendations import RecommendationRecord


class RecommendationRepository:
    async def get_active_for_user(
        self,
        db: AsyncSession,
        user_id: UUID,
        limit: int = 6
    ) -> List[RecommendationRecord]:
        """
        Retrieves current active recommendation records for the student.
        """
        stmt = (
            select(RecommendationRecord)
            .where(
                RecommendationRecord.user_id == user_id,
                RecommendationRecord.status == "ACTIVE"
            )
            .order_by(RecommendationRecord.created_at.desc())
            .limit(limit)
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    async def get_by_id_and_user(
        self,
        db: AsyncSession,
        rec_id: UUID,
        user_id: UUID
    ) -> Optional[RecommendationRecord]:
        stmt = select(RecommendationRecord).where(
            RecommendationRecord.id == rec_id,
            RecommendationRecord.user_id == user_id
        )
        res = await db.execute(stmt)
        return res.scalars().first()

    async def create_batch(
        self,
        db: AsyncSession,
        records: List[RecommendationRecord]
    ) -> List[RecommendationRecord]:
        db.add_all(records)
        await db.commit()
        for r in records:
            await db.refresh(r)
        return records

    async def update_status_and_feedback(
        self,
        db: AsyncSession,
        record: RecommendationRecord,
        feedback: Optional[str] = None,
        status: Optional[str] = None
    ) -> RecommendationRecord:
        if feedback is not None:
            record.feedback = feedback
        if status is not None:
            record.status = status
            if status == "COMPLETED":
                record.completed_at = datetime.now(timezone.utc)
        db.add(record)
        await db.commit()
        await db.refresh(record)
        return record


recommendation_repository = RecommendationRepository()
