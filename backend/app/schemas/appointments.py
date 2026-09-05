from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.appointments import AppointmentStatus, AppointmentType

class AppointmentCreateRequest(BaseModel):
    scheduled_time: datetime = Field(..., description="ISO 8601 formatted appointment datetime")
    appointment_type: AppointmentType = Field(default=AppointmentType.VIRTUAL, description="Session format")
    counselor_id: Optional[UUID] = Field(None, description="Optional specific counselor UUID")
    reason: Optional[str] = Field(None, max_length=255, description="Reason for scheduling appointment")

class AppointmentStatusUpdateRequest(BaseModel):
    status: AppointmentStatus = Field(..., description="Updated appointment status")
    notes: Optional[str] = Field(None, description="Counselor clinical notes")

class AppointmentResponse(BaseModel):
    id: UUID
    student_id: UUID
    counselor_id: Optional[UUID] = None
    appointment_type: AppointmentType
    scheduled_time: datetime
    status: AppointmentStatus
    reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AppointmentListResponse(BaseModel):
    appointments: List[AppointmentResponse]
    total: int
