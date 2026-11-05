#!/usr/bin/env python3
"""
MindGuard AI - Cross-Platform Modular Digital Activity Monitoring Agent
======================================================================
1. Multi-User & Multi-Device Architecture:
   - Unique persistent hardware UUID device identification.
   - Device-level token authentication with MindGuard FastAPI Cloud.
   - Encrypted / secure local credential management.
2. Authentic Screen-Time & Activity Tracking:
   - OS-level user idle detection (Windows GetLastInputInfo, macOS IOHID, Linux xprintidle).
   - Screen locked / asleep detection.
   - Real foreground application durations and launches (Zero synthetic data).
   - Non-intrusive Windows Notification Center count metrics.
3. Offline-First Hybrid Storage:
   - SQLite local queue with transaction-safe event batches.
   - Conflict handling and idempotency keys.
4. Browser Extension Local IPC Bridge:
   - Local loopback server for Chrome and Edge active browsing telemetry.
"""

import sys
import os
import time
import json
import ctypes
import getpass
import datetime
import threading
from pathlib import Path
from typing import Dict, Optional, Tuple, Any, List

# Ensure agent package is in path
AGENT_DIR = Path(__file__).resolve().parent
if str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))

from agent.config import agent_config, get_app_data_dir
from agent.local_db import LocalStorage
from agent.sync_client import SyncClient
from agent.local_server import start_local_ipc_server
from agent.collectors import get_platform_collector

def log_agent(msg: str):
    """Outputs to terminal and appends to persistent agent log file."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    try:
        print(line, flush=True)
    except Exception:
        pass
    try:
        agent_config.log_path.parent.mkdir(parents=True, exist_ok=True)
        with open(agent_config.log_path, "a", encoding="utf-8") as f:
            f.write(line + "\n")
            f.flush()
    except Exception:
        pass

def prompt_student_login(storage: LocalStorage, sync_client: SyncClient) -> bool:
    """Interactive student login and device registration."""
    print("\n========================================================")
    print("   MindGuard AI - Desktop Monitoring Setup & Login       ")
    print("========================================================")
    print("Please authenticate with your student account credentials.\n")

    while True:
        email = input("Student Email: ").strip()
        if not email:
            continue
        password = getpass.getpass("Password: ").strip()

        try:
            import requests
            url = f"{agent_config.api_base_url}/auth/login"
            res = requests.post(url, json={"email": email, "password": password}, timeout=10)
            if res.status_code == 200:
                data = res.json()
                if data.get("role") != "STUDENT":
                    print("[!] Error: This desktop agent is intended only for student accounts.\n")
                    continue

                access_token = data.get("access_token")
                agent_config.user_id = str(data.get("id"))
                agent_config.user_email = data.get("email")
                agent_config.save()

                # Register device on backend
                registered = sync_client.register_or_verify_device(student_jwt=access_token)
                if registered:
                    print(f"\n[+] Login & Device Registration Successful!")
                    print(f"    Connected as: {agent_config.user_email}")
                    print(f"    Device ID   : {agent_config.device_id}")
                    print(f"    Platform    : {agent_config.platform_name.title()}\n")
                    return True
                else:
                    print("[!] Logged in, but device registration failed. Will retry during sync.")
                    return True
            else:
                err = res.json().get("message", "Invalid email or password.")
                print(f"[!] Login failed: {err}. Please try again.\n")
        except Exception as e:
            print(f"[!] Could not connect to MindGuard API server ({agent_config.api_base_url}): {e}\n")
            return False

def get_startup_dir() -> Path:
    """Returns the user's OS-specific startup folder."""
    if sys.platform == "win32":
        appdata = os.environ.get("APPDATA")
        if appdata:
            return Path(appdata) / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup"
        return Path.home() / "AppData" / "Roaming" / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup"
    elif sys.platform == "darwin":
        return Path.home() / "Library" / "LaunchAgents"
    else:
        return Path.home() / ".config" / "autostart"

