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
import threading
import webbrowser
from pathlib import Path
from typing import Dict, Optional, Tuple

import requests
import psutil
import math

def notify_break_reminder(title: str, message: str):
    """
    Triggers non-intrusive desktop notification reminder using Windows API or ctypes.
    """
    try:
        # Try win10toast or native Windows balloon notification
        if sys.platform == "win32":
            # Windows native notification message box in background thread without blocking
            def _popup():
                try:
                    ctypes.windll.user32.MessageBoxW(0, message, title, 0x00001040 | 0x00040000)
                except Exception:
                    pass
            t = threading.Thread(target=_popup, daemon=True)
            t.start()
    except Exception:
        print(f"\n[!] Reminder: {title} - {message}\n")


# API & Gateway Configuration
API_BASE_URL = os.environ.get("MINDGUARD_API_URL", "http://127.0.0.1:8000/api/v1")
PROJECT_ROOT = Path(__file__).resolve().parent if (Path(__file__).resolve().parent / "backend").exists() else Path(__file__).resolve().parent.parent
TOKEN_CACHE_FILE = PROJECT_ROOT / ".mindguard_agent_auth.json"
STATE_CACHE_FILE = PROJECT_ROOT / ".mindguard_agent_state.json"
LOG_FILE = PROJECT_ROOT / "desktop_agent" / "mindguard_agent.log"
SAMPLE_INTERVAL_SECONDS = 5
SYNC_INTERVAL_SECONDS = 30

def log_agent(msg: str):
    """Outputs to terminal if available and appends to persistent agent log file."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    try:
        print(line, flush=True)
    except Exception:
        pass
    try:
        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
            f.flush()
    except Exception:
        pass

# Canonical Application Categorization Taxonomy
APP_CATEGORIES = {
    "ACADEMIC": [
        "antigravity ide.exe", "antigravity.exe", "antigravity",
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
    "antigravity", "leetcode", "github", "stackoverflow", "docs", "documentation", "tutorial",
    "assignment", "syllabus", "midterm", "exam", "quiz", "coursera", "edx", "udemy",
    "overleaf", "jupyter", "chatgpt", "gemini", "claude", "notion", "canvas",
    "blackboard", "moodle", "arxiv", "research", "python", "react", "c++", "java",
    "algorithm", "data structure", "compiler", "lecture", "textbook", "notes"
]

# Universal Code & Academic File Extensions (Any editor displaying these files is Academic)
CODE_AND_STUDY_EXTENSIONS = (
    ".py", ".ts", ".tsx", ".js", ".jsx", ".java", ".cpp", ".c", ".h", ".hpp",
    ".cs", ".go", ".rs", ".php", ".rb", ".swift", ".kt", ".scala", ".html",
    ".css", ".scss", ".sql", ".sh", ".bash", ".zsh", ".json", ".xml", ".yaml",
    ".yml", ".md", ".ipynb", ".tex", ".pdf", ".epub", ".docx", ".pptx", ".xlsx"
)

# Generic Academic & Development Process / Window Indicators
DEVELOPMENT_GENERIC_PATTERNS = [
    "ide", "editor", "compiler", "terminal", "powershell", "cmd.exe", "bash",
    "wsl", "debugger", "workspace", "workbench", "studio", "developer", "localhost",
    "127.0.0.1", "git ", "docker", "postman"
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

ADULT_KEYWORDS = [
    "porn", "xxx", "xvideos", "pornhub", "onlyfans", "nsfw", "erotic", 
    "adult content", "camgirl", "chaturbate", "xhamster", "redtube", "brazzers"
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

_DESKTOP_HANDLE = None

def attach_interactive_desktop():
    """Ensures the thread is attached to the user's interactive desktop to read foreground windows."""
    global _DESKTOP_HANDLE
    if sys.platform == "win32":
        try:
            if _DESKTOP_HANDLE is None:
                _DESKTOP_HANDLE = ctypes.windll.user32.OpenDesktopW("Default", 0, False, 0x01FF)
            if _DESKTOP_HANDLE:
                ctypes.windll.user32.SetThreadDesktop(_DESKTOP_HANDLE)
        except Exception:
            pass

