from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4
from sqlalchemy import String, DateTime, ForeignKey, Index, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

if TYPE_CHECKING:
    from app.models.users import User

class NotificationDelivery(Base):
    """
    Tracks email and multichannel notifications dispatched to clinical staff
    during high-risk alert triggers, safety crisis events, and SOS incidents.
    Provides delivery audit trails and failure tracking.
    """
    __tablename__ = "notification_deliveries"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
        index=True,
        comment="Unique identifier for the notification delivery record (v4)."
    )
    event_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        comment="Triggering event type (e.g., HIGH_RISK_ALERT, EMERGENCY_SOS, SURVEY_HIGH_RISK)."
    )
    recipient_user_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Recipient counselor or administrator user ID if registered."
    )
    recipient_email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
        comment="Target email address where notification was dispatched."
    )
    channel: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="EMAIL",
        comment="Delivery channel (EMAIL, SMS, WEBHOOK)."
    )
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="SENT",
        comment="Delivery lifecycle status (PENDING, SENT, FAILED)."
    )
    subject: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Email subject line."
    )
    body_preview: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Redacted preview of notification content."
    )
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="SMTP or transport error message if delivery failed."
    )
    sent_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp when successfully handed off to SMTP transport."
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
        comment="Creation timestamp."
    )

    # Relationships
    recipient_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[recipient_user_id])

    __table_args__ = (
        Index("idx_notification_event_created", "event_type", "created_at"),
        Index("idx_notification_status_created", "status", "created_at"),
    )
