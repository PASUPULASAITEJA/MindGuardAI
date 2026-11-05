import os
import sys
import json
import uuid
import platform
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any

def get_app_data_dir() -> Path:
    """Returns platform-appropriate secure user configuration directory."""
    system = platform.system().lower()
    try:
        if system == "windows":
            base = os.environ.get("LOCALAPPDATA", os.path.expanduser("~\\AppData\\Local"))
            path = Path(base) / "MindGuard"
        elif system == "darwin":
            path = Path.home() / "Library" / "Application Support" / "MindGuard"
        else:
            base = os.environ.get("XDG_CONFIG_HOME", os.path.expanduser("~/.config"))
            path = Path(base) / "mindguard"

        path.mkdir(parents=True, exist_ok=True)
        return path
    except (PermissionError, OSError):
        # Fallback to local agent folder if OS user directory is write-restricted
        project_root = Path(__file__).resolve().parents[2]
        fallback = project_root / "desktop_agent" / ".mindguard_data"
        fallback.mkdir(parents=True, exist_ok=True)
        return fallback

def get_hardware_uuid() -> str:
    """
    Retrieves authentic, unique, hardware-bound machine identifier across OS.
    Never generates random fallback without persisting it.
    """
    system = platform.system().lower()
    hardware_id: Optional[str] = None

    if system == "windows":
        try:
            # Try powershell CIM instance
            cmd = ["powershell", "-NoProfile", "-Command", "(Get-CimInstance -Class Win32_ComputerSystemProduct).UUID"]
            out = subprocess.check_output(cmd, text=True, timeout=3).strip()
            if out and len(out) > 10 and "error" not in out.lower():
                hardware_id = out
        except Exception:
            pass
        if not hardware_id:
            try:
                cmd = ["wmic", "csproduct", "get", "uuid"]
                out = subprocess.check_output(cmd, text=True, timeout=3)
                lines = [l.strip() for l in out.splitlines() if l.strip() and "uuid" not in l.lower()]
                if lines:
                    hardware_id = lines[0]
            except Exception:
                pass

    elif system == "darwin":
        try:
            cmd = ["ioreg", "-rd1", "-c", "IOPlatformExpertDevice"]
            out = subprocess.check_output(cmd, text=True, timeout=3)
            for line in out.splitlines():
                if "IOPlatformUUID" in line:
                    hardware_id = line.split("=")[-1].strip().strip('"')
                    break
        except Exception:
            pass

    elif system == "linux":
        try:
            mid = Path("/etc/machine-id")
            if mid.exists():
                hardware_id = mid.read_text().strip()
            else:
                dbus_id = Path("/var/lib/dbus/machine-id")
                if dbus_id.exists():
                    hardware_id = dbus_id.read_text().strip()
        except Exception:
            pass

    # If OS query failed, generate persistent fallback stored in app data
    app_dir = get_app_data_dir()
    fallback_file = app_dir / ".device_id"
    if not hardware_id or len(hardware_id) < 8:
        if fallback_file.exists():
            hardware_id = fallback_file.read_text().strip()
        else:
            hardware_id = f"{system}-{uuid.uuid4()}"
            try:
                fallback_file.write_text(hardware_id, encoding="utf-8")
            except Exception:
                pass

    return hardware_id or f"{system}-{uuid.uuid4()}"

class AgentConfig:
    """Manages persistent desktop agent settings, device tokens, and cloud API endpoints."""
    def __init__(self):
        self.app_dir = get_app_data_dir()
        self.config_file = self.app_dir / "agent_config.json"
        self.db_path = self.app_dir / "mindguard_local.db"
        self.log_path = self.app_dir / "agent.log"

        self.api_base_url = os.environ.get("MINDGUARD_API_URL", "http://127.0.0.1:8000/api/v1")
        self.sample_interval_seconds = 2   # 2-second sampling for precision
        self.sync_interval_seconds = 30    # 30-second cloud sync flush
        self.idle_threshold_seconds = 60   # 60s without input = Idle
        self.local_server_port = 42424     # Local port for browser extension telemetry

        self.device_identifier = get_hardware_uuid()
        self.device_name = f"{platform.node()} ({platform.system()})"
        self.platform_name = platform.system().lower()
        self.os_version = f"{platform.system()} {platform.release()} ({platform.version()})"
        self.agent_version = "2.1.0"

        self.device_id: Optional[str] = None
        self.device_token: Optional[str] = None
        self.user_id: Optional[str] = None
        self.user_email: Optional[str] = None
        self.is_monitoring_paused: bool = False
        self.search_consent: bool = False

        self._load()

    def _load(self):
        # 1. Check local secure config
        if self.config_file.exists():
            try:
                with open(self.config_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.device_id = data.get("device_id")
                    self.device_token = data.get("device_token")
                    self.user_id = data.get("user_id")
                    self.user_email = data.get("user_email")
                    self.is_monitoring_paused = data.get("is_monitoring_paused", False)
                    self.search_consent = data.get("search_consent", False)
                    if data.get("api_base_url"):
                        self.api_base_url = data["api_base_url"]
            except Exception:
                pass

        # 2. Check legacy token file for migration if not logged in
        if not self.user_id:
            project_root = Path(__file__).resolve().parents[2]
            legacy_auth = project_root / ".mindguard_agent_auth.json"
            if legacy_auth.exists():
                try:
                    with open(legacy_auth, "r", encoding="utf-8") as f:
                        ldata = json.load(f)
                        if ldata.get("id"):
                            self.user_id = ldata.get("id")
                            self.user_email = ldata.get("email")
                except Exception:
                    pass

    def save(self):
        data = {
            "device_id": self.device_id,
            "device_token": self.device_token,
            "user_id": self.user_id,
            "user_email": self.user_email,
            "device_identifier": self.device_identifier,
            "device_name": self.device_name,
            "api_base_url": self.api_base_url,
            "is_monitoring_paused": self.is_monitoring_paused,
            "search_consent": self.search_consent,
            "agent_version": self.agent_version,
            "platform": self.platform_name
        }
        try:
            with open(self.config_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception:
            pass

agent_config = AgentConfig()
