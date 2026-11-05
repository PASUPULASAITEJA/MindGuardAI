import sys
import os
import ctypes
from typing import Tuple, List, Dict, Any, Optional
from datetime import datetime, timezone
from pathlib import Path

from .base import BaseCollector

class LASTINPUTINFO(ctypes.Structure):
    _fields_ = [("cbSize", ctypes.c_uint), ("dwTime", ctypes.c_uint)]

class WindowsCollector(BaseCollector):
    """
    Windows 10 / 11 native telemetry collector.
    Utilizes Win32 APIs for physical idle detection, foreground app tracking,
    and Windows Action Center notification metrics without capturing private text.
    """
    def __init__(self):
        self._desktop_handle = None

    def is_supported(self) -> bool:
        return sys.platform == "win32"

    def get_unsupported_reasons(self) -> List[str]:
        if sys.platform != "win32":
            return ["WindowsCollector requires Windows 10 or 11 operating system."]
        return []

    def get_idle_seconds(self) -> float:
        """Physical seconds elapsed since user's last keyboard/mouse movement."""
        if not self.is_supported():
            return 0.0
        try:
            last_input = LASTINPUTINFO()
            last_input.cbSize = ctypes.sizeof(LASTINPUTINFO)
            if ctypes.windll.user32.GetLastInputInfo(ctypes.byref(last_input)):
                millis = ctypes.windll.kernel32.GetTickCount() - last_input.dwTime
                return max(0.0, millis / 1000.0)
        except Exception:
            pass
        return 0.0

    def is_screen_locked(self) -> bool:
        """Determines if the Windows workstation is locked or at login screen."""
        if not self.is_supported():
            return False
        try:
            # Check if foreground window is the Windows Lock Screen application
            hwnd = ctypes.windll.user32.GetForegroundWindow()
            if not hwnd:
                return True
            length = ctypes.windll.user32.GetWindowTextLengthW(hwnd)
            buff = ctypes.create_unicode_buffer(length + 1)
            ctypes.windll.user32.GetWindowTextW(hwnd, buff, length + 1)
            title = buff.value.lower()
            if "windows default lock screen" in title or "lockapp" in title:
                return True

            # Also check process name of foreground window
            pid = ctypes.c_ulong()
            ctypes.windll.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
            if pid.value > 0:
                import psutil
                try:
                    p = psutil.Process(pid.value)
                    if p.name().lower() in ["lockapp.exe", "logonui.exe"]:
                        return True
                except Exception:
                    pass
        except Exception:
            pass
        return False

    def get_foreground_window(self) -> Tuple[str, str, str, str]:
        """
        Returns (proc_name, window_title, display_name, category)
        Safely reads foreground window title and process identifier.
        """
        if not self.is_supported():
            return "unknown", "", "Unknown", "Other"

        proc_name = "explorer.exe"
        window_title = ""

        try:
            hwnd = ctypes.windll.user32.GetForegroundWindow()
            if hwnd:
                pid = ctypes.c_ulong()
                ctypes.windll.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
                if pid.value > 0:
                    import psutil
                    try:
                        p = psutil.Process(pid.value)
                        proc_name = p.name().lower()
                    except Exception:
                        pass

                length = ctypes.windll.user32.GetWindowTextLengthW(hwnd)
                if length > 0:
                    buff = ctypes.create_unicode_buffer(length + 1)
                    ctypes.windll.user32.GetWindowTextW(hwnd, buff, length + 1)
                    window_title = buff.value
        except Exception:
            pass

        display_name, category = self.classify_application(proc_name, window_title)
        return proc_name, window_title, display_name, category

    def get_notifications_summary(self, date_str: str) -> List[Dict[str, Any]]:
        """
        Reads Windows Notification Center wpndatabase.db safely via a temporary copy.
        Returns notification count by application. Zero message bodies or private text.
        """
        if not self.is_supported():
            return []

        import sqlite3
        import shutil
        import tempfile

        appdata_local = os.environ.get("LOCALAPPDATA")
        if not appdata_local:
            return []

        db_path = Path(appdata_local) / "Microsoft" / "Windows" / "Notifications" / "wpndatabase.db"
        if not db_path.exists():
            return []

        temp_db = Path(tempfile.gettempdir()) / f"mg_wpn_{os.getpid()}_{int(datetime.now().timestamp())}.db"
        results = []

        try:
            shutil.copy2(db_path, temp_db)
            conn = sqlite3.connect(temp_db, timeout=2.0)
            cur = conn.cursor()

            epoch = datetime(1601, 1, 1, tzinfo=timezone.utc)
            target_midnight = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            filetime_start = int((target_midnight - epoch).total_seconds() * 10_000_000)
            filetime_end = filetime_start + int(86400 * 10_000_000)

            cur.execute("""
                SELECT h.PrimaryId, COUNT(*), n.ArrivalTime
                FROM Notification n
                JOIN NotificationHandler h ON n.HandlerId = h.RecordId
                WHERE n.ArrivalTime >= ? AND n.ArrivalTime < ?
                GROUP BY h.PrimaryId
            """, (filetime_start, filetime_end))

            rows = cur.fetchall()
            conn.close()

            for primary_id, count, _ in rows:
                p_id_str = str(primary_id).lower()
                clean_name = p_id_str.split("!")[0].split(".")[-1]
                app_name, _ = self.classify_application(clean_name, "")
                results.append({
                    "app_name": app_name,
                    "app_identifier": clean_name,
                    "notification_count": count
                })
        except Exception:
            pass
        finally:
            try:
                if temp_db.exists():
                    temp_db.unlink()
            except Exception:
                pass

        return results

