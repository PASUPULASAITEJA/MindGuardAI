from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from app.models.interventions import InterventionType, InterventionStatus, InterventionOutcome

class InterventionCreate(BaseModel):
    student_id: UUID
    intervention_type: InterventionType = InterventionType.CBT_BREATHING
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    target_date: Optional[datetime] = None
    follow_up_date: Optional[datetime] = None
    baseline_wellness_score: Optional[float] = None
    baseline_stress: Optional[float] = None
    clinical_notes: Optional[str] = None

class InterventionUpdate(BaseModel):
    status: Optional[InterventionStatus] = None
    outcome: Optional[InterventionOutcome] = None
    follow_up_wellness_score: Optional[float] = None
    follow_up_stress: Optional[float] = None
    follow_up_date: Optional[datetime] = None
    outcome_notes: Optional[str] = None
    clinical_notes: Optional[str] = None

class InterventionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    student_id: UUID
    counselor_id: Optional[UUID] = None
    intervention_type: InterventionType
    title: str
    description: Optional[str] = None
    status: InterventionStatus
    start_date: datetime
    target_date: Optional[datetime] = None
    follow_up_date: Optional[datetime] = None
    baseline_wellness_score: Optional[float] = None
    follow_up_wellness_score: Optional[float] = None
    baseline_stress: Optional[float] = None
    follow_up_stress: Optional[float] = None
    outcome: InterventionOutcome
    outcome_notes: Optional[str] = None
    clinical_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class InterventionSummary(BaseModel):
    total_active: int
    total_completed: int
    follow_ups_due_today: int
    observed_improvement_rate: float
