import enum
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4
from sqlalchemy import String, DateTime, ForeignKey, Index, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

if TYPE_CHECKING:
    from app.models.users import User

class ConsentStatus(str, enum.Enum):
    PENDING = "PENDING"
    GRANTED = "GRANTED"
    REVOKED = "REVOKED"

class Consent(Base):
    """
    Tracks formal student consent state for counselor data access.
    Enforces privacy by design with audit timestamps (granted_at, revoked_at).
    """
    __tablename__ = "consents"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
        index=True,
        comment="Unique identifier (v4)."
    )
    student_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="References USERS(id) of the consenting student."
    )
    consent_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="COUNSELOR_DATA_ACCESS",
        comment="Type of consent granted (e.g., COUNSELOR_DATA_ACCESS)."
    )
    status: Mapped[ConsentStatus] = mapped_column(
        Enum(ConsentStatus, name="consent_status_enum", native_enum=False),
        nullable=False,
        default=ConsentStatus.PENDING,
        comment="Current consent state (PENDING | GRANTED | REVOKED)."
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
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    student: Mapped["User"] = relationship("User", backref="consents")

    __table_args__ = (
        Index("idx_consent_student_type", "student_id", "consent_type"),
    )
