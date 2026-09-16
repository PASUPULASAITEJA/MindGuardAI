import enum
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Index, Enum, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

if TYPE_CHECKING:
    from app.models.users import User

class ConsentType(str, enum.Enum):
    JOURNAL_SHARING = "journal_sharing"
    BEHAVIORAL_TRACKING = "behavioral_tracking"
    ANONYMOUS_ANALYTICS = "anonymous_analytics"
    COUNSELOR_ACCESS = "counselor_access"

class ConsentRecord(Base):
    """
    Append-only granular consent record tracking user decisions with immutable timestamps and IP logging.
    Enforces privacy by design across 4 distinct data sharing surfaces.
    """
    __tablename__ = "consent_records"

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
        comment="References USERS(id) of the consenting user."
    )
    consent_type: Mapped[ConsentType] = mapped_column(
        Enum(ConsentType, name="consent_type_enum", native_enum=False),
        nullable=False,
        comment="Type of consent ('journal_sharing', 'behavioral_tracking', 'anonymous_analytics', 'counselor_access')."
    )
    granted: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        comment="True if consent was actively granted; False if revoked/declined."
    )
    granted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp when consent was granted."
    )
    revoked_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp when consent was revoked."
    )
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True,
        comment="Client IP address recorded during consent change."
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        comment="Append-only submission timestamp."
    )

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        Index("idx_consent_records_user_type_created", "user_id", "consent_type", text("created_at DESC")),
    )
