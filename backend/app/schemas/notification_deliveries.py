from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class NotificationDeliveryResponse(BaseModel):
    id: UUID
    event_type: str = Field(..., description="Triggering event type (HIGH_RISK_ALERT, EMERGENCY_SOS, etc.)")
    recipient_user_id: Optional[UUID] = None
    recipient_email: str = Field(..., description="Target email address")
    channel: str = Field(default="EMAIL", description="Delivery channel")
    status: str = Field(..., description="Delivery status (PENDING, SENT, FAILED)")
    subject: str = Field(..., description="Subject line of notification")
    body_preview: Optional[str] = None
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationDeliveriesListResponse(BaseModel):
    deliveries: List[NotificationDeliveryResponse]
    total: int
    page: int
    page_size: int
