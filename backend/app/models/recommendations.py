from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4
from sqlalchemy import DateTime, ForeignKey, Index, Text, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

if TYPE_CHECKING:
    from app.models.users import User

class RecommendationRecord(Base):
    """
    Stores personalized wellness recommendations served to students,
    along with student feedback and completion statuses.
    """
    __tablename__ = "recommendation_records"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
        index=True,
        comment="Unique identifier for recommendation record."
    )
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="References USERS(id) of student receiving recommendation."
    )
    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Intervention category (e.g., BREATHING, GROUNDING, REFRAMING)."
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Title of recommended tool/resource."
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Actionable description."
    )
    reason: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Clinical rationale for personalized recommendation."
    )
    action_type: Mapped[str] = mapped_column(
        String(50),
        default="INTERNAL_ROUTE",
        nullable=False,
        comment="Type of destination (INTERNAL_ROUTE, EXTERNAL_URL)."
    )
    action_url: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Target route or external URL."
    )
    risk_tier: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        comment="Risk tier at recommendation generation time."
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default="ACTIVE",
        nullable=False,
        comment="Status (ACTIVE, COMPLETED, DISMISSED)."
    )
    feedback: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        comment="User feedback (HELPFUL, NOT_HELPFUL)."
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
        comment="Timestamp when recommendation was served."
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp when student completed intervention."
    )

    # Relationships
    user: Mapped["User"] = relationship()

    __table_args__ = (
        Index("idx_rec_user_status", "user_id", "status"),
        Index("idx_rec_user_created", "user_id", "created_at"),
    )
