#!/usr/bin/env python3
"""
MindGuard AI - Desktop Behavioral Phenotyping Agent (PC / Laptop)
================================================================
Monitors:
1. Total Active Screen Time (excluding idle periods > 3 minutes).
2. Late-Night Computer Usage (12:00 AM - 5:00 AM circadian rhythm indicator).
3. Application Categorization (Academic/Coding vs Entertainment vs Social).
4. Submits privacy-preserving aggregate telemetry to the MindGuard backend.

Privacy Guarantee:
- ZERO keystrokes or private messages are recorded.
- ZERO browser history or screen pixels are captured.
- Only non-invasive aggregate duration tallies (in minutes) are synchronized.
"""

import sys
import os
import time
import json
import ctypes
import getpass
import datetime
from pathlib import Path
from typing import Dict, Optional, Tuple

import requests
import psutil

# API & Gateway Configuration
API_BASE_URL = os.environ.get("MINDGUARD_API_URL", "http://127.0.0.1:8000/api/v1")
TOKEN_CACHE_FILE = Path.home() / ".mindguard_agent_auth.json"
SAMPLE_INTERVAL_SECONDS = 5
SYNC_INTERVAL_SECONDS = 30  # Syncs with backend every 30 seconds

# Canonical Application Categorization Taxonomy
APP_CATEGORIES = {
    "ACADEMIC": [
        "code.exe", "code", "pycharm64.exe", "pycharm", "devenv.exe",
        "winword.exe", "powerpnt.exe", "excel.exe", "acrobat.exe", "acrord32.exe",
        "notion.exe", "zoom.exe", "teams.exe", "jupyter-lab.exe", "cursor.exe",
        "texstudio.exe", "matlab.exe", "obsidian.exe", "zotero.exe"
    ],
    "ENTERTAINMENT": [
        "steam.exe", "steam", "spotify.exe", "spotify", "vlc.exe", "netflix.exe",
        "epicgameslauncher.exe", "riotclientservices.exe", "valorant.exe", "gta5.exe",
        "leagueclient.exe", "overwatch.exe", "robloxplayerbeta.exe"
    ],
    "SOCIAL": [
        "discord.exe", "discord", "telegram.exe", "whatsapp.exe", "slack.exe",
        "signal.exe", "element.exe"
    ]
}

# Windows API Struct for Idle Detection
class LASTINPUTINFO(ctypes.Structure):
    _fields_ = [("cbSize", ctypes.c_uint), ("dwTime", ctypes.c_uint)]

def get_system_idle_seconds() -> float:
    """Returns the number of seconds since the user last interacted with mouse/keyboard."""
    if sys.platform == "win32":
        try:
            last_input_info = LASTINPUTINFO()
            last_input_info.cbSize = ctypes.sizeof(LASTINPUTINFO)
            if ctypes.windll.user32.GetLastInputInfo(ctypes.byref(last_input_info)):
                millis = ctypes.windll.kernel32.GetTickCount() - last_input_info.dwTime
                return max(0.0, millis / 1000.0)
        except Exception:
            return 0.0
    return 0.0

def get_active_window_process_name() -> Tuple[str, str]:
    """
    Returns (process_name, category) for the currently focused foreground window.
    """
    proc_name = "system_idle"
    if sys.platform == "win32":
        try:
            hwnd = ctypes.windll.user32.GetForegroundWindow()
            if hwnd:
                pid = ctypes.c_ulong()
                ctypes.windll.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
                if pid.value > 0:
                    p = psutil.Process(pid.value)
                    proc_name = p.name().lower()
        except Exception:
            proc_name = "desktop"

    # Match Category
    for cat, app_list in APP_CATEGORIES.items():
        if any(app == proc_name or proc_name.startswith(app.replace(".exe", "")) for app in app_list):
            return proc_name, cat

    return proc_name, "GENERAL"

def authenticate_student() -> Dict[str, str]:
    """Authenticates the student with MindGuard API and caches token locally."""
    # Check cache first
    if TOKEN_CACHE_FILE.exists():
        try:
            with open(TOKEN_CACHE_FILE, "r") as f:
                data = json.load(f)
                # Verify token liveness with a quick ping
                headers = {"Authorization": f"Bearer {data.get('access_token')}"}
                test_res = requests.get(f"{API_BASE_URL}/students/me", headers=headers, timeout=5)
                if test_res.status_code == 200:
                    student_info = test_res.json()
                    print(f"[*] Authenticated session restored for: {student_info.get('email')}")
                    return data
        except Exception:
            pass

    print("\n========================================================")
    print("   MindGuard AI - Desktop Behavioral Agent Setup        ")
    print("========================================================")
    print("Please authenticate with your student account credentials.\n")

    while True:
        email = input("Student Email: ").strip()
        if not email:
            continue
        password = getpass.getpass("Password: ").strip()

        try:
            res = requests.post(
                f"{API_BASE_URL}/auth/login",
                json={"email": email, "password": password},
                timeout=10
            )
            if res.status_code == 200:
                auth_data = res.json()
                if auth_data.get("role") != "STUDENT":
                    print("[!] Error: This desktop agent is only for student accounts.\n")
                    continue

                # Cache token locally
                with open(TOKEN_CACHE_FILE, "w") as f:
                    json.dump(auth_data, f)

                print(f"[+] Login successful! Connected as: {auth_data.get('email')}\n")
                return auth_data
            else:
                err_detail = res.json().get("message", "Invalid email or password.")
                print(f"[!] Login failed: {err_detail}. Please try again.\n")
        except requests.exceptions.ConnectionError:
            print("[!] Could not connect to MindGuard API server at http://127.0.0.1:8000. Is the backend running?\n")
            time.sleep(2)

