import enum
from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field

class ConsentTypeEnum(str, enum.Enum):
    JOURNAL_SHARING = "journal_sharing"
    BEHAVIORAL_TRACKING = "behavioral_tracking"
    ANONYMOUS_ANALYTICS = "anonymous_analytics"
    COUNSELOR_ACCESS = "counselor_access"

class ConsentChangeRequest(BaseModel):
    consent_type: ConsentTypeEnum = Field(..., description="Target consent category")
    granted: bool = Field(..., description="True to grant consent, False to revoke")

class ConsentBatchChangeRequest(BaseModel):
    consents: Dict[ConsentTypeEnum, bool] = Field(..., description="Map of consent types to granted flags")

class ConsentRecordItem(BaseModel):
    id: UUID
    user_id: UUID
    consent_type: str
    granted: bool
    granted_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserConsentsSummaryResponse(BaseModel):
    user_id: UUID
    journal_sharing: bool = Field(False, description="Consent to analyze and share journal reflections")
    behavioral_tracking: bool = Field(False, description="Consent to collect passive screen time & circadian sleep patterns")
    anonymous_analytics: bool = Field(False, description="Consent to include anonymized data in campus wellness research")
    counselor_access: bool = Field(False, description="Consent for counselors to view profile, alerts, and wellness timeline")
    last_updated: Optional[datetime] = None
    onboarding_completed: bool = Field(False, description="True if student has set their consent preferences at least once")

class ConsentHistoryResponse(BaseModel):
    history: List[ConsentRecordItem] = Field(default_factory=list, description="Append-only immutable audit trail")
    total: int = Field(0, description="Total history count")
