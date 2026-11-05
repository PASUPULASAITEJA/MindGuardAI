import enum
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, TYPE_CHECKING
from uuid import UUID, uuid4
from sqlalchemy import (
    String, Boolean, DateTime, ForeignKey, Index, Integer, Text, Float
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

if TYPE_CHECKING:
    from app.models.users import User

class DevicePlatform(str, enum.Enum):
    WINDOWS = "windows"
    MACOS = "macos"
    LINUX = "linux"
    BROWSER_EXTENSION = "browser_extension"
    UNKNOWN = "unknown"

class Device(Base):
    """
    Represents an authorized desktop or browser client connected to a student's account.
    Supports multi-user and multi-device tracking with device-level token authentication.
    """
    __tablename__ = "user_devices"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4, index=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_identifier: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    device_name: Mapped[str] = mapped_column(String(255), nullable=False, default="My Device")
    platform: Mapped[str] = mapped_column(String(50), nullable=False, default="windows")
    os_version: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    agent_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="2.0.0")
    device_token_hash: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_monitoring_paused: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    features_enabled_json: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        default='{"app_tracking": true, "web_tracking": true, "search_tracking": false, "notification_tracking": true}'
    )
    last_sync_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    activity_sessions: Mapped[List["ActivitySession"]] = relationship("ActivitySession", back_populates="device", cascade="all, delete-orphan")
    app_usages: Mapped[List["AppUsageRecord"]] = relationship("AppUsageRecord", back_populates="device", cascade="all, delete-orphan")
    web_usages: Mapped[List["WebUsageRecord"]] = relationship("WebUsageRecord", back_populates="device", cascade="all, delete-orphan")
    search_queries: Mapped[List["SearchQueryRecord"]] = relationship("SearchQueryRecord", back_populates="device", cascade="all, delete-orphan")
    notification_counts: Mapped[List["NotificationCountRecord"]] = relationship("NotificationCountRecord", back_populates="device", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_user_device_identifier", "user_id", "device_identifier", unique=True),
    )


class ActivitySession(Base):
    """
    Records continuous device awake sessions, separating active interaction from idle/locked periods.
    """
    __tablename__ = "device_activity_sessions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4, index=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id: Mapped[UUID] = mapped_column(ForeignKey("user_devices.id", ondelete="CASCADE"), nullable=False, index=True)
    date: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    active_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    idle_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_awake_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    idempotency_key: Mapped[Optional[str]] = mapped_column(String(128), unique=True, nullable=True, index=True)
    synced_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    device: Mapped["Device"] = relationship("Device", back_populates="activity_sessions")


class AppUsageRecord(Base):
    """
    Records authentic foreground duration and launches for an application on a specific device.
    Categories: Education, Programming, Communication, Entertainment, Social Media, Gaming, Productivity, Other.
    """
    __tablename__ = "app_usage_records"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4, index=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id: Mapped[UUID] = mapped_column(ForeignKey("user_devices.id", ondelete="CASCADE"), nullable=False, index=True)
    date: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    app_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    app_identifier: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="Other", index=True)
    foreground_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    launch_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    icon_hint: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    synced_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    device: Mapped["Device"] = relationship("Device", back_populates="app_usages")

    __table_args__ = (
        Index("ix_app_user_device_date_proc", "user_id", "device_id", "date", "app_identifier", unique=True),
    )


class WebUsageRecord(Base):
    """
    Records authentic web browsing duration and visit counts per domain captured via browser extension.
    Never stores URLs with parameters, passwords, or private messages.
    """
    __tablename__ = "web_usage_records"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4, index=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id: Mapped[UUID] = mapped_column(ForeignKey("user_devices.id", ondelete="CASCADE"), nullable=False, index=True)
    date: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    domain: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    browser_name: Mapped[str] = mapped_column(String(50), nullable=False, default="Chrome")
    active_duration_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    visit_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="General")
    synced_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    device: Mapped["Device"] = relationship("Device", back_populates="web_usages")

    __table_args__ = (
        Index("ix_web_user_device_date_domain", "user_id", "device_id", "date", "domain", unique=True),
    )


class SearchQueryRecord(Base):
    """
    Records search queries ONLY when explicit user consent is enabled.
    Never collected from Incognito / Private browsing.
    Strictly isolated and visible ONLY to the account owner.
    """
    __tablename__ = "search_query_records"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4, index=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id: Mapped[UUID] = mapped_column(ForeignKey("user_devices.id", ondelete="CASCADE"), nullable=False, index=True)
    date: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    search_engine: Mapped[str] = mapped_column(String(50), nullable=False, default="Google")
    query_text: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="Academic")
    is_crisis_related: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    device: Mapped["Device"] = relationship("Device", back_populates="search_queries")


class NotificationCountRecord(Base):
    """
    Records authentic notification counts received by application.
    STRICT PRIVACY: Never collects notification content, message bodies, OTPs, or text.
    """
    __tablename__ = "notification_count_records"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4, index=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id: Mapped[UUID] = mapped_column(ForeignKey("user_devices.id", ondelete="CASCADE"), nullable=False, index=True)
    date: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    app_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    app_identifier: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    notification_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    hourly_distribution_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    synced_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    device: Mapped["Device"] = relationship("Device", back_populates="notification_counts")

    __table_args__ = (
        Index("ix_notif_user_device_date_app", "user_id", "device_id", "date", "app_identifier", unique=True),
    )


class DigitalWellnessConsent(Base):
    """
    Granular student privacy and consent preferences for digital wellness tracking.
    """
    __tablename__ = "digital_wellness_consents"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4, index=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    screen_time_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    app_tracking_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    web_tracking_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    search_tracking_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notification_tracking_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    data_retention_days: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])