def start_agent():
    auth_data = authenticate_student()
    token = auth_data["access_token"]
    student_id = auth_data["id"]
    student_email = auth_data.get("email", "student")

    print("========================================================")
    print(f"  MindGuard PC Agent Active - Syncing for: {student_email} ")
    print("========================================================")
    print("[*] Privacy Mode: ACTIVE (Aggregate usage metrics only).")
    print("[*] Sampling system activity every 5 seconds...")
    print("[*] Press Ctrl + C to stop the desktop agent.\n")

    # In-memory accumulators for current session
    total_screen_seconds = 0
    late_night_seconds = 0
    academic_seconds = 0
    social_seconds = 0
    entertainment_seconds = 0
    app_tally: Dict[str, int] = {}
    last_sync_time = time.time()

    try:
        while True:
            time.sleep(SAMPLE_INTERVAL_SECONDS)

            # 1. Check user idle state (> 180s = 3 mins without input)
            idle_seconds = get_system_idle_seconds()
            if idle_seconds >= 180:
                continue  # User is away from desk; do not accumulate screen time

            # 2. Accumulate active screen time
            total_screen_seconds += SAMPLE_INTERVAL_SECONDS
            current_hour = datetime.datetime.now().hour

            # Check late night usage (12:00 AM - 5:00 AM)
            if 0 <= current_hour < 5:
                late_night_seconds += SAMPLE_INTERVAL_SECONDS

            # 3. Categorize current foreground app
            proc_name, category = get_active_window_process_name()
            app_tally[proc_name] = app_tally.get(proc_name, 0) + SAMPLE_INTERVAL_SECONDS

            if category == "ACADEMIC":
                academic_seconds += SAMPLE_INTERVAL_SECONDS
            elif category == "SOCIAL":
                social_seconds += SAMPLE_INTERVAL_SECONDS
            elif category == "ENTERTAINMENT":
                entertainment_seconds += SAMPLE_INTERVAL_SECONDS

            # 4. Periodic Cloud Sync
            elapsed_since_sync = time.time() - last_sync_time
            if elapsed_since_sync >= SYNC_INTERVAL_SECONDS:
                last_sync_time = time.time()
                today_str = datetime.date.today().isoformat()

                payload = {
                    "student_id": student_id,
                    "date": today_str,
                    "total_screen_time_minutes": int(total_screen_seconds / 60),
                    "late_night_usage_minutes": int(late_night_seconds / 60),
                    "academic_usage_minutes": int(academic_seconds / 60),
                    "social_usage_minutes": int(social_seconds / 60),
                    "entertainment_usage_minutes": int(entertainment_seconds / 60),
                    "baseline_deviation_score": 0.0
                }

                try:
                    headers = {
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json"
                    }
                    res = requests.post(
                        f"{API_BASE_URL}/chat/behavioral-features",
                        json=payload,
                        headers=headers,
                        timeout=5
                    )

                    if res.status_code == 200:
                        res_data = res.json()
                        risk_info = res_data.get("risk_assessment", {})
                        risk_level = risk_info.get("risk_level", "LOW")
                        z_score = res_data.get("baseline_analysis", {}).get("deviation_z_score", 0.0)

                        status_color = "🟢" if risk_level == "LOW" else "🟡" if risk_level == "MEDIUM" else "🔴"
                        print(
                            f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {status_color} Synced: "
                            f"{payload['total_screen_time_minutes']}m Active | "
                            f"{payload['late_night_usage_minutes']}m Late-Night | "
                            f"App: {proc_name} ({category}) | "
                            f"Risk: {risk_level} (Z={z_score})"
                        )

                        if risk_level == "HIGH":
                            print(
                                "  [!] NOTICE: Elevated late-night fatigue detected. "
                                "MindGuard has scheduled a priority check-in for your wellness.\n"
                            )
                    elif res.status_code == 401:
                        print("[!] Session expired. Re-authenticating...")
                        if TOKEN_CACHE_FILE.exists():
                            os.remove(TOKEN_CACHE_FILE)
                        auth_data = authenticate_student()
                        token = auth_data["access_token"]
                except Exception as sync_err:
                    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Sync notice: Backend offline or retrying ({sync_err})")

    except KeyboardInterrupt:
        print("\n\n[*] MindGuard PC Agent stopped safely. Take care of your mental wellness!")

if __name__ == "__main__":
    start_agent()
