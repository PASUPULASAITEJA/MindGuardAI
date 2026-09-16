from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from uuid import UUID
from sqlalchemy import DateTime, ForeignKey, Index, Integer, Numeric, String, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

if TYPE_CHECKING:
    from app.models.users import User


class MoodCheckin(Base):
    """
    Ecological Momentary Assessment (EMA) model storing rapid student check-ins
    (morning and evening) capturing subjective mood, energy, anxiety, and sleep.
    """
    __tablename__ = "mood_checkins"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Primary key identifier."
    )
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="References USERS(id) of student."
    )
    checkin_type: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        comment="Check-in window: morning or evening."
    )
    mood_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Subjective mood rating (1-10)."
    )
    energy_level: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Energy rating (1-10)."
    )
    anxiety_level: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Anxiety rating (1-10)."
    )
    sleep_quality: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        comment="Sleep quality rating: poor, fair, good, great."
    )
    sleep_hours: Mapped[float] = mapped_column(
        Numeric(3, 1),
        nullable=False,
        comment="Recorded hours of sleep."
    )
    primary_emotion: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="Primary emotion tag (e.g. calm, anxious, sad, happy)."
    )
    one_word_feeling: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="Optional single word feeling descriptor."
    )
    stress_source: Mapped[Optional[str]] = mapped_column(
        String(30),
        nullable=True,
        comment="Optional primary driver of current stress."
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        index=True,
        comment="Timestamp of check-in."
    )

    # Relationships
    user: Mapped["User"] = relationship()

    __table_args__ = (
        CheckConstraint("checkin_type IN ('morning', 'evening')", name="chk_checkin_type"),
        CheckConstraint("mood_score >= 1 AND mood_score <= 10", name="chk_mood_score_range"),
        CheckConstraint("energy_level >= 1 AND energy_level <= 10", name="chk_energy_level_range"),
        CheckConstraint("anxiety_level >= 1 AND anxiety_level <= 10", name="chk_anxiety_level_range"),
        CheckConstraint("sleep_quality IN ('poor', 'fair', 'good', 'great')", name="chk_sleep_quality"),
        Index("idx_mood_checkins_user_created", "user_id", "created_at"),
        Index("idx_mood_checkins_user_type", "user_id", "checkin_type"),
    )
