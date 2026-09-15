from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

class CreateCounselorNoteRequest(BaseModel):
    note: str = Field(..., min_length=1, max_length=5000, description="Clinical observation or outreach notes.")

class CounselorNoteResponse(BaseModel):
    id: UUID
    alert_id: Optional[UUID] = None
    student_id: UUID
    counselor_id: UUID
    counselor_name: Optional[str] = None
    note: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CounselorNotesListResponse(BaseModel):
    notes: list[CounselorNoteResponse]
    total: int
