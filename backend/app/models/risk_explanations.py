import enum
from datetime import datetime, timezone
from typing import TYPE_CHECKING
from uuid import UUID, uuid4
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, Index, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

if TYPE_CHECKING:
    from app.models.assessments import Assessment

class ExplanationDirection(str, enum.Enum):
    INCREASING_RISK = "increasing_risk"
    DECREASING_RISK = "decreasing_risk"

class RiskExplanation(Base):
    """
    Persisted SHAP feature attribution record explaining clinical risk predictions.
    Stores the top contributing factors that influenced the student's wellness score.
    Strictly framed as screening indicators, NEVER diagnostic factors.
    """
    __tablename__ = "risk_explanations"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
        index=True,
        comment="Unique identifier (v4)."
    )
    prediction_id: Mapped[UUID] = mapped_column(
        ForeignKey("assessments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="References ASSESSMENTS(id) of the evaluated prediction."
    )
    feature_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Name of the model feature (e.g., 'Journal sentiment', 'PHQ-9 score')."
    )
    shap_value: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Attributed SHAP marginal contribution value."
    )
    direction: Mapped[ExplanationDirection] = mapped_column(
        Enum(ExplanationDirection, name="explanation_direction_enum", native_enum=False),
        nullable=False,
        comment="Impact direction ('increasing_risk' or 'decreasing_risk')."
    )
    rank: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Attribution priority rank (1, 2, 3)."
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        comment="Timestamp when explanation was computed."
    )

    assessment: Mapped["Assessment"] = relationship("Assessment", foreign_keys=[prediction_id])

    __table_args__ = (
        Index("idx_risk_explanations_pred_rank", "prediction_id", "rank"),
    )