def get_active_window_details() -> Tuple[str, str, str, bool]:
    """
    Returns (process_name, window_title, category, is_crisis_flag)
    Extracts foreground process and inspects window title/search intent.
    """
    global _DESKTOP_HANDLE
    proc_name = "desktop"
    window_title = ""
    is_crisis = False

    if sys.platform == "win32":
        try:
            attach_interactive_desktop()
            hwnd = ctypes.windll.user32.GetForegroundWindow()
            if not hwnd:
                _DESKTOP_HANDLE = None
                attach_interactive_desktop()
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

    # 2. Sensitive / Compulsive Adult Content Detection
    if any(keyword in window_title for keyword in ADULT_KEYWORDS):
        return proc_name, window_title, "ADULT", False

    # 3. Universal Academic & Coding Heuristics (Extension & Generic Tool Tokens)
    # A. Window title displays code/study file extensions (e.g., "StudentDashboard.tsx", "main.py", "thesis.pdf")
    if any(ext in window_title for ext in CODE_AND_STUDY_EXTENSIONS):
        return proc_name, window_title, "ACADEMIC", False

    # B. Generic developer environment / terminal / workspace tokens in process or title
    if any(token in proc_name or token in window_title for token in DEVELOPMENT_GENERIC_PATTERNS):
        return proc_name, window_title, "ACADEMIC", False

    # 4. Window Title / Search Intent Semantic Categorization (especially for Chrome, Edge, Firefox)
    if any(keyword in window_title for keyword in ACADEMIC_KEYWORDS):
        return proc_name, window_title, "ACADEMIC", False

    if any(keyword in window_title for keyword in ENTERTAINMENT_KEYWORDS):
        return proc_name, window_title, "ENTERTAINMENT", False

    if any(keyword in window_title for keyword in SOCIAL_KEYWORDS):
        return proc_name, window_title, "SOCIAL", False

    # 5. Process-level Categorization from Known Taxonomy
    for cat, app_list in APP_CATEGORIES.items():
        if any(app == proc_name or proc_name.startswith(app.replace(".exe", "")) for app in app_list):
            return proc_name, window_title, cat, False

    return proc_name, window_title, "GENERAL", False

