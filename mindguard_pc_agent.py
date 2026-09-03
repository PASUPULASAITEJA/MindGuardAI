#!/usr/bin/env python3
"""
MindGuard AI - Desktop Behavioral Phenotyping Agent (PC / Laptop)
================================================================
Context-Aware Passive Digital Biomarker Agent:
1. Non-Invasive Active Window Title & Search Intent Analysis
   - Accurately classifies Exam Study, Homework, Coding, and Project work.
   - Differentiates late-night exam preparation from depressive doom-scrolling.
   - Detects crisis search queries for immediate counselor protection.
2. Total Active Screen Time & Circadian Sleep Disruption Monitoring.
3. Automated Synchronization with MindGuard Cloud AI.
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
PROJECT_ROOT = Path(__file__).resolve().parent if (Path(__file__).resolve().parent / "backend").exists() else Path(__file__).resolve().parent.parent
TOKEN_CACHE_FILE = PROJECT_ROOT / ".mindguard_agent_auth.json"
SAMPLE_INTERVAL_SECONDS = 5
SYNC_INTERVAL_SECONDS = 30

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

# Semantic Keywords for Search Intent & Window Title Classification
ACADEMIC_KEYWORDS = [
    "leetcode", "github", "stackoverflow", "docs", "documentation", "tutorial",
    "assignment", "syllabus", "midterm", "exam", "quiz", "coursera", "edx", "udemy",
    "overleaf", "jupyter", "chatgpt", "gemini", "claude", "notion", "canvas",
    "blackboard", "moodle", "arxiv", "research", "python", "react", "c++", "java",
    "algorithm", "data structure", "compiler", "lecture", "textbook", "notes"
]

ENTERTAINMENT_KEYWORDS = [
    "youtube", "netflix", "anime", "twitch", "prime video", "spotify", "crunchyroll",
    "hulu", "disney+", "9gag", "memes", "gameplay", "stream"
]

SOCIAL_KEYWORDS = [
    "discord", "reddit", "instagram", "twitter", "x.com", "tiktok", "whatsapp",
    "telegram", "facebook", "snapchat", "threads"
]

CRISIS_KEYWORDS = [
    "how to commit suicide", "how to kill myself", "i want to die", "feeling hopeless",
    "end my life", "suicide hotline", "self harm", "can't take this anymore",
    "worthless", "how to overdose", "no reason to live"
]

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

def get_active_window_details() -> Tuple[str, str, str, bool]:
    """
    Returns (process_name, window_title, category, is_crisis_flag)
    Extracts foreground process and inspects window title/search intent.
    """
    proc_name = "desktop"
    window_title = ""
    is_crisis = False

    if sys.platform == "win32":
        try:
            hwnd = ctypes.windll.user32.GetForegroundWindow()
            if hwnd:
                pid = ctypes.c_ulong()
                ctypes.windll.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
                if pid.value > 0:
                    p = psutil.Process(pid.value)
                    proc_name = p.name().lower()

                # Extract window title text
                length = ctypes.windll.user32.GetWindowTextLengthW(hwnd)
                if length > 0:
                    buff = ctypes.create_unicode_buffer(length + 1)
                    ctypes.windll.user32.GetWindowTextW(hwnd, buff, length + 1)
                    window_title = buff.value.lower()
        except Exception:
            proc_name = "desktop"

    # 1. Immediate Crisis Search Detection
    if any(keyword in window_title for keyword in CRISIS_KEYWORDS):
        return proc_name, window_title, "CRISIS", True

    # 2. Window Title / Search Intent Semantic Categorization (especially for Chrome, Edge, Firefox)
    if any(keyword in window_title for keyword in ACADEMIC_KEYWORDS):
        return proc_name, window_title, "ACADEMIC", False

    if any(keyword in window_title for keyword in ENTERTAINMENT_KEYWORDS):
        return proc_name, window_title, "ENTERTAINMENT", False

    if any(keyword in window_title for keyword in SOCIAL_KEYWORDS):
        return proc_name, window_title, "SOCIAL", False

    # 3. Process-level Categorization
    for cat, app_list in APP_CATEGORIES.items():
        if any(app == proc_name or proc_name.startswith(app.replace(".exe", "")) for app in app_list):
            return proc_name, window_title, cat, False

    return proc_name, window_title, "GENERAL", False

def authenticate_student() -> Dict[str, str]:
    """Authenticates the student with MindGuard API and caches token locally."""
    if TOKEN_CACHE_FILE.exists():
        try:
            with open(TOKEN_CACHE_FILE, "r") as f:
                data = json.load(f)
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
    print("[*] Privacy Guarantee: Zero keystrokes or full screen pixels recorded.")
    print("[*] Context Engine: Differentiates Exam Study from Circadian Fatigue.")
    print("[*] Sampling system activity every 5 seconds...")
    print("[*] Press Ctrl + C to stop the desktop agent.\n")

    total_screen_seconds = 0
    late_night_seconds = 0
    academic_seconds = 0
    social_seconds = 0
    entertainment_seconds = 0
    has_crisis_event = False
    last_sync_time = time.time()

    try:
        while True:
            time.sleep(SAMPLE_INTERVAL_SECONDS)

            idle_seconds = get_system_idle_seconds()
            if idle_seconds >= 180:
                continue

            total_screen_seconds += SAMPLE_INTERVAL_SECONDS
            current_hour = datetime.datetime.now().hour

            if 0 <= current_hour < 5:
                late_night_seconds += SAMPLE_INTERVAL_SECONDS

            proc_name, title, category, is_crisis = get_active_window_details()
            if is_crisis:
                has_crisis_event = True

            if category == "ACADEMIC":
                academic_seconds += SAMPLE_INTERVAL_SECONDS
            elif category == "SOCIAL":
                social_seconds += SAMPLE_INTERVAL_SECONDS
            elif category == "ENTERTAINMENT":
                entertainment_seconds += SAMPLE_INTERVAL_SECONDS

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
                    "baseline_deviation_score": 0.0,
                    "is_crisis_search_flag": has_crisis_event
                }
                has_crisis_event = False  # Reset flag after sync

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
                        display_title = (title[:35] + "..") if len(title) > 35 else (title or proc_name)
                        print(
                            f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {status_color} Synced: "
                            f"{payload['total_screen_time_minutes']}m Active | "
                            f"{payload['late_night_usage_minutes']}m Late-Night | "
                            f"Context: {category} ({display_title}) | "
                            f"Risk: {risk_level}"
                        )
                    elif res.status_code == 401:
                        print("[!] Session expired. Re-authenticating...")
                        if TOKEN_CACHE_FILE.exists():
                            os.remove(TOKEN_CACHE_FILE)
                        auth_data = authenticate_student()
                        token = auth_data["access_token"]
                except Exception as sync_err:
                    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Sync retry ({sync_err})")

    except KeyboardInterrupt:
        print("\n\n[*] MindGuard PC Agent stopped safely. Take care of your mental wellness!")

if __name__ == "__main__":
    start_agent()