def install_to_startup() -> bool:
    """Installs MindGuard Agent to run automatically on system boot without popups."""
    startup_dir = get_startup_dir()
    startup_dir.mkdir(parents=True, exist_ok=True)
    agent_script = Path(__file__).resolve()

    if sys.platform == "win32":
        vbs_path = startup_dir / "MindGuardAgent.vbs"
        python_exe = sys.executable
        pythonw_exe = python_exe.replace("python.exe", "pythonw.exe")
        if not Path(pythonw_exe).exists():
            pythonw_exe = python_exe

        vbs_content = (
            'Set WshShell = CreateObject("WScript.Shell")\n'
            f'WshShell.Run """{pythonw_exe}"" ""{agent_script}"" --background", 0, False\n'
        )
        try:
            with open(vbs_path, "w", encoding="utf-8") as f:
                f.write(vbs_content)
            print("[+] Successfully installed MindGuard Agent to Windows Startup.")
            return True
        except Exception as e:
            print(f"[!] Failed to install startup script: {e}")
            return False
    elif sys.platform.startswith("linux"):
        desktop_file = startup_dir / "mindguard-agent.desktop"
        content = f"""[Desktop Entry]
Type=Application
Exec={sys.executable} {agent_script} --background
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Name=MindGuard Agent
Comment=MindGuard AI Digital Wellness Monitor
"""
        try:
            desktop_file.write_text(content, encoding="utf-8")
            print("[+] Successfully installed to Linux autostart.")
            return True
        except Exception as e:
            print(f"[!] Failed to install to Linux autostart: {e}")
            return False

    return False

def uninstall_from_startup() -> bool:
    """Removes MindGuard Agent from OS startup."""
    startup_dir = get_startup_dir()
    if sys.platform == "win32":
        vbs_path = startup_dir / "MindGuardAgent.vbs"
        if vbs_path.exists():
            vbs_path.unlink()
            print("[+] Removed MindGuard Agent from Windows Startup.")
            return True
    elif sys.platform.startswith("linux"):
        f = startup_dir / "mindguard-agent.desktop"
        if f.exists():
            f.unlink()
            print("[+] Removed MindGuard Agent from Linux autostart.")
            return True
    print("[*] Startup entry was not installed.")
    return True

_AGENT_MUTEX = None

def ensure_single_instance():
    """Prevents duplicate instances of the monitoring agent from running simultaneously."""
    global _AGENT_MUTEX
    if sys.platform == "win32":
        try:
            _AGENT_MUTEX = ctypes.windll.kernel32.CreateMutexW(None, False, "Global\\MindGuardModularAgentMutex")
            if ctypes.windll.kernel32.GetLastError() == 183:  # ERROR_ALREADY_EXISTS
                log_agent("[*] Another instance of MindGuard Agent is already active. Exiting.")
                sys.exit(0)
        except Exception:
            pass