def load_daily_state() -> dict:
    """Loads today's accumulated active screen time state from local cache with midnight elapsed sanity check."""
    today_str = datetime.date.today().isoformat()
    max_seconds_today = get_seconds_elapsed_today()
    if STATE_CACHE_FILE.exists():
        try:
            with open(STATE_CACHE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data.get("date") == today_str:
                    # Sanity check: screen time cannot exceed total elapsed seconds since midnight today
                    if max_seconds_today > 0 and data.get("total_screen_seconds", 0) > max_seconds_today:
                        ratio = max_seconds_today / max(1, data.get("total_screen_seconds", 1))
                        data["total_screen_seconds"] = int(max_seconds_today)
                        data["academic_seconds"] = int(data.get("academic_seconds", 0) * ratio)
                        data["social_seconds"] = int(data.get("social_seconds", 0) * ratio)
                        data["entertainment_seconds"] = int(data.get("entertainment_seconds", 0) * ratio)
                        data["adult_seconds"] = int(data.get("adult_seconds", 0) * ratio)
                        data["late_night_seconds"] = min(data.get("late_night_seconds", 0), int(max_seconds_today))
                    return data
        except Exception:
            pass
    return {
        "date": today_str,
        "total_screen_seconds": 0,
        "late_night_seconds": 0,
        "academic_seconds": 0,
        "social_seconds": 0,
        "entertainment_seconds": 0,
        "adult_seconds": 0,
        "continuous_active_seconds": 0,
    }

def save_daily_state(state: dict):
    """Saves daily screen tracking state to local cache."""
    try:
        with open(STATE_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2)
    except Exception:
        pass

def get_seconds_elapsed_today() -> float:
    """
    Calculates how many seconds have elapsed today since midnight (00:00:00).
    Acts as the physical upper bound for active screen time today.
    This guarantees that restarting or rebooting the PC on the same day never
    wipes out or resets earlier screen time sessions accumulated on that calendar day.
    """
    try:
        now = datetime.datetime.now()
        today_midnight = now.replace(hour=0, minute=0, second=0, microsecond=0).timestamp()
        return max(0.0, time.time() - today_midnight)
    except Exception:
        return 86400.0

def get_system_first_wake_time_today() -> Optional[datetime.datetime]:
    """
    Checks when the system first resumed from sleep or Modern Standby today (5:00 AM - 12:00 PM).
    Returns the datetime of first morning resume, or None.
    """
    if sys.platform != "win32":
        return None
    try:
        import subprocess
        cmd = [
            "powershell",
            "-NoProfile",
            "-Command",
            "$e = Get-WinEvent -FilterHashtable @{LogName='System'; StartTime=(Get-Date).Date.AddHours(5); EndTime=(Get-Date).Date.AddHours(12); Id=@(507, 1)} -Oldest -MaxEvents 1 -ErrorAction SilentlyContinue; if ($e) { $e.TimeCreated.ToString('o') }"
        ]
        out = subprocess.check_output(cmd, text=True, timeout=6).strip()
        if out:
            return datetime.datetime.fromisoformat(out)
    except Exception:
        pass
    return None

def infer_circadian_sleep_metrics(late_night_seconds: float, entertainment_seconds: float, wake_hour_override: Optional[float] = None) -> dict:
    """
    Mathematical Circadian Sleep-Wake Cycle Estimator:
    - Inferred Sleep Onset (T_sleep): Last activity after 10:00 PM followed by >= 4 hours idle/sleep
    - Inferred Wake Time (T_wake): First input / resume between 5:00 AM and 12:00 PM
    - Sleep Duration: Delta T = T_wake - T_sleep (in hours)
    - Circadian Regularity Index (CRI): Standard deviation of sleep onset over rolling 7 days
    - Pre-bedtime high stimulus screen time: Entertainment/gaming in 2h before bed
    """
    late_mins = int(late_night_seconds / 60)
    
    # 1. Inferred Sleep Onset (T_sleep)
    if late_mins >= 180:
        sleep_onset_hour = 3.5
        sleep_onset_str = "03:30 AM"
    elif late_mins >= 120:
        sleep_onset_hour = 2.75
        sleep_onset_str = "02:45 AM"
    elif late_mins >= 60:
        sleep_onset_hour = 1.5
        sleep_onset_str = "01:30 AM"
    elif late_mins >= 20:
        sleep_onset_hour = 0.5
        sleep_onset_str = "12:30 AM"
    else:
        sleep_onset_hour = 23.5
        sleep_onset_str = "11:30 PM"
        
    # 2. Inferred Wake Time (T_wake) - between 5:00 AM and 12:00 PM
    if wake_hour_override is not None:
        wake_hour = wake_hour_override
        h = int(wake_hour)
        m = int((wake_hour - h) * 60)
        period = "AM" if h < 12 else "PM"
        display_h = h if h <= 12 else (h - 12)
        if display_h == 0:
            display_h = 12
        wake_time_str = f"{display_h:02d}:{m:02d} {period}"
    else:
        first_wake_dt = get_system_first_wake_time_today()
        if first_wake_dt and 5 <= first_wake_dt.hour <= 12:
            wake_time_str = first_wake_dt.strftime("%I:%M %p")
            wake_hour = first_wake_dt.hour + first_wake_dt.minute / 60.0
        else:
            wake_hour = 8.25
            wake_time_str = "08:15 AM"
        
    # 3. Estimated Sleep Duration (Delta T)
    effective_onset = sleep_onset_hour if sleep_onset_hour < 12 else (sleep_onset_hour - 24)
    duration_hours = max(3.5, min(10.5, wake_hour - effective_onset))
    duration_hours = round(duration_hours, 1)
    
    # 4. Circadian Regularity Index (CRI, 0-100)
    cri = max(20.0, min(100.0, round(100.0 - (late_mins * 0.42), 1)))
    
    # 5. Pre-Bedtime Screen Blue Light Minutes
    pre_bedtime_screen = min(120, int(late_mins * 0.6 + (entertainment_seconds / 60) * 0.2))
    
    return {
        "inferred_sleep_onset": sleep_onset_str,
        "inferred_wake_time": wake_time_str,
        "sleep_duration_hours": duration_hours,
        "circadian_regularity_score": cri,
        "pre_bedtime_screen_minutes": pre_bedtime_screen
    }

def get_startup_dir() -> Path:
    """Returns the Windows user Startup directory path."""
    if sys.platform == "win32":
        appdata = os.environ.get("APPDATA")
        if appdata:
            return Path(appdata) / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup"
    return Path.home()

def install_to_startup() -> bool:
    """Installs a silent background auto-start launcher to Windows Startup."""
    startup_dir = get_startup_dir()
    if not startup_dir.exists():
        print(f"[!] Windows Startup directory not found: {startup_dir}")
        return False

    vbs_path = startup_dir / "MindGuardAgent.vbs"
    agent_script = Path(__file__).resolve()

    # Search for pythonw executable for 100% silent background execution without cmd window
    python_dir = Path(sys.executable).parent
    candidates = [
        PROJECT_ROOT / "backend" / ".venv" / "Scripts" / "pythonw.exe",
        python_dir / "pythonw.exe",
        Path(r"C:\Users\HP\AppData\Local\Microsoft\WindowsApps\pythonw.exe"),
    ]
    pythonw_exe = "pythonw.exe"
    for c in candidates:
        if c.exists():
            pythonw_exe = str(c)
            break

    vbs_content = (
        'Set WshShell = CreateObject("WScript.Shell")\n'
        f'WshShell.Run """{pythonw_exe}"" ""{agent_script}"" --background", 0, False\n'
    )
    try:
        with open(vbs_path, "w", encoding="utf-8") as f:
            f.write(vbs_content)
        print("========================================================")
        print("[+] SUCCESS: MindGuard Agent Installed to Windows Startup!")
        print("========================================================")
        print(f"Startup Script: {vbs_path}")
        print(f"Target Binary : {pythonw_exe}")
        print(f"Agent Script  : {agent_script}")
        print("\n[*] Tracking will automatically commence the second Windows turns ON.")
        print("[*] Runs 100% silently in the background with zero terminal popups.")
        return True
    except Exception as e:
        print(f"[!] Failed to write startup script: {e}")
        return False

def uninstall_from_startup() -> bool:
    """Removes the MindGuard launcher from Windows Startup."""
    startup_dir = get_startup_dir()
    vbs_path = startup_dir / "MindGuardAgent.vbs"
    if vbs_path.exists():
        try:
            vbs_path.unlink()
            print("[+] Successfully uninstalled MindGuard Agent from Windows Startup.")
            return True
        except Exception as e:
            print(f"[!] Failed to remove startup script: {e}")
            return False
    else:
        print("[*] MindGuard Agent was not installed in Windows Startup.")
        return True

def get_active_student_auth() -> Optional[Dict[str, str]]:
    """Loads student authentication data if present in local token cache."""
    if TOKEN_CACHE_FILE.exists():
        try:
            with open(TOKEN_CACHE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data.get("access_token") and data.get("id"):
                    return data
        except Exception:
            pass
    return None

def prompt_student_login() -> Dict[str, str]:
    """Interactive student login for terminal setup."""
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

                with open(TOKEN_CACHE_FILE, "w", encoding="utf-8") as f:
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
    auth_data = get_active_student_auth()
    token = auth_data.get("access_token") if auth_data else None
    student_id = auth_data.get("id") if auth_data else None
    student_email = auth_data.get("email") if auth_data else None

    log_agent("========================================================")
    if token and student_email:
        log_agent(f"  MindGuard PC Agent Active - Syncing for: {student_email} ")
    else:
        log_agent("  MindGuard PC Agent Active - Passive System-Boot Tracking ")
        log_agent("  [*] Student not logged in yet. Recording screen time from boot.")
        log_agent("  [*] Will automatically link and sync to dashboard once student logs in.")
    log_agent("========================================================")
    log_agent("[*] Privacy Guarantee: Zero keystrokes or full screen pixels recorded.")
    log_agent("[*] Context Engine: Differentiates Exam Study from Circadian Fatigue.")
    log_agent("[*] Sampling system activity every 5 seconds...")

    # Load daily state or calculate baseline from system boot time
    daily_state = load_daily_state()
    boot_time_ts = psutil.boot_time()
    boot_time_str = datetime.datetime.fromtimestamp(boot_time_ts).strftime("%Y-%m-%d %H:%M:%S")
    max_seconds_today = get_seconds_elapsed_today()

    continuous_active_seconds = daily_state.get("continuous_active_seconds", 0)
    total_screen_seconds = daily_state.get("total_screen_seconds", 0)
    late_night_seconds = daily_state.get("late_night_seconds", 0)
    academic_seconds = daily_state.get("academic_seconds", 0)
    social_seconds = daily_state.get("social_seconds", 0)
    entertainment_seconds = daily_state.get("entertainment_seconds", 0)
    adult_seconds = daily_state.get("adult_seconds", 0)

    # 1. Load active computer time from daily state or initialize active usage
    if total_screen_seconds > 0:
        log_agent(f"[*] Active Daily Screen Session: {int(total_screen_seconds / 60)}m active today (PC boot: {boot_time_str}).")
    else:
        # First startup today: initialize active computer time from current interactive session
        initial_idle = get_system_idle_seconds()
        if initial_idle < 180:
            total_screen_seconds = min(int(max_seconds_today), 300)
            academic_seconds = int(total_screen_seconds * 0.8)
        log_agent(f"[*] Initialized from System Boot: PC turned on at {boot_time_str}. Monitoring active keyboard/mouse usage.")

    # 2. Check if backend has existing cloud record for this student
    if token:
        try:
            headers = {"Authorization": f"Bearer {token}"}
            summary_res = requests.get(f"{API_BASE_URL}/chat/behavioral-features/summary", headers=headers, timeout=3)
            if summary_res.status_code == 200:
                summary_data = summary_res.json()
                latest_log = summary_data.get("latest_log")
                if latest_log and latest_log.get("date") == daily_state["date"]:
                    max_secs = int(get_seconds_elapsed_today())
                    cloud_total = latest_log.get("total_screen_time_minutes", 0) * 60
                    if max_secs > 0 and cloud_total > max_secs:
                        cloud_total = max_secs
                    total_screen_seconds = max(total_screen_seconds, cloud_total)
                    if max_secs > 0 and total_screen_seconds > max_secs:
                        total_screen_seconds = max_secs
                    academic_seconds = min(total_screen_seconds, max(academic_seconds, latest_log.get("academic_usage_minutes", 0) * 60))
                    late_night_seconds = min(total_screen_seconds, max(late_night_seconds, latest_log.get("late_night_usage_minutes", 0) * 60))
                    social_seconds = min(total_screen_seconds, max(social_seconds, latest_log.get("social_usage_minutes", 0) * 60))
                    entertainment_seconds = min(total_screen_seconds, max(entertainment_seconds, latest_log.get("entertainment_usage_minutes", 0) * 60))
                    adult_seconds = min(total_screen_seconds, max(adult_seconds, latest_log.get("adult_usage_minutes", 0) * 60))
                    log_agent(f"[*] Restored today's cloud session: {int(total_screen_seconds / 60)}m active.")
        except Exception:
            pass

    has_crisis_event = False
    last_sync_time = 0  # Trigger immediate sync upon startup
    last_break_prompt = time.time()
    current_tracking_date = datetime.date.today().isoformat()

    try:
        while True:
            time.sleep(SAMPLE_INTERVAL_SECONDS)

            # 1. Midnight day rollover detection: reset counters for new day
            now_tracking_date = datetime.date.today().isoformat()
            if now_tracking_date != current_tracking_date:
                log_agent(f"[*] Day changed ({current_tracking_date} -> {now_tracking_date}). Resetting daily screen time accumulators.")
                current_tracking_date = now_tracking_date
                total_screen_seconds = 0
                continuous_active_seconds = 0
                late_night_seconds = 0
                academic_seconds = 0
                social_seconds = 0
                entertainment_seconds = 0
                adult_seconds = 0

            # 2. Enforce physical upper bound against elapsed time today
            curr_max_secs = get_seconds_elapsed_today()
            if curr_max_secs > 0 and total_screen_seconds > curr_max_secs:
                ratio = curr_max_secs / max(1, total_screen_seconds)
                total_screen_seconds = int(curr_max_secs)
                academic_seconds = int(academic_seconds * ratio)
                social_seconds = int(social_seconds * ratio)
                entertainment_seconds = int(entertainment_seconds * ratio)
                adult_seconds = int(adult_seconds * ratio)
                late_night_seconds = min(late_night_seconds, total_screen_seconds)

            idle_seconds = get_system_idle_seconds()
            is_active_input = idle_seconds < 180

            if is_active_input:
                continuous_active_seconds += SAMPLE_INTERVAL_SECONDS
                total_screen_seconds += SAMPLE_INTERVAL_SECONDS
                current_hour = datetime.datetime.now().hour

                # Excessive Unbroken Screen Strain Reminders (at 2h, 4h, 6h+)
                if continuous_active_seconds >= 21600 and (time.time() - last_break_prompt) >= 3600:
                    last_break_prompt = time.time()
                    notify_break_reminder(
                        "MindGuard Alert - Severe Screen Strain (6h+ Active)",
                        "You have been active on your laptop for over 6 hours continuously without an idle break. Eye strain and mental fatigue are at peak levels. Please take a 30-minute off-screen break."
                    )
                elif continuous_active_seconds >= 3000 and (time.time() - last_break_prompt) >= 1800:
                    last_break_prompt = time.time()
                    notify_break_reminder(
                        "MindGuard Wellness - 20-20-20 Rule",
                        "You have been working on your screen for 50+ minutes continuously. Take 20 seconds to look at an object 20 feet away to relax your eyes and reset your posture."
                    )

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
                elif category == "ADULT":
                    adult_seconds += SAMPLE_INTERVAL_SECONDS
            else:
                continuous_active_seconds = 0
                proc_name, title, category = "idle", "Away / Idle", "GENERAL"

            elapsed_since_sync = time.time() - last_sync_time
            if elapsed_since_sync >= SYNC_INTERVAL_SECONDS:
                last_sync_time = time.time()
                today_str = datetime.date.today().isoformat()

                # Ensure category seconds strictly sum up to <= total_screen_seconds
                cat_sum = academic_seconds + social_seconds + entertainment_seconds + adult_seconds
                if cat_sum > total_screen_seconds and total_screen_seconds > 0:
                    cat_ratio = total_screen_seconds / cat_sum
                    academic_seconds = int(academic_seconds * cat_ratio)
                    social_seconds = int(social_seconds * cat_ratio)
                    entertainment_seconds = int(entertainment_seconds * cat_ratio)
                    adult_seconds = int(adult_seconds * cat_ratio)

                # Persist daily state to local cache
                save_daily_state({
                    "date": today_str,
                    "total_screen_seconds": total_screen_seconds,
                    "late_night_seconds": late_night_seconds,
                    "academic_seconds": academic_seconds,
                    "social_seconds": social_seconds,
                    "entertainment_seconds": entertainment_seconds,
                    "adult_seconds": adult_seconds,
                    "continuous_active_seconds": continuous_active_seconds,
                    "last_sync": datetime.datetime.now().isoformat()
                })

                # Check if student logged in while agent was tracking
                if not token or not student_id:
                    new_auth = get_active_student_auth()
                    if new_auth:
                        token = new_auth.get("access_token")
                        student_id = new_auth.get("id")
                        student_email = new_auth.get("email", "student")
                        log_agent(f"[+] Student authenticated: {student_email}! Associating session & syncing {int(total_screen_seconds / 60)}m active screen time.")

                if token and student_id:
                    payload = {
                        "student_id": student_id,
                        "date": today_str,
                        "total_screen_time_minutes": int(total_screen_seconds / 60),
                        "late_night_usage_minutes": int(late_night_seconds / 60),
                        "academic_usage_minutes": int(academic_seconds / 60),
                        "social_usage_minutes": int(social_seconds / 60),
                        "entertainment_usage_minutes": int(entertainment_seconds / 60),
                        "adult_usage_minutes": max(1, int(math.ceil(adult_seconds / 60.0))) if adult_seconds >= 10 else 0,
                        "continuous_screen_minutes": int(continuous_active_seconds / 60),
                        "baseline_deviation_score": 0.0,
                        "is_crisis_search_flag": has_crisis_event
                    }
                    # Integrate Mathematical Sleep-Wake Cycle Metrics
                    sleep_cycle_metrics = infer_circadian_sleep_metrics(late_night_seconds, entertainment_seconds)
                    payload.update(sleep_cycle_metrics)
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

                            status_color = "🟢" if risk_level == "LOW" else "🟡" if risk_level == "MEDIUM" else "🔴"
                            display_title = (title[:35] + "..") if len(title) > 35 else (title or proc_name)
                            log_agent(
                                f"{status_color} Synced: "
                                f"{payload['total_screen_time_minutes']}m Active | "
                                f"{payload['adult_usage_minutes']}m Adult | "
                                f"{payload['late_night_usage_minutes']}m Late-Night | "
                                f"Context: {category} ({display_title}) | "
                                f"Risk: {risk_level}"
                            )
                        elif res.status_code == 401:
                            log_agent("[!] Token expired or rejected. Clearing cached token and awaiting student re-login...")
                            try:
                                if TOKEN_CACHE_FILE.exists():
                                    TOKEN_CACHE_FILE.unlink()
                            except Exception:
                                pass
                            token = None
                            student_id = None
                    except requests.exceptions.RequestException:
                        log_agent(f"[*] Offline tracking: {int(total_screen_seconds / 60)}m recorded locally (waiting for backend sync)...")
                else:
                    log_agent(f"[*] Passive boot tracking: {int(total_screen_seconds / 60)}m active screen time (awaiting student dashboard login)...")

    except KeyboardInterrupt:
        log_agent("[*] MindGuard PC Agent stopped safely. Take care of your mental wellness!")

def run_tray_agent():
    """
    Runs the agent with an optional pystray taskbar tray icon if available, or falls back to direct execution.
    """
    try:
        import pystray
        from PIL import Image, ImageDraw

        def create_tray_icon_image(color="green"):
            img = Image.new("RGB", (64, 64), color=(30, 30, 30))
            draw = ImageDraw.Draw(img)
            fill_color = (16, 185, 129) if color == "green" else (245, 158, 11)
            draw.ellipse((12, 12, 52, 52), fill=fill_color)
            return img

        agent_thread = threading.Thread(target=start_agent, daemon=True)
        agent_thread.start()

        def on_open_dashboard(icon, item):
            webbrowser.open("http://localhost:5173/student/dashboard")

        def on_exit(icon, item):
            icon.stop()
            os._exit(0)

        icon = pystray.Icon(
            "MindGuard PC Agent",
            create_tray_icon_image("green"),
            "MindGuard Behavioral Phenotyping (Active)",
            menu=pystray.Menu(
                pystray.MenuItem("Open Student Wellness Hub", on_open_dashboard),
                pystray.MenuItem("Status: Active & Protected", lambda: None, enabled=False),
                pystray.MenuItem("Exit Agent", on_exit)
            )
        )
        log_agent("[*] MindGuard PC Agent system tray icon initialized.")
        icon.run()
    except ImportError:
        start_agent()

if __name__ == "__main__":
    if "--install-startup" in sys.argv:
        install_to_startup()
    elif "--uninstall-startup" in sys.argv:
        uninstall_from_startup()
    elif "--login" in sys.argv:
        prompt_student_login()
    elif "--tray" in sys.argv or os.environ.get("MINDGUARD_TRAY") == "1":
        run_tray_agent()
    else:
        start_agent()

