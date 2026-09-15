from datetime import datetime
from typing import Optional, Dict, Any, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict

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

    model_config = ConfigDict(from_attributes=True)

class AuditLogListResponse(BaseModel):
    logs: List[AuditLogResponse]
    total: int
    page: int
    page_size: int
