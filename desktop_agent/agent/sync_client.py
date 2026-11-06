import requests
import json
import time
import logging
from typing import Optional, Dict, Any, List
from .config import agent_config
from .local_db import LocalStorage

logger = logging.getLogger("mindguard-sync-client")

class SyncClient:
    """
    HTTP client responsible for cloud synchronization with MindGuard FastAPI backend.
    Handles device registration, token authentication, batch telemetry uploads, and exponential backoff.
    """
    def __init__(self, storage: LocalStorage):
        self.storage = storage
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": f"MindGuardAgent/{agent_config.agent_version} ({agent_config.platform_name})",
            "Content-Type": "application/json"
        })

    def auto_register_device(self, student_email: Optional[str] = None) -> bool:
        """
        Automatically registers device with backend using zero-prompt auto-pairing.
        Eliminates the need for manual student email/password typing.
        """
        if agent_config.device_id and agent_config.device_token:
            return True

        url = f"{agent_config.api_base_url}/devices/auto-register"
        params = {}
        if student_email or agent_config.user_email:
            params["student_email"] = student_email or agent_config.user_email

        payload = {
            "device_identifier": agent_config.device_identifier,
            "device_name": agent_config.device_name,
            "platform": agent_config.platform_name,
            "os_version": agent_config.os_version,
            "agent_version": agent_config.agent_version
        }

        try:
            res = self.session.post(url, json=payload, params=params, timeout=5)
            if res.status_code in [200, 201]:
                data = res.json()
                agent_config.device_id = str(data["device_id"])
                agent_config.device_token = data["device_token"]
                agent_config.save()
                logger.info(f"Successfully auto-registered device {agent_config.device_id}")
                return True
        except Exception:
            pass

        return False

    def register_or_verify_device(self, student_jwt: Optional[str] = None) -> bool:
        """
        Registers device with backend if device_id or token is not yet established.
        Uses student JWT access token if provided.
        """
        if agent_config.device_id and agent_config.device_token:
            return True

        if not student_jwt:
            return False

        url = f"{agent_config.api_base_url}/devices/register"
        headers = {"Authorization": f"Bearer {student_jwt}"}
        payload = {
            "device_identifier": agent_config.device_identifier,
            "device_name": agent_config.device_name,
            "platform": agent_config.platform_name,
            "os_version": agent_config.os_version,
            "agent_version": agent_config.agent_version
        }

        try:
            res = self.session.post(url, json=payload, headers=headers, timeout=10)
            if res.status_code in [200, 201]:
                data = res.json()
                agent_config.device_id = str(data["device_id"])
                agent_config.device_token = data["device_token"]
                agent_config.save()
                logger.info(f"Successfully registered device {agent_config.device_id}")
                return True
            else:
                logger.error(f"Device registration failed: {res.status_code} - {res.text}")
        except Exception as e:
            logger.error(f"Failed to reach MindGuard server for registration: {e}")

        return False

    def flush_sync_queue(self, date_str: str) -> bool:
        """
        Drains pending offline events from SQLite local queue and synchronizes
        daily application, web, and session aggregates with the cloud backend.
        """
        if not agent_config.device_id or not agent_config.device_token:
            return False

        if agent_config.is_monitoring_paused:
            logger.info("Monitoring is paused on this device. Sync skipped.")
            return False

        # Gather daily aggregates from SQLite
        apps = self.storage.get_daily_app_aggregates(date_str)
        webs = self.storage.get_daily_web_aggregates(date_str)
        searches = self.storage.get_unflushed_searches(date_str)

        # Gather pending activity session events from local sync_queue
        pending = self.storage.get_pending_sync_items(200)
        sessions = []
        for p in pending:
            if p.get("event_type") == "session":
                sess_payload = dict(p["payload"])
                sess_payload["idempotency_key"] = p["idempotency_key"]
                sessions.append(sess_payload)

        # Build payload
        payload: Dict[str, Any] = {
            "date": date_str,
            "sessions": sessions,
            "apps": apps,
            "web": webs,
            "searches": searches
        }

        url = f"{agent_config.api_base_url}/devices/{agent_config.device_id}/sync"
        headers = {"X-Device-Token": agent_config.device_token}

        try:
            res = self.session.post(url, json=payload, headers=headers, timeout=15)
            if res.status_code == 200:
                data = res.json()
                agent_config.is_monitoring_paused = data.get("is_monitoring_paused", False)
                agent_config.save()

                # Mark pending sync queue items as completed
                if pending:
                    self.storage.mark_items_synced([p["id"] for p in pending])

                logger.info(f"Synced telemetry: {data.get('records_ingested')}")
                return True
            elif res.status_code == 401:
                logger.warning("Device token unauthorized. Device may have been unlinked from portal.")
            else:
                logger.error(f"Sync error {res.status_code}: {res.text}")
        except Exception as e:
            logger.error(f"Network error during telemetry sync: {e}")

        return False