def run_agent():
    """Main continuous digital activity monitoring loop."""
    storage = LocalStorage(agent_config.db_path)
    sync_client = SyncClient(storage)
    collector = get_platform_collector()

    log_agent("========================================================")
    log_agent(f"  MindGuard AI - Cross-Platform Monitoring Agent v{agent_config.agent_version} ")
    log_agent(f"  Platform: {agent_config.platform_name.title()} | Device: {agent_config.device_name}")
    if agent_config.user_email:
        log_agent(f"  Connected Student: {agent_config.user_email}")
    else:
        log_agent("  [*] Student not paired yet. Run with --login to link account.")
    log_agent("========================================================")
    log_agent("[*] Authentic Telemetry Guarantee: Zero synthetic or estimated app data.")
    log_agent("[*] Privacy Protection: Zero keystroke logging or screenshot capture.")
    log_agent(f"[*] Sampling foreground activity every {agent_config.sample_interval_seconds}s (Idle threshold: {agent_config.idle_threshold_seconds}s)...")

    # Start loopback IPC server for Browser Extension communication
    start_local_ipc_server(storage, port=agent_config.local_server_port)

    # Session tracking variables
    current_session_start = datetime.datetime.now(datetime.timezone.utc)
    current_session_active_seconds = 0
    current_session_idle_seconds = 0
    current_session_locked_seconds = 0

    last_sync_time = time.time()
    last_proc_name = ""
    app_open_counter: Dict[str, int] = {}

    while True:
        try:
            now_dt = datetime.datetime.now(datetime.timezone.utc)
            today_str = now_dt.strftime("%Y-%m-%d")

            # 1. Physical Idle & Screen Locked Detection
            idle_seconds = collector.get_idle_seconds()
            is_locked = collector.is_screen_locked()
            is_idle = (idle_seconds >= agent_config.idle_threshold_seconds)

            interval = agent_config.sample_interval_seconds

            if is_locked:
                current_session_locked_seconds += interval
            elif is_idle:
                current_session_idle_seconds += interval
            else:
                # User is physically active at the keyboard/mouse
                current_session_active_seconds += interval

                # 2. Authentic Foreground Application Tracking
                proc_name, window_title, display_name, category = collector.get_foreground_window()
                is_new_launch = (proc_name != last_proc_name and proc_name != "")
                if is_new_launch:
                    last_proc_name = proc_name
                    app_open_counter[proc_name] = app_open_counter.get(proc_name, 0) + 1

                # Record in local SQLite storage
                if proc_name and proc_name not in ["unknown", "desktop", "lockapp.exe"]:
                    storage.record_app_foreground(
                        date_str=today_str,
                        app_name=display_name,
                        app_identifier=proc_name,
                        category=category,
                        seconds=interval,
                        is_new_launch=is_new_launch
                    )

            # 3. Cloud Synchronization Flush (every 30s)
            if time.time() - last_sync_time >= agent_config.sync_interval_seconds:
                # Queue completed session interval
                session_total = current_session_active_seconds + current_session_idle_seconds + current_session_locked_seconds
                if session_total > 0:
                    storage.enqueue_sync_batch(
                        event_type="session",
                        payload={
                            "start_time": current_session_start.isoformat(),
                            "end_time": now_dt.isoformat(),
                            "active_seconds": current_session_active_seconds,
                            "idle_seconds": current_session_idle_seconds,
                            "locked_seconds": current_session_locked_seconds,
                            "total_awake_seconds": session_total
                        }
                    )
                    # Reset session counter
                    current_session_start = now_dt
                    current_session_active_seconds = 0
                    current_session_idle_seconds = 0
                    current_session_locked_seconds = 0

                # Flush all aggregates and queue to cloud
                sync_client.flush_sync_queue(today_str)
                last_sync_time = time.time()

        except Exception as e:
            log_agent(f"[!] Error in monitoring loop: {e}")

        time.sleep(agent_config.sample_interval_seconds)

if __name__ == "__main__":
    storage = LocalStorage(agent_config.db_path)
    sync_client = SyncClient(storage)

    if "--install-startup" in sys.argv:
        install_to_startup()
    elif "--uninstall-startup" in sys.argv:
        uninstall_from_startup()
    elif "--login" in sys.argv:
        prompt_student_login(storage, sync_client)
    elif "--status" in sys.argv:
        print(f"Device Identifier: {agent_config.device_identifier}")
        print(f"Device ID        : {agent_config.device_id or 'Not Registered'}")
        print(f"Platform         : {agent_config.platform_name.title()}")
        print(f"OS Version       : {agent_config.os_version}")
        print(f"Agent Version    : {agent_config.agent_version}")
        print(f"Monitoring Paused: {agent_config.is_monitoring_paused}")
        print(f"Search Consent   : {agent_config.search_consent}")
        print(f"Local DB         : {agent_config.db_path}")
    else:
        ensure_single_instance()
        run_agent()
