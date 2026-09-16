import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Set, Tuple
from uuid import UUID

from fastapi import WebSocket
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notifications import Notification, NotificationType, NotificationChannel
from app.models.users import User, UserRole
from app.repositories.notifications import notification_repository
from app.services.email_service import email_service

logger = logging.getLogger("mindguard.notifications")


class WebSocketConnectionManager:
    """
    Manages active WebSocket connections mapped per authenticated user.
    Thread-safe asynchronous delivery with reconnection tolerance.
    """

    def __init__(self):
        self._active_connections: Dict[UUID, Set[WebSocket]] = {}

    async def connect(self, user_id: UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        if user_id not in self._active_connections:
            self._active_connections[user_id] = set()
        self._active_connections[user_id].add(websocket)
        logger.info(f"WebSocket connected for user {user_id}. Active count: {len(self._active_connections[user_id])}")

    def disconnect(self, user_id: UUID, websocket: WebSocket) -> None:
        if user_id in self._active_connections:
            self._active_connections[user_id].discard(websocket)
            if not self._active_connections[user_id]:
                del self._active_connections[user_id]
        logger.info(f"WebSocket disconnected for user {user_id}")

    async def send_personal_message(self, message: dict, user_id: UUID) -> None:
        sockets = self._active_connections.get(user_id, set()).copy()
        dead_sockets = set()
        for websocket in sockets:
            try:
                await websocket.send_json(message)
            except Exception as exc:
                logger.warning(f"Failed to push WebSocket message to user {user_id}: {exc}")
                dead_sockets.add(websocket)

        # Cleanup any broken sockets
        if dead_sockets and user_id in self._active_connections:
            self._active_connections[user_id] -= dead_sockets
            if not self._active_connections[user_id]:
                del self._active_connections[user_id]

    async def broadcast(self, message: dict) -> None:
        for user_id in list(self._active_connections.keys()):
            await self.send_personal_message(message, user_id)


connection_manager = WebSocketConnectionManager()


class NotificationService:
    """
    Unified notification service handling database persistence,
    real-time WebSocket broadcast, and multi-channel email delivery.
    """

    def __init__(self):
        self.repository = notification_repository
        self.manager = connection_manager

    async def create_and_dispatch(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
        type: NotificationType,
        title: str,
        message: str,
        channel: NotificationChannel = NotificationChannel.IN_APP
    ) -> Notification:
        # 1. Persist notification to database
        notification = await self.repository.create_notification(
            db,
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            channel=channel
        )

        # 2. Real-time push via WebSocket
        type_str = notification.type.value if hasattr(notification.type, "value") else str(notification.type)
        channel_str = notification.channel.value if hasattr(notification.channel, "value") else str(notification.channel)

        payload = {
            "event": "new_notification",
            "data": {
                "id": str(notification.id),
                "user_id": str(notification.user_id),
                "type": type_str,
                "title": notification.title,
                "message": notification.message,
                "channel": channel_str,
                "is_read": notification.is_read,
                "created_at": notification.created_at.isoformat(),
                "read_at": notification.read_at.isoformat() if notification.read_at else None
            }
        }
        await self.manager.send_personal_message(payload, user_id)

        # 3. Email dispatch if configured for email or both
        if channel in (NotificationChannel.EMAIL, NotificationChannel.BOTH):
            try:
                user_res = await db.execute(select(User).where(User.id == user_id))
                user = user_res.scalar_one_or_none()
                if user and user.email:
                    await email_service.send_email_notification(
                        db,
                        event_type=type_str,
                        recipient_email=user.email,
                        recipient_user_id=user.id,
                        subject=title,
                        body_text=message
                    )
            except Exception as exc:
                logger.error(f"Error dispatching notification email for user {user_id}: {exc}")

        return notification

    async def get_user_notifications(
        self,
        db: AsyncSession,
        user_id: UUID,
        limit: int = 50,
        unread_only: bool = False
    ) -> Tuple[List[Notification], int]:
        items = await self.repository.get_for_user(db, user_id, limit=limit, unread_only=unread_only)
        unread_count = await self.repository.get_unread_count(db, user_id)
        return items, unread_count

    async def mark_as_read(
        self,
        db: AsyncSession,
        notification_id: UUID,
        user_id: UUID
    ) -> Optional[Notification]:
        notification = await self.repository.mark_as_read(db, notification_id, user_id)
        if notification:
            await self.manager.send_personal_message({
                "event": "notification_read",
                "data": {"id": str(notification_id)}
            }, user_id)
        return notification

    async def mark_all_read(
        self,
        db: AsyncSession,
        user_id: UUID
    ) -> int:
        count = await self.repository.mark_all_read_for_user(db, user_id)
        if count > 0:
            await self.manager.send_personal_message({
                "event": "all_notifications_read",
                "data": {"marked_count": count}
            }, user_id)
        return count

    async def notify_high_risk(
        self,
        db: AsyncSession,
        *,
        student_id: UUID,
        student_email: str,
        risk_tier: str,
        wellness_score: float,
        assessment_id: Optional[UUID] = None
    ) -> None:
        """
        Dispatches critical intervention alerts to campus counselors and gentle resource
        reminders to the student upon HIGH/RED risk assessment categorization.
        """
        # 1. Alert counselors
        counselor_res = await db.execute(
            select(User).where(User.role == UserRole.COUNSELOR, User.is_active == True)  # noqa: E712
        )
        counselors = counselor_res.scalars().all()

        for counselor in counselors:
            await self.create_and_dispatch(
                db,
                user_id=counselor.id,
                type=NotificationType.RISK_ALERT,
                title=f"Clinical Triage Alert: High Risk Flag ({risk_tier})",
                message=(
                    f"A student check-in flagged risk tier {risk_tier} "
                    f"(Mental Wellness Score: {wellness_score:.1f}/100). "
                    f"Confidential clinical review is recommended."
                ),
                channel=NotificationChannel.BOTH
            )

        # 2. Gentle supportive check-in to the student
        await self.create_and_dispatch(
            db,
            user_id=student_id,
            type=NotificationType.SYSTEM,
            title="MindGuard Wellness Check-in",
            message=(
                "We noticed you may be experiencing extra stress today. "
                "Confidential campus counseling and self-care tools are always available."
            ),
            channel=NotificationChannel.IN_APP
        )


notification_service = NotificationService()
