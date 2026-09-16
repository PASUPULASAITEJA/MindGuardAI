from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, model_validator


class NotificationTypeEnum(str, Enum):
    RISK_ALERT = "risk_alert"
    SESSION_REMINDER = "session_reminder"
    SYSTEM = "system"
    COUNSELOR_MESSAGE = "counselor_message"


class NotificationChannelEnum(str, Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    BOTH = "both"


class NotificationCreateRequest(BaseModel):
    user_id: Optional[UUID] = Field(None, description="Target recipient user ID")
    type: NotificationTypeEnum = Field(NotificationTypeEnum.SYSTEM, description="Notification type classification")
    title: str = Field(..., max_length=255, description="Notification title")
    message: str = Field(..., description="Notification body content")
    channel: NotificationChannelEnum = Field(NotificationChannelEnum.IN_APP, description="Delivery channel")


class NotificationItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    type: str
    title: str
    message: str
    channel: str
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None


class NotificationListResponse(BaseModel):
    items: List[NotificationItemResponse]
    total: int
    unread_count: int
    notifications: Optional[List[NotificationItemResponse]] = None

    @model_validator(mode="after")
    def populate_notifications_alias(self):
        if self.notifications is None:
            self.notifications = self.items
        return self


class NotificationMarkReadResponse(BaseModel):
    success: bool
    marked_count: int
    unread_count: int


# Legacy compatibility models
class NotificationItem(BaseModel):
    id: str = Field(..., description="Unique notification ID")
    type: str = Field(..., description="Notification type")
    message: str = Field(..., description="Notification text content")
    is_read: bool = Field(default=False, description="Read flag status")
    created_at: datetime = Field(..., description="Generation timestamp")


class NotificationsResponse(BaseModel):
    notifications: List[NotificationItem]


class NotificationReadResponse(BaseModel):
    id: str
    is_read: bool
