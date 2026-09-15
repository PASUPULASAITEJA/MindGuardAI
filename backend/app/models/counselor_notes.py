from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4
from sqlalchemy import DateTime, ForeignKey, Index, Text, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

if TYPE_CHECKING:
    from app.models.users import User
    from app.models.alerts import Alert

class CounselorNote(Base):
    """
    Stores clinical case notes recorded by counselors during alert triage,
    student outreach, or post-intervention consultations.
    """
    __tablename__ = "counselor_notes"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
        index=True,
        comment="Unique identifier for counselor clinical note (v4)."
    )
    alert_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("alerts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Associated alert ID if note was logged during alert workflow."
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
        comment="References USERS(id) of the counselor who authored the note."
    )
    note: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Freeform clinical observations, outreach notes, or action plans."
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
        comment="Timestamp when the note was recorded."
    )

    # Relationships
    alert: Mapped[Optional["Alert"]] = relationship("Alert", backref="notes")
    student: Mapped["User"] = relationship("User", foreign_keys=[student_id], backref="student_notes")
    counselor: Mapped["User"] = relationship("User", foreign_keys=[counselor_id], backref="authored_notes")

    __table_args__ = (
        Index("idx_counselor_notes_student", "student_id", "created_at"),
    )
