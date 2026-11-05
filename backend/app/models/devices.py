import enum
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, TYPE_CHECKING
from uuid import UUID, uuid4
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Index, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

if TYPE_CHECKING:
    from app.models.users import User
    from app.models.digital_activity import (
        AppUsageRecord,
        WebActivityRecord,
        SearchActivityRecord,
        NotificationSummaryRecord,
        DeviceActivitySession
    )

class DevicePlatform(str, enum.Enum):
    WINDOWS = "windows"
    MACOS = "macos"
    LINUX = "linux"
    BROWSER_EXTENSION = "browser_extension"
    UNKNOWN = "unknown"

class UserDevice(Base):
    """
    Represents an authorized desktop or browser client connected to a student's account.
    Supports multi-user and multi-device tracking with device-level token authentication.
    """
    __tablename__ = "user_devices"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
        index=True,
        comment="Unique identifier for the device (v4)."
    )
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="References USERS(id) of the student who owns this device."
    )
    device_identifier: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
        comment="Hardware UUID or unique machine fingerprint."
    )
    device_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="My Device",
        comment="User-friendly name (e.g. 'Sai's Windows Laptop', 'Lab Workstation')."
    )
    platform: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="windows",
        comment="Operating system ('windows', 'macos', 'linux', 'browser_extension')."
    )
    os_version: Mapped[Optional[str]] = mapped_column(
        String(150),
        nullable=True,
        comment="OS build and kernel version details."
    )
    agent_version: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        default="2.0.0",
        comment="Version of installed MindGuard desktop agent or extension."
    )
    device_token_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
        comment="Hashed device authentication token used for API sync."
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Whether the device is authorized to sync telemetry."
    )
    is_monitoring_paused: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Student-controlled pause toggle for this device."
    )
    # Granular privacy feature toggles for this device (stored as JSON string)
    features_enabled_json: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        default='{"app_tracking": true, "web_tracking": true, "search_tracking": false, "notification_tracking": true}',
        comment="JSON dictionary of active privacy and tracking permissions."
    )
    last_sync_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp of the most recent telemetry synchronization."
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        comment="Registration timestamp."
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
        comment="Last modification timestamp."
    )

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    app_usage_records: Mapped[List["AppUsageRecord"]] = relationship(
        "AppUsageRecord", back_populates="device", cascade="all, delete-orphan"
    )
    web_activity_records: Mapped[List["WebActivityRecord"]] = relationship(
        "WebActivityRecord", back_populates="device", cascade="all, delete-orphan"
    )
    search_activity_records: Mapped[List["SearchActivityRecord"]] = relationship(
        "SearchActivityRecord", back_populates="device", cascade="all, delete-orphan"
    )
    notification_summary_records: Mapped[List["NotificationSummaryRecord"]] = relationship(
        "NotificationSummaryRecord", back_populates="device", cascade="all, delete-orphan"
    )
    activity_sessions: Mapped[List["DeviceActivitySession"]] = relationship(
        "DeviceActivitySession", back_populates="device", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_user_device_identifier", "user_id", "device_identifier", unique=True),
    )
