from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, update
from app.models.notifications import Notification, NotificationType, NotificationChannel
from app.repositories.base import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self):
        super().__init__(Notification)

    async def create_notification(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
        type: NotificationType,
        title: str,
        message: str,
        channel: NotificationChannel = NotificationChannel.IN_APP
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            channel=channel,
            is_read=False,
            created_at=datetime.now(timezone.utc)
        )
        db.add(notification)
        await db.commit()
        await db.refresh(notification)
        return notification

    async def get_for_user(
        self,
        db: AsyncSession,
        user_id: UUID,
        limit: int = 50,
        unread_only: bool = False
    ) -> List[Notification]:
        query = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            query = query.where(Notification.is_read == False)  # noqa: E712
        query = query.order_by(desc(Notification.created_at)).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_unread_count(
        self,
        db: AsyncSession,
        user_id: UUID
    ) -> int:
        query = select(func.count(Notification.id)).where(
            Notification.user_id == user_id,
            Notification.is_read == False  # noqa: E712
        )
        result = await db.execute(query)
        return result.scalar() or 0

    async def mark_as_read(
        self,
        db: AsyncSession,
        notification_id: UUID,
        user_id: UUID
    ) -> Optional[Notification]:
        notification = await self.get(db, notification_id)
        if not notification or notification.user_id != user_id:
            return None
        if not notification.is_read:
            notification.is_read = True
            notification.read_at = datetime.now(timezone.utc)
            db.add(notification)
            await db.commit()
            await db.refresh(notification)
        return notification

    async def mark_all_read_for_user(
        self,
        db: AsyncSession,
        user_id: UUID
    ) -> int:
        now = datetime.now(timezone.utc)
        stmt = (
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)  # noqa: E712
            .values(is_read=True, read_at=now)
        )
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount or 0


notification_repository = NotificationRepository()
