import sys
import os
import subprocess
from typing import Tuple, List, Dict, Any, Optional
from .base import BaseCollector

class LinuxCollector(BaseCollector):
    """
    Linux X11 and Wayland activity collector.
    Supports idle detection via xprintidle/mutter, foreground tracking via xdotool/xprop,
    and screen locked detection via loginctl/screensaver DBus.
    """
    def is_supported(self) -> bool:
        return sys.platform.startswith("linux")

    def get_unsupported_reasons(self) -> List[str]:
        reasons = []
        if not self.is_supported():
            reasons.append("LinuxCollector requires Linux operating system.")
        return reasons

    def get_idle_seconds(self) -> float:
        """Physical seconds elapsed since user's last keyboard/mouse input."""
        if not self.is_supported():
            return 0.0
        # 1. Try xprintidle (X11)
        try:
            out = subprocess.check_output(["xprintidle"], text=True, timeout=1).strip()
            millis = int(out)
            return max(0.0, millis / 1000.0)
        except Exception:
            pass

        # 2. Try GNOME screensaver DBus query
        try:
            cmd = [
                "dbus-send", "--print-reply", "--dest=org.gnome.Mutter.IdleMonitor",
                "/org/gnome/Mutter/IdleMonitor/Core",
                "org.gnome.Mutter.IdleMonitor.GetIdletime"
            ]
            out = subprocess.check_output(cmd, text=True, timeout=1)
            for line in out.splitlines():
                if "uint64" in line:
                    millis = int(line.split()[-1])
                    return max(0.0, millis / 1000.0)
        except Exception:
            pass

        return 0.0

    def is_screen_locked(self) -> bool:
        """Determines if the Linux user session is locked via loginctl or screenlock."""
        if not self.is_supported():
            return False
        try:
            cmd = ["loginctl", "show-session", "self", "-p", "LockedHint"]
            out = subprocess.check_output(cmd, text=True, timeout=1).strip()
            return "yes" in out.lower()
        except Exception:
            pass
        return False

    def get_foreground_window(self) -> Tuple[str, str, str, str]:
        """Reads frontmost application process name and window title."""
        if not self.is_supported():
            return "unknown", "", "Unknown", "Other"

        proc_name = "desktop"
        window_title = ""

        # Try xdotool
        try:
            wid_cmd = ["xdotool", "getactivewindow"]
            wid = subprocess.check_output(wid_cmd, text=True, timeout=1).strip()
            if wid:
                # Get process name
                pid_cmd = ["xdotool", "getwindowpid", wid]
                pid = subprocess.check_output(pid_cmd, text=True, timeout=1).strip()
                if pid:
                    import psutil
                    p = psutil.Process(int(pid))
                    proc_name = p.name().lower()

                # Get title
                title_cmd = ["xdotool", "getwindowname", wid]
                window_title = subprocess.check_output(title_cmd, text=True, timeout=1).strip()
        except Exception:
            pass

        display_name, category = self.classify_application(proc_name, window_title)
        return proc_name, window_title, display_name, category

    def get_notifications_summary(self, date_str: str) -> List[Dict[str, Any]]:
        """Linux notification daemon does not persist historical logs without specialized daemon plugins."""
        return []
