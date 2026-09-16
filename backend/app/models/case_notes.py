from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4
from sqlalchemy import DateTime, ForeignKey, Index, Text, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

if TYPE_CHECKING:
    from app.models.users import User
    from app.models.alerts import Alert

class CaseNote(Base):
    """
    Stores clinical case notes and case management observations recorded
    by counselors or admins during alert triage, case reviews, or student consultations.
    """
    __tablename__ = "case_notes"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
        index=True,
        comment="Unique identifier for case note (v4)."
    )
    alert_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("alerts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Associated alert ID if note was recorded during alert case workflow."
    )
    student_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="References USERS(id) of the student receiving care."
    )
    counselor_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        comment="References USERS(id) of the counselor/admin author."
    )
    note: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Freeform clinical observations, outreach notes, or action plans."
    )
    category: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        default="GENERAL",
        comment="Clinical triage note category."
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
        comment="Timestamp when the note was recorded."
    )

    # Relationships
    alert: Mapped[Optional["Alert"]] = relationship("Alert", foreign_keys=[alert_id])
    student: Mapped["User"] = relationship("User", foreign_keys=[student_id])
    counselor: Mapped["User"] = relationship("User", foreign_keys=[counselor_id])

    __table_args__ = (
        Index("idx_case_notes_alert", "alert_id", "created_at"),
        Index("idx_case_notes_student", "student_id", "created_at"),
    )
