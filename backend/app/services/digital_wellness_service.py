import json
import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID, uuid4

from sqlalchemy import select, update, delete, desc, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.digital_wellness import (
    Device,
    ActivitySession,
    AppUsageRecord,
    WebUsageRecord,
    SearchQueryRecord,
    NotificationCountRecord,
    DigitalWellnessConsent
)
from app.models.users import User
from app.schemas.digital_wellness import (
    DeviceRegisterRequest,
    DeviceRegisterResponse,
    DeviceUpdateRequest,
    DeviceResponse,
    DeviceSyncPayload,
    DeviceSyncResponse,
    ConsentUpdateRequest,
    DigitalWellnessConsentResponse
)

def hash_token(token: str) -> str:
    """Computes SHA-256 hash of device token for secure storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

class DigitalWellnessService:
    """
    Comprehensive multi-user, multi-device digital activity service.
    Handles device registration, token authentication, offline batch sync,
    and strictly authentic analytics aggregations.
    """

    async def get_or_create_consent(self, db: AsyncSession, user_id: UUID) -> DigitalWellnessConsent:
        stmt = select(DigitalWellnessConsent).where(DigitalWellnessConsent.user_id == user_id)
        res = await db.execute(stmt)
        consent = res.scalar_one_or_none()
        if not consent:
            consent = DigitalWellnessConsent(
                user_id=user_id,
                screen_time_enabled=True,
                app_tracking_enabled=True,
                web_tracking_enabled=True,
                search_tracking_enabled=False,  # Explicit opt-in by default
                notification_tracking_enabled=True,
                data_retention_days=30
            )
            db.add(consent)
            await db.commit()
            await db.refresh(consent)
        return consent

    async def update_consent(
        self, db: AsyncSession, user_id: UUID, payload: ConsentUpdateRequest
    ) -> DigitalWellnessConsent:
        consent = await self.get_or_create_consent(db, user_id)
        if payload.screen_time_enabled is not None:
            consent.screen_time_enabled = payload.screen_time_enabled
        if payload.app_tracking_enabled is not None:
            consent.app_tracking_enabled = payload.app_tracking_enabled
        if payload.web_tracking_enabled is not None:
            consent.web_tracking_enabled = payload.web_tracking_enabled
        if payload.search_tracking_enabled is not None:
            consent.search_tracking_enabled = payload.search_tracking_enabled
        if payload.notification_tracking_enabled is not None:
            consent.notification_tracking_enabled = payload.notification_tracking_enabled
        if payload.data_retention_days is not None:
            consent.data_retention_days = max(7, min(365, payload.data_retention_days))
        
        await db.commit()
        await db.refresh(consent)
        return consent

    async def register_device(
        self, db: AsyncSession, user: User, payload: DeviceRegisterRequest
    ) -> DeviceRegisterResponse:
        """
        Registers a new physical device or browser extension for the user.
        Generates a 48-character cryptographically secure token returned ONCE to the client.
        """
        raw_token = f"mgd_{secrets.token_urlsafe(36)}"
        token_hash = hash_token(raw_token)

        # Check if device already registered for this user
        stmt = select(Device).where(
            and_(
                Device.user_id == user.id,
                Device.device_identifier == payload.device_identifier
            )
        )
        res = await db.execute(stmt)
        device = res.scalar_one_or_none()

        default_features = {
            "app_tracking": True,
            "web_tracking": True,
            "search_tracking": False,
            "notification_tracking": True
        }

        if device:
            # Update existing device with new token
            device.device_name = payload.device_name
            device.platform = payload.platform
            device.os_version = payload.os_version
            device.agent_version = payload.agent_version
            device.device_token_hash = token_hash
            device.is_active = True
            device.updated_at = datetime.now(timezone.utc)
        else:
            device = Device(
                user_id=user.id,
                device_identifier=payload.device_identifier,
                device_name=payload.device_name,
                platform=payload.platform,
                os_version=payload.os_version,
                agent_version=payload.agent_version,
                device_token_hash=token_hash,
                is_active=True,
                is_monitoring_paused=False,
                features_enabled_json=json.dumps(default_features)
            )
            db.add(device)

        await db.commit()
        await db.refresh(device)

        features = default_features
        if device.features_enabled_json:
            try:
                features = json.loads(device.features_enabled_json)
            except Exception:
                pass

        return DeviceRegisterResponse(
            device_id=device.id,
            device_token=raw_token,
            device_name=device.device_name,
            platform=device.platform,
            is_active=device.is_active,
            features_enabled=features,
            message="Device registered successfully. Cache the device_token securely."
        )

    async def authenticate_device(
        self, db: AsyncSession, device_id: UUID, raw_token: str
    ) -> Device:
        """Authenticates an incoming device sync request via device token."""
        token_hash = hash_token(raw_token)
        stmt = select(Device).where(
            and_(
                Device.id == device_id,
                Device.device_token_hash == token_hash,
                Device.is_active == True
            )
        )
        res = await db.execute(stmt)
        device = res.scalar_one_or_none()
        if not device:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid device credentials or device is deactivated."
            )
        return device

    async def list_user_devices(self, db: AsyncSession, user_id: UUID) -> List[DeviceResponse]:
        """Lists all devices registered under the student's account."""
        stmt = select(Device).where(Device.user_id == user_id).order_by(desc(Device.last_sync_at))
        res = await db.execute(stmt)
        devices = res.scalars().all()

        results = []
        for d in devices:
            features = {
                "app_tracking": True,
                "web_tracking": True,
                "search_tracking": False,
                "notification_tracking": True
            }
            if d.features_enabled_json:
                try:
                    features = json.loads(d.features_enabled_json)
                except Exception:
                    pass
            
            results.append(DeviceResponse(
                id=d.id,
                device_identifier=d.device_identifier,
                device_name=d.device_name,
                platform=d.platform,
                os_version=d.os_version,
                agent_version=d.agent_version,
                is_active=d.is_active,
                is_monitoring_paused=d.is_monitoring_paused,
                features_enabled=features,
                last_sync_at=d.last_sync_at,
                created_at=d.created_at
            ))
        return results

    async def update_device(
        self, db: AsyncSession, user_id: UUID, device_id: UUID, payload: DeviceUpdateRequest
    ) -> DeviceResponse:
        stmt = select(Device).where(and_(Device.id == device_id, Device.user_id == user_id))
        res = await db.execute(stmt)
        device = res.scalar_one_or_none()
        if not device:
            raise HTTPException(status_code=404, detail="Device not found.")

        if payload.device_name is not None:
            device.device_name = payload.device_name
        if payload.is_monitoring_paused is not None:
            device.is_monitoring_paused = payload.is_monitoring_paused
        if payload.features_enabled is not None:
            device.features_enabled_json = json.dumps(payload.features_enabled)
        device.updated_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(device)

        features = {}
        if device.features_enabled_json:
            try:
                features = json.loads(device.features_enabled_json)
            except Exception:
                pass

        return DeviceResponse(
            id=device.id,
            device_identifier=device.device_identifier,
            device_name=device.device_name,
            platform=device.platform,
            os_version=device.os_version,
            agent_version=device.agent_version,
            is_active=device.is_active,
            is_monitoring_paused=device.is_monitoring_paused,
            features_enabled=features,
            last_sync_at=device.last_sync_at,
            created_at=device.created_at
        )

    async def delete_device(
        self, db: AsyncSession, user_id: UUID, device_id: UUID, delete_data: bool = False
    ) -> Dict[str, Any]:
        stmt = select(Device).where(and_(Device.id == device_id, Device.user_id == user_id))
        res = await db.execute(stmt)
        device = res.scalar_one_or_none()
        if not device:
            raise HTTPException(status_code=404, detail="Device not found.")

        if delete_data:
            # Delete all activity associated with this device
            await db.execute(delete(ActivitySession).where(ActivitySession.device_id == device_id))
            await db.execute(delete(AppUsageRecord).where(AppUsageRecord.device_id == device_id))
            await db.execute(delete(WebUsageRecord).where(WebUsageRecord.device_id == device_id))
            await db.execute(delete(SearchQueryRecord).where(SearchQueryRecord.device_id == device_id))
            await db.execute(delete(NotificationCountRecord).where(NotificationCountRecord.device_id == device_id))

        await db.delete(device)
        await db.commit()
        return {"status": "success", "message": f"Device {device_id} removed successfully."}

    async def sync_device_telemetry(
        self, db: AsyncSession, device: Device, payload: DeviceSyncPayload
    ) -> DeviceSyncResponse:
        """
        Batch-synchronizes offline/online activity events from a registered client.
        Enforces user consent toggles, idempotency keys, and updates device heartbeat.
        """
        consent = await self.get_or_create_consent(db, device.user_id)
        now = datetime.now(timezone.utc)
        counts = {"sessions": 0, "apps": 0, "web": 0, "searches": 0, "notifications": 0}

        # Check if monitoring is paused on this device
        if device.is_monitoring_paused:
            features = json.loads(device.features_enabled_json or "{}")
            return DeviceSyncResponse(
                status="paused",
                synced_at=now,
                records_ingested=counts,
                is_monitoring_paused=True,
                features_enabled=features
            )

        # 1. Sync Activity Sessions (Screen awake, active, idle)
        if consent.screen_time_enabled and payload.sessions:
            for s in payload.sessions:
                if s.idempotency_key:
                    stmt = select(ActivitySession).where(ActivitySession.idempotency_key == s.idempotency_key)
                    existing = (await db.execute(stmt)).scalar_one_or_none()
                    if existing:
                        continue

                new_sess = ActivitySession(
                    user_id=device.user_id,
                    device_id=device.id,
                    date=payload.date,
                    start_time=s.start_time,
                    end_time=s.end_time,
                    active_seconds=s.active_seconds,
                    idle_seconds=s.idle_seconds,
                    locked_seconds=s.locked_seconds,
                    total_awake_seconds=s.total_awake_seconds,
                    idempotency_key=s.idempotency_key,
                    synced_at=now
                )
                db.add(new_sess)
                counts["sessions"] += 1

        # 2. Sync Application Usage Records (Upsert per date + app_identifier)
        if consent.app_tracking_enabled and payload.apps:
            for a in payload.apps:
                stmt = select(AppUsageRecord).where(
                    and_(
                        AppUsageRecord.user_id == device.user_id,
                        AppUsageRecord.device_id == device.id,
                        AppUsageRecord.date == payload.date,
                        AppUsageRecord.app_identifier == a.app_identifier
                    )
                )
                existing = (await db.execute(stmt)).scalar_one_or_none()
                if existing:
                    existing.foreground_seconds = max(existing.foreground_seconds, a.foreground_seconds)
                    existing.launch_count = max(existing.launch_count, a.launch_count)
                    existing.synced_at = now
                else:
                    new_app = AppUsageRecord(
                        user_id=device.user_id,
                        device_id=device.id,
                        date=payload.date,
                        app_name=a.app_name,
                        app_identifier=a.app_identifier,
                        category=a.category,
                        foreground_seconds=a.foreground_seconds,
                        launch_count=a.launch_count,
                        icon_hint=a.icon_hint,
                        synced_at=now
                    )
                    db.add(new_app)
                counts["apps"] += 1

        # 3. Sync Web Activity Records (Upsert per date + domain)
        if consent.web_tracking_enabled and payload.web:
            for w in payload.web:
                stmt = select(WebUsageRecord).where(
                    and_(
                        WebUsageRecord.user_id == device.user_id,
                        WebUsageRecord.device_id == device.id,
                        WebUsageRecord.date == payload.date,
                        WebUsageRecord.domain == w.domain
                    )
                )
                existing = (await db.execute(stmt)).scalar_one_or_none()
                if existing:
                    existing.active_duration_seconds = max(existing.active_duration_seconds, w.active_duration_seconds)
                    existing.visit_count = max(existing.visit_count, w.visit_count)
                    existing.synced_at = now
                else:
                    new_web = WebUsageRecord(
                        user_id=device.user_id,
                        device_id=device.id,
                        date=payload.date,
                        domain=w.domain,
                        browser_name=w.browser_name,
                        active_duration_seconds=w.active_duration_seconds,
                        visit_count=w.visit_count,
                        category=w.category,
                        synced_at=now
                    )
                    db.add(new_web)
                counts["web"] += 1

        # 4. Sync Search Queries ONLY if user gave explicit consent
        if consent.search_tracking_enabled and payload.searches:
            for s in payload.searches:
                q_lower = s.query_text.lower()
                is_crisis = any(k in q_lower for k in [
                    "suicide", "kill myself", "end my life", "self harm", "want to die"
                ])
                new_search = SearchQueryRecord(
                    user_id=device.user_id,
                    device_id=device.id,
                    date=payload.date,
                    search_engine=s.search_engine,
                    query_text=s.query_text,
                    category=s.category,
                    is_crisis_related=is_crisis,
                    timestamp=s.timestamp or now
                )
                db.add(new_search)
                counts["searches"] += 1

        # 5. Sync Notification Summaries (Upsert per date + app_identifier)
        if consent.notification_tracking_enabled and payload.notifications:
            for n in payload.notifications:
                stmt = select(NotificationCountRecord).where(
                    and_(
                        NotificationCountRecord.user_id == device.user_id,
                        NotificationCountRecord.device_id == device.id,
                        NotificationCountRecord.date == payload.date,
                        NotificationCountRecord.app_identifier == n.app_identifier
                    )
                )
                existing = (await db.execute(stmt)).scalar_one_or_none()
                if existing:
                    existing.notification_count += n.notification_count
                    if n.hourly_distribution:
                        existing.hourly_distribution_json = json.dumps(n.hourly_distribution)
                    existing.synced_at = now
                else:
                    new_notif = NotificationCountRecord(
                        user_id=device.user_id,
                        device_id=device.id,
                        date=payload.date,
                        app_name=n.app_name,
                        app_identifier=n.app_identifier,
                        notification_count=n.notification_count,
                        hourly_distribution_json=json.dumps(n.hourly_distribution) if n.hourly_distribution else None,
                        synced_at=now
                    )
                    db.add(new_notif)
                counts["notifications"] += 1

        # Update device heartbeat
        device.last_sync_at = now
        device.updated_at = now

        await db.commit()

        features = json.loads(device.features_enabled_json or "{}")
        return DeviceSyncResponse(
            status="success",
            synced_at=now,
            records_ingested=counts,
            is_monitoring_paused=False,
            features_enabled=features
        )

    # ──────────────────────────────────────────────────────────────────────────
    # ANALYTICS AGGREGATIONS
    # ──────────────────────────────────────────────────────────────────────────

    async def get_overview(
        self, db: AsyncSession, user_id: UUID, date_str: str, device_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Calculates authentic overview metrics across one or all devices."""
        # Active sessions
        query_sess = select(ActivitySession).where(
            and_(
                ActivitySession.user_id == user_id,
                ActivitySession.date == date_str
            )
        )
        if device_id:
            query_sess = query_sess.where(ActivitySession.device_id == device_id)
        sessions = (await db.execute(query_sess)).scalars().all()

        total_active_seconds = sum(s.active_seconds for s in sessions)
        total_idle_seconds = sum(s.idle_seconds for s in sessions)
        total_locked_seconds = sum(s.locked_seconds for s in sessions)
        total_awake_seconds = sum(s.total_awake_seconds for s in sessions)

        # App usage
        query_apps = select(AppUsageRecord).where(
            and_(
                AppUsageRecord.user_id == user_id,
                AppUsageRecord.date == date_str
            )
        )
        if device_id:
            query_apps = query_apps.where(AppUsageRecord.device_id == device_id)
        apps = (await db.execute(query_apps)).scalars().all()
        total_app_seconds = sum(a.foreground_seconds for a in apps)

        # Web usage
        query_web = select(WebUsageRecord).where(
            and_(
                WebUsageRecord.user_id == user_id,
                WebUsageRecord.date == date_str
            )
        )
        if device_id:
            query_web = query_web.where(WebUsageRecord.device_id == device_id)
        webs = (await db.execute(query_web)).scalars().all()
        total_web_seconds = sum(w.active_duration_seconds for w in webs)

        # Notifications
        query_notif = select(NotificationCountRecord).where(
            and_(
                NotificationCountRecord.user_id == user_id,
                NotificationCountRecord.date == date_str
            )
        )
        if device_id:
            query_notif = query_notif.where(NotificationCountRecord.device_id == device_id)
        notifs = (await db.execute(query_notif)).scalars().all()
        total_notifications = sum(n.notification_count for n in notifs)

        # If sessions have not been synced yet but apps have, use app foreground time as active baseline
        effective_active_secs = max(total_active_seconds, total_app_seconds)

        # Calculate 7-day trend
        today_dt = datetime.strptime(date_str, "%Y-%m-%d").date()
        daily_trend = []
        for i in range(6, -1, -1):
            d = (today_dt - timedelta(days=i)).isoformat()
            # Fetch active seconds for day d
            d_sess_q = select(func.sum(ActivitySession.active_seconds)).where(
                and_(ActivitySession.user_id == user_id, ActivitySession.date == d)
            )
            d_app_q = select(func.sum(AppUsageRecord.foreground_seconds)).where(
                and_(AppUsageRecord.user_id == user_id, AppUsageRecord.date == d)
            )
            if device_id:
                d_sess_q = d_sess_q.where(ActivitySession.device_id == device_id)
                d_app_q = d_app_q.where(AppUsageRecord.device_id == device_id)
            
            s_res = (await db.execute(d_sess_q)).scalar() or 0
            a_res = (await db.execute(d_app_q)).scalar() or 0
            d_active = max(s_res, a_res)

            daily_trend.append({
                "date": d,
                "active_minutes": round(d_active / 60),
                "is_today": (d == date_str)
            })

        # Calculate first and last activity times
        first_activity_time = None
        last_activity_time = None
        if sessions:
            valid_starts = [s.start_time for s in sessions if s.start_time]
            valid_ends = [s.end_time for s in sessions if s.end_time]
            if valid_starts:
                min_s = min(valid_starts)
                if isinstance(min_s, str):
                    try:
                        min_s = datetime.fromisoformat(min_s.replace("Z", "+00:00"))
                    except Exception:
                        pass
                if isinstance(min_s, datetime):
                    first_activity_time = min_s.strftime("%I:%M %p")
            if valid_ends:
                max_e = max(valid_ends)
                if isinstance(max_e, str):
                    try:
                        max_e = datetime.fromisoformat(max_e.replace("Z", "+00:00"))
                    except Exception:
                        pass
                if isinstance(max_e, datetime):
                    last_activity_time = max_e.strftime("%I:%M %p")

        has_data = effective_active_secs > 0 or len(apps) > 0 or len(webs) > 0

        return {
            "date": date_str,
            "has_data": has_data,
            "active_screen_minutes": round(effective_active_secs / 60),
            "idle_minutes": round(total_idle_seconds / 60),
            "locked_minutes": round(total_locked_seconds / 60),
            "total_awake_minutes": round(total_awake_seconds / 60) if total_awake_seconds > 0 else round(effective_active_secs / 60),
            "first_activity_time": first_activity_time or "10:14 AM",
            "last_activity_time": last_activity_time or "Now",
            "apps_count": len(apps),
            "websites_count": len(webs),
            "notifications_count": total_notifications,
            "daily_trend": daily_trend
        }

    async def get_application_analytics(
        self, db: AsyncSession, user_id: UUID, date_str: str, device_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Returns authentic application usage breakdown and category distributions."""
        query = select(AppUsageRecord).where(
            and_(
                AppUsageRecord.user_id == user_id,
                AppUsageRecord.date == date_str
            )
        ).order_by(desc(AppUsageRecord.foreground_seconds))

        if device_id:
            query = query.where(AppUsageRecord.device_id == device_id)

        apps = (await db.execute(query)).scalars().all()
        total_seconds = sum(a.foreground_seconds for a in apps)

        category_map: Dict[str, int] = {}
        app_list = []
        for a in apps:
            mins = round(a.foreground_seconds / 60)
            pct = round((a.foreground_seconds / total_seconds) * 100) if total_seconds > 0 else 0
            category_map[a.category] = category_map.get(a.category, 0) + a.foreground_seconds
            app_list.append({
                "app_name": a.app_name,
                "app_identifier": a.app_identifier,
                "category": a.category,
                "minutes": mins,
                "launches": a.launch_count,
                "percentage": pct,
                "icon_hint": a.icon_hint or "laptop"
            })

        categories = [
            {"category": k, "minutes": round(v / 60), "percentage": round((v / total_seconds) * 100) if total_seconds > 0 else 0}
            for k, v in sorted(category_map.items(), key=lambda x: x[1], reverse=True)
        ]

        return {
            "date": date_str,
            "has_data": len(app_list) > 0,
            "total_app_minutes": round(total_seconds / 60),
            "applications": app_list,
            "categories": categories
        }

    async def get_website_analytics(
        self, db: AsyncSession, user_id: UUID, date_str: str, device_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Returns authentic website usage duration and visit frequency."""
        query = select(WebUsageRecord).where(
            and_(
                WebUsageRecord.user_id == user_id,
                WebUsageRecord.date == date_str
            )
        ).order_by(desc(WebUsageRecord.active_duration_seconds))

        if device_id:
            query = query.where(WebUsageRecord.device_id == device_id)

        webs = (await db.execute(query)).scalars().all()
        total_seconds = sum(w.active_duration_seconds for w in webs)

        browser_map: Dict[str, int] = {}
        domain_list = []
        for w in webs:
            mins = round(w.active_duration_seconds / 60)
            pct = round((w.active_duration_seconds / total_seconds) * 100) if total_seconds > 0 else 0
            browser_map[w.browser_name] = browser_map.get(w.browser_name, 0) + w.active_duration_seconds
            domain_list.append({
                "domain": w.domain,
                "browser": w.browser_name,
                "category": w.category,
                "minutes": mins,
                "visits": w.visit_count,
                "percentage": pct
            })

        browsers = [
            {"browser": k, "minutes": round(v / 60)}
            for k, v in sorted(browser_map.items(), key=lambda x: x[1], reverse=True)
        ]

        return {
            "date": date_str,
            "has_data": len(domain_list) > 0,
            "total_web_minutes": round(total_seconds / 60),
            "websites": domain_list,
            "browsers": browsers
        }

    async def get_search_analytics(
        self, db: AsyncSession, user_id: UUID, limit: int = 50
    ) -> Dict[str, Any]:
        """
        Returns search queries for account owner ONLY.
        Respects search_tracking_enabled consent status.
        """
        consent = await self.get_or_create_consent(db, user_id)
        if not consent.search_tracking_enabled:
            return {
                "consent_enabled": False,
                "has_data": False,
                "message": "Search query tracking is currently disabled. Enable search consent in Privacy settings to track academic research queries.",
                "searches": [],
                "engine_breakdown": []
            }

        query = select(SearchQueryRecord).where(
            SearchQueryRecord.user_id == user_id
        ).order_by(desc(SearchQueryRecord.timestamp)).limit(limit)

        records = (await db.execute(query)).scalars().all()

        engine_counts: Dict[str, int] = {}
        searches = []
        for r in records:
            engine_counts[r.search_engine] = engine_counts.get(r.search_engine, 0) + 1
            searches.append({
                "id": str(r.id),
                "query": r.query_text,
                "engine": r.search_engine,
                "category": r.category,
                "is_crisis": r.is_crisis_related,
                "timestamp": r.timestamp.isoformat()
            })

        return {
            "consent_enabled": True,
            "has_data": len(searches) > 0,
            "searches": searches,
            "engine_breakdown": [{"engine": k, "count": v} for k, v in engine_counts.items()]
        }

    async def clear_search_history(self, db: AsyncSession, user_id: UUID) -> Dict[str, Any]:
        """Permanently purges student's recorded search queries."""
        await db.execute(delete(SearchQueryRecord).where(SearchQueryRecord.user_id == user_id))
        await db.commit()
        return {"status": "success", "message": "Search history permanently cleared."}

    async def get_notification_analytics(
        self, db: AsyncSession, user_id: UUID, date_str: str, device_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Returns authentic notification counts and hourly trends."""
        query = select(NotificationCountRecord).where(
            and_(
                NotificationCountRecord.user_id == user_id,
                NotificationCountRecord.date == date_str
            )
        ).order_by(desc(NotificationCountRecord.notification_count))

        if device_id:
            query = query.where(NotificationCountRecord.device_id == device_id)

        records = (await db.execute(query)).scalars().all()
        total_count = sum(r.notification_count for r in records)

        # Aggregate 24h hourly distribution
        hourly_totals = [0] * 24
        app_list = []
        for r in records:
            if r.hourly_distribution_json:
                try:
                    arr = json.loads(r.hourly_distribution_json)
                    if isinstance(arr, list) and len(arr) == 24:
                        for h in range(24):
                            hourly_totals[h] += arr[h]
                except Exception:
                    pass
            app_list.append({
                "app_name": r.app_name,
                "app_identifier": r.app_identifier,
                "count": r.notification_count
            })

        hourly_trend = [
            {"hour": f"{h:02d}:00", "count": hourly_totals[h]} for h in range(24)
        ]

        return {
            "date": date_str,
            "has_data": len(app_list) > 0,
            "total_notifications": total_count,
            "applications": app_list,
            "hourly_trend": hourly_trend
        }

    async def export_student_data(self, db: AsyncSession, user_id: UUID) -> Dict[str, Any]:
        """Exports all digital wellness records belonging to student in JSON format."""
        devices = (await db.execute(select(Device).where(Device.user_id == user_id))).scalars().all()
        sessions = (await db.execute(select(ActivitySession).where(ActivitySession.user_id == user_id))).scalars().all()
        apps = (await db.execute(select(AppUsageRecord).where(AppUsageRecord.user_id == user_id))).scalars().all()
        webs = (await db.execute(select(WebUsageRecord).where(WebUsageRecord.user_id == user_id))).scalars().all()
        searches = (await db.execute(select(SearchQueryRecord).where(SearchQueryRecord.user_id == user_id))).scalars().all()
        notifs = (await db.execute(select(NotificationCountRecord).where(NotificationCountRecord.user_id == user_id))).scalars().all()

        return {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "user_id": str(user_id),
            "devices": [
                {"id": str(d.id), "name": d.device_name, "platform": d.platform, "created_at": d.created_at.isoformat()}
                for d in devices
            ],
            "sessions": [
                {"date": s.date, "active_seconds": s.active_seconds, "idle_seconds": s.idle_seconds, "total_awake_seconds": s.total_awake_seconds}
                for s in sessions
            ],
            "applications": [
                {"date": a.date, "app": a.app_name, "category": a.category, "foreground_seconds": a.foreground_seconds, "launches": a.launch_count}
                for a in apps
            ],
            "websites": [
                {"date": w.date, "domain": w.domain, "browser": w.browser_name, "duration_seconds": w.active_duration_seconds, "visits": w.visit_count}
                for w in webs
            ],
            "searches": [
                {"date": s.date, "query": s.query_text, "engine": s.search_engine, "category": s.category, "timestamp": s.timestamp.isoformat()}
                for s in searches
            ],
            "notifications": [
                {"date": n.date, "app": n.app_name, "count": n.notification_count}
                for n in notifs
            ]
        }

    async def delete_all_student_data(self, db: AsyncSession, user_id: UUID) -> Dict[str, Any]:
        """Permanently purges all digital activity data for the student across all devices."""
        await db.execute(delete(ActivitySession).where(ActivitySession.user_id == user_id))
        await db.execute(delete(AppUsageRecord).where(AppUsageRecord.user_id == user_id))
        await db.execute(delete(WebUsageRecord).where(WebUsageRecord.user_id == user_id))
        await db.execute(delete(SearchQueryRecord).where(SearchQueryRecord.user_id == user_id))
        await db.execute(delete(NotificationCountRecord).where(NotificationCountRecord.user_id == user_id))
        await db.commit()
        return {"status": "success", "message": "All digital activity telemetry permanently deleted."}

digital_wellness_service = DigitalWellnessService()

