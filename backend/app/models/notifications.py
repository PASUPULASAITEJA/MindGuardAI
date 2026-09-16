import enum
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, Index, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

if TYPE_CHECKING:
    from app.models.users import User

class NotificationType(str, enum.Enum):
    RISK_ALERT = "risk_alert"
    SESSION_REMINDER = "session_reminder"
    SYSTEM = "system"
    COUNSELOR_MESSAGE = "counselor_message"

class NotificationChannel(str, enum.Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    BOTH = "both"

class Notification(Base):
    """
    Stores system, clinical triage, appointment, and risk alerts for users.
    Supports in-app push, WebSocket real-time delivery, and email channel dispatch.
    """
    __tablename__ = "notifications"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
        index=True,
        comment="Unique identifier (v4)."
    )
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Recipient user identifier."
    )
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, name="notification_type_enum", native_enum=False),
        nullable=False,
        default=NotificationType.SYSTEM,
        comment="Notification type classification."
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Short notification title/headline."
    )
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Detailed notification body."
    )
    channel: Mapped[NotificationChannel] = mapped_column(
        Enum(NotificationChannel, name="notification_channel_enum", native_enum=False),
        nullable=False,
        default=NotificationChannel.IN_APP,
        comment="Delivery channel (in_app, email, both)."
    )
    is_read: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        comment="Whether the user has read/acknowledged the notification."
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
        comment="Creation timestamp."
    )
    read_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp when user marked notification as read."
    )

    user: Mapped["User"] = relationship("User", backref="user_notifications")

    __table_args__ = (
        Index("idx_notifications_user_created", "user_id", "created_at"),
        Index("idx_notifications_user_read", "user_id", "is_read"),
    )
