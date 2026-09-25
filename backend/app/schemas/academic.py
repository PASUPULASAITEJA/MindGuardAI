from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.models.academic import AcademicEventType

class AcademicEventCreate(BaseModel):
    title: str = Field(..., max_length=255)
    event_type: AcademicEventType
    start_date: date
    end_date: date
    academic_year: str = "2026-2027"
    semester: Optional[str] = "Fall 2026"
    department: Optional[str] = None
    description: Optional[str] = None

class AcademicEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    event_type: AcademicEventType
    start_date: date
    end_date: date
    academic_year: str
    semester: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    created_at: Optional[datetime] = None

class AcademicPeriodTrend(BaseModel):
    event_id: str
    title: str
    event_type: AcademicEventType
    start_date: date
    end_date: date
    observed_average_wellness: float
    observed_average_stress: float
    checkin_participation_rate: float
    context_note: str
