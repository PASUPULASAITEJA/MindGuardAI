import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, DateTime, Text, Float, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
from app.db.session import Base

class InterventionType(str, enum.Enum):
    CBT_BREATHING = "CBT_BREATHING"
    MINDFULNESS = "MINDFULNESS"
    SLEEP_HYGIENE = "SLEEP_HYGIENE"
    COUNSELOR_CONSULTATION = "COUNSELOR_CONSULTATION"
    ACADEMIC_WORKSHOP = "ACADEMIC_WORKSHOP"
    PEER_SUPPORT = "PEER_SUPPORT"
    CRISIS_MANAGEMENT = "CRISIS_MANAGEMENT"
    CUSTOM = "CUSTOM"

class InterventionStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    DISCONTINUED = "DISCONTINUED"

class InterventionOutcome(str, enum.Enum):
    IMPROVED = "IMPROVED"
    STABLE = "STABLE"
    DECLINED = "DECLINED"
    INCONCLUSIVE = "INCONCLUSIVE"
    PENDING_EVALUATION = "PENDING_EVALUATION"

class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    counselor_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    intervention_type = Column(SQLEnum(InterventionType), nullable=False, default=InterventionType.CBT_BREATHING)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(InterventionStatus), nullable=False, default=InterventionStatus.ACTIVE, index=True)

    start_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    target_date = Column(DateTime(timezone=True), nullable=True)
    follow_up_date = Column(DateTime(timezone=True), nullable=True, index=True)

    # Observed outcome metrics
    baseline_wellness_score = Column(Float, nullable=True)
    follow_up_wellness_score = Column(Float, nullable=True)
    baseline_stress = Column(Float, nullable=True)
    follow_up_stress = Column(Float, nullable=True)

    outcome = Column(SQLEnum(InterventionOutcome), nullable=False, default=InterventionOutcome.PENDING_EVALUATION)
    outcome_notes = Column(Text, nullable=True)
    clinical_notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    student = relationship("User", foreign_keys=[student_id], backref="assigned_interventions")
    counselor = relationship("User", foreign_keys=[counselor_id], backref="supervised_interventions")
