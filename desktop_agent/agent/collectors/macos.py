import sys
import subprocess
from typing import Tuple, List, Dict, Any, Optional
from .base import BaseCollector

class MacOSCollector(BaseCollector):
    """
    macOS native activity and digital biomarker collector.
    Supports idle detection via IOHIDSystem, active application queries via NSWorkspace/AppleScript,
    and screen lock status via CGSession.
    """
    def is_supported(self) -> bool:
        return sys.platform == "darwin"

    def get_unsupported_reasons(self) -> List[str]:
        reasons = []
        if sys.platform != "darwin":
            reasons.append("MacOSCollector requires macOS (Darwin) operating system.")
        return reasons

    def get_idle_seconds(self) -> float:
        """Reads system-level user inactivity from IOHIDSystem."""
        if not self.is_supported():
            return 0.0
        try:
            cmd = ["ioreg", "-c", "IOHIDSystem"]
            out = subprocess.check_output(cmd, text=True, timeout=2)
            for line in out.splitlines():
                if "HIDIdleTime" in line:
                    nanos = int(line.split("=")[-1].strip())
                    return max(0.0, nanos / 1_000_000_000.0)
        except Exception:
            pass
        return 0.0

    def is_screen_locked(self) -> bool:
        """Determines if the macOS session is currently screen-locked or screensaver active."""
        if not self.is_supported():
            return False
        try:
            cmd = ["python3", "-c", "import Quartz; d = Quartz.CGSessionCopyCurrentDictionary(); print(d.get('CGSSessionScreenIsLocked', 0))"]
            out = subprocess.check_output(cmd, text=True, timeout=2).strip()
            return out == "1"
        except Exception:
            pass
        return False

    def get_foreground_window(self) -> Tuple[str, str, str, str]:
        """Reads frontmost application name and window title via AppleScript."""
        if not self.is_supported():
            return "unknown", "", "Unknown", "Other"

        proc_name = "finder"
        window_title = ""

        try:
            ascript = """
            global frontApp, frontAppName, windowTitle
            set windowTitle to ""
            tell application "System Events"
                set frontApp to first application process whose frontmost is true
                set frontAppName to name of frontApp
                tell frontApp
                    if count of windows > 0 then
                        set windowTitle to name of front window
                    end if
                end tell
            end tell
            return frontAppName & "|||" & windowTitle
            """
            out = subprocess.check_output(["osascript", "-e", ascript], text=True, timeout=3).strip()
            if "|||" in out:
                parts = out.split("|||", 1)
                proc_name = parts[0].strip().lower()
                window_title = parts[1].strip()
        except Exception:
            pass

        display_name, category = self.classify_application(proc_name, window_title)
        return proc_name, window_title, display_name, category

    def get_notifications_summary(self, date_str: str) -> List[Dict[str, Any]]:
        """
        macOS Notification Center requires Full Disk Access permission to read internal DBs.
        If permission is not granted, returns empty list with zero synthetic data.
        """
        return []
