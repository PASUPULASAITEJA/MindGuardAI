from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from app.models.alerts import AlertStatus

class AlertItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    student_id: UUID
    assessment_id: UUID
    status: AlertStatus
    severity: str = "HIGH"
    counselor_id: Optional[UUID] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

class SOSHelpline(BaseModel):
    name: str
    number: str
    badge: str
    description: str

class SOSResponse(BaseModel):
    status: str
    message: str
    alert_id: str
    severity: str = "CRITICAL"
    created_at: Optional[str] = None
    helplines: List[SOSHelpline]

class ActiveAlertsResponse(BaseModel):
    alerts: List[AlertItem]
    total: int

class AlertUpdateRequest(BaseModel):
    status: AlertStatus

class AssignAlertRequest(BaseModel):
    counselor_id: Optional[UUID] = None

class AlertUpdateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: AlertStatus
    counselor_id: Optional[UUID] = None
    severity: Optional[str] = "HIGH"
    resolved_at: Optional[datetime] = None
    message: Optional[str] = "Alert updated successfully."
