from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.models.consent import ConsentStatus

class ConsentResponse(BaseModel):
    id: UUID
    student_id: UUID
    consent_type: str
    status: ConsentStatus
    granted_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ConsentActionResponse(BaseModel):
    status: str
    message: str
    consent: ConsentResponse
