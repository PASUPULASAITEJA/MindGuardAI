from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

class DeviceRegisterRequest(BaseModel):
    device_identifier: str = Field(..., description="Unique hardware UUID or persistent machine identifier")
    device_name: str = Field(default="My Device", description="User-friendly device label")
    platform: str = Field(default="windows", description="OS platform ('windows', 'macos', 'linux', 'browser_extension')")
    os_version: Optional[str] = Field(default=None, description="Operating system details and kernel version")
    agent_version: Optional[str] = Field(default="2.0.0", description="MindGuard desktop agent or extension version")

class DeviceRegisterResponse(BaseModel):
    device_id: UUID
    device_token: str
    device_name: str
    platform: str
    is_active: bool
    features_enabled: Dict[str, bool]
    message: str

class DeviceUpdateRequest(BaseModel):
    device_name: Optional[str] = None
    is_monitoring_paused: Optional[bool] = None
    features_enabled: Optional[Dict[str, bool]] = None

class DeviceResponse(BaseModel):
    id: UUID
    device_identifier: str
    device_name: str
    platform: str
    os_version: Optional[str] = None
    agent_version: Optional[str] = None
    is_active: bool
    is_monitoring_paused: bool
    features_enabled: Dict[str, bool]
    last_sync_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ActivitySessionBatch(BaseModel):
    start_time: datetime
    end_time: datetime
    active_seconds: int = Field(default=0, ge=0)
    idle_seconds: int = Field(default=0, ge=0)
    locked_seconds: int = Field(default=0, ge=0)
    total_awake_seconds: int = Field(default=0, ge=0)
    idempotency_key: Optional[str] = None

class AppUsageBatch(BaseModel):
    app_name: str
    app_identifier: str
    category: str = "Other"
    foreground_seconds: int = Field(..., ge=0)
    launch_count: int = Field(default=1, ge=0)
    icon_hint: Optional[str] = None

class WebUsageBatch(BaseModel):
    domain: str
    browser_name: str = "Chrome"
    active_duration_seconds: int = Field(..., ge=0)
    visit_count: int = Field(default=1, ge=1)
    category: str = "General"

class SearchQueryBatch(BaseModel):
    search_engine: str = "Google"
    query_text: str
    category: str = "Academic"
    timestamp: Optional[datetime] = None

class NotificationSummaryBatch(BaseModel):
    app_name: str
    app_identifier: str
    notification_count: int = Field(default=0, ge=0)
    hourly_distribution: Optional[List[int]] = None

class DeviceSyncPayload(BaseModel):
    date: str = Field(..., description="Calendar date YYYY-MM-DD")
    sessions: Optional[List[ActivitySessionBatch]] = Field(default_factory=list)
    apps: Optional[List[AppUsageBatch]] = Field(default_factory=list)
    web: Optional[List[WebUsageBatch]] = Field(default_factory=list)
    searches: Optional[List[SearchQueryBatch]] = Field(default_factory=list)
    notifications: Optional[List[NotificationSummaryBatch]] = Field(default_factory=list)

class DeviceSyncResponse(BaseModel):
    status: str = "success"
    synced_at: datetime
    records_ingested: Dict[str, int]
    is_monitoring_paused: bool = False
    features_enabled: Dict[str, bool]

class ConsentUpdateRequest(BaseModel):
    screen_time_enabled: Optional[bool] = None
    app_tracking_enabled: Optional[bool] = None
    web_tracking_enabled: Optional[bool] = None
    search_tracking_enabled: Optional[bool] = None
    notification_tracking_enabled: Optional[bool] = None
    data_retention_days: Optional[int] = None

class DigitalWellnessConsentResponse(BaseModel):
    screen_time_enabled: bool
    app_tracking_enabled: bool
    web_tracking_enabled: bool
    search_tracking_enabled: bool
    notification_tracking_enabled: bool
    data_retention_days: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
