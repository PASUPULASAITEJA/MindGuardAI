from datetime import datetime, timezone, date
from typing import TYPE_CHECKING
from uuid import UUID
from sqlalchemy import Date, DateTime, ForeignKey, Index, Integer, Numeric, String, Boolean, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

if TYPE_CHECKING:
    from app.models.users import User


class SleepLog(Base):
    """
    Circadian and sleep telemetry model storing longitudinal sleep duration,
    quality (1-4), nap patterns, and nocturnal disruptions.
    """
    __tablename__ = "sleep_logs"

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
    log_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        comment="Calendar date representing sleep cycle."
    )
    bedtime: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        comment="Timestamp student went to sleep."
    )
    wake_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        comment="Timestamp student woke up."
    )
    sleep_hours: Mapped[float] = mapped_column(
        Numeric(3, 1),
        nullable=False,
        comment="Recorded sleep duration in hours."
    )
    sleep_quality: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Sleep quality score (1: Poor, 2: Fair, 3: Good, 4: Great)."
    )
    nap_taken: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Whether daytime nap was taken."
    )
    nap_duration_minutes: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Duration of daytime nap in minutes."
    )
    sleep_disruptions: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Number of nighttime awakenings."
    )
    source: Mapped[str] = mapped_column(
        String(30),
        default="self_report",
        nullable=False,
        comment="Data ingestion source (self_report, wearable, agent)."
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        index=True,
        comment="Timestamp record was created."
    )

    # Relationships
    user: Mapped["User"] = relationship()

    __table_args__ = (
        CheckConstraint("sleep_quality >= 1 AND sleep_quality <= 4", name="chk_sleep_quality_1_4"),
        CheckConstraint("sleep_hours >= 0.0 AND sleep_hours <= 24.0", name="chk_sleep_hours_range"),
        CheckConstraint("nap_duration_minutes >= 0", name="chk_nap_duration_non_negative"),
        CheckConstraint("sleep_disruptions >= 0", name="chk_disruptions_non_negative"),
        Index("idx_sleep_logs_user_date", "user_id", "log_date"),
        Index("idx_sleep_logs_user_created", "user_id", "created_at"),
    )
