from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from uuid import UUID, uuid4
from sqlalchemy import DateTime, ForeignKey, Index, Integer, Float, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.models.assessments import RiskLevel

if TYPE_CHECKING:
    from app.models.users import User

class BehavioralLog(Base):
    __tablename__ = "behavioral_logs"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
        index=True,
        comment="Unique identifier for behavioral telemetry entry (v4)."
    )
    student_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="References USERS(id) of the student generating telemetry."
    )
    date: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
        comment="Calendar date string (YYYY-MM-DD)."
    )
    total_screen_time_minutes: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Total active screen time in minutes (excluding idle intervals)."
    )
    late_night_usage_minutes: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Active computer usage between 12:00 AM and 5:00 AM."
    )
    academic_usage_minutes: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Minutes spent on academic/coding applications (VS Code, Word, Canvas, etc.)."
    )
    social_usage_minutes: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Minutes spent on social/messaging apps (Discord, WhatsApp, Telegram, etc.)."
    )
    entertainment_usage_minutes: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Minutes spent on entertainment/gaming apps (Steam, Spotify, YouTube, etc.)."
    )
    adult_usage_minutes: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Minutes detected on sensitive / adult content browsing."
    )
    continuous_screen_minutes: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Longest unbroken active session in minutes without an idle break."
    )
    is_crisis_detected: Mapped[bool] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Flag indicating if urgent crisis/self-harm search was detected today."
    )
    active_window_categories: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="JSON dictionary string of top active applications and category tallies."
    )
    baseline_deviation_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        comment="Normalized Z-score deviation from student's 14-day rolling historical baseline."
    )
    risk_level: Mapped[str] = mapped_column(
        String(20),
        default="LOW",
        nullable=False,
        comment="Behavioral risk tier ('LOW', 'MEDIUM', 'HIGH')."
    )
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
        comment="Timestamp when telemetry was synced from the PC agent."
    )

    # Relationship back to User
    student: Mapped["User"] = relationship(
        "User",
        foreign_keys=[student_id]
    )

    __table_args__ = (
        Index("ix_behavioral_student_date", "student_id", "date"),
    )
