from datetime import datetime
from typing import Optional, Dict, Any, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, model_validator

class AuditLogResponse(BaseModel):
    id: UUID
    actor_user_id: Optional[UUID] = None
    actor_name: Optional[str] = None
    actor_role: str
    action: str
    target_user_id: Optional[UUID] = None
    target_user_name: Optional[str] = None
    target_resource_type: str
    target_resource_id: Optional[str] = None
    request_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    # Feature 2 spec fields / aliases
    user_id: Optional[UUID] = None
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def populate_aliases(self) -> "AuditLogResponse":
        if self.user_id is None:
            self.user_id = self.actor_user_id or self.target_user_id
        if self.resource_type is None:
            self.resource_type = self.target_resource_type
        if self.resource_id is None:
            self.resource_id = self.target_resource_id
        if self.details is None:
            self.details = self.metadata_json
        if self.timestamp is None:
            self.timestamp = self.created_at
        return self

class AuditLogListResponse(BaseModel):
    logs: List[AuditLogResponse]
    total: int
    page: int
    page_size: int
