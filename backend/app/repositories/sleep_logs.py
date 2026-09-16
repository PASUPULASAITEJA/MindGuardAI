from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta, date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sleep_logs import SleepLog


class SleepLogRepository:
    async def create(
        self,
        db: AsyncSession,
        sleep_log: SleepLog
    ) -> SleepLog:
        db.add(sleep_log)
        await db.commit()
        await db.refresh(sleep_log)
        return sleep_log

    async def get_by_user_and_date(
        self,
        db: AsyncSession,
        user_id: UUID,
        log_date: date
    ) -> Optional[SleepLog]:
        stmt = select(SleepLog).where(
            SleepLog.user_id == user_id,
            SleepLog.log_date == log_date
        )
        res = await db.execute(stmt)
        return res.scalars().first()

    async def get_by_user(
        self,
        db: AsyncSession,
        user_id: UUID,
        days: Optional[int] = None,
        limit: int = 100
    ) -> List[SleepLog]:
        stmt = select(SleepLog).where(SleepLog.user_id == user_id)
        if days is not None and days > 0:
            since = datetime.now(timezone.utc).date() - timedelta(days=days)
            stmt = stmt.where(SleepLog.log_date >= since)

        stmt = stmt.order_by(SleepLog.log_date.desc()).limit(limit)
        res = await db.execute(stmt)
        return list(res.scalars().all())


sleep_log_repository = SleepLogRepository()
