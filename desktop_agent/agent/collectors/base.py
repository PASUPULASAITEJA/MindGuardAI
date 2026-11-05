from abc import ABC, abstractmethod
from typing import Tuple, List, Dict, Any, Optional

class BaseCollector(ABC):
    """
    Abstract contract for cross-platform OS activity and digital biomarker monitoring.
    Platform-specific subclasses implement native system calls.
    """

    @abstractmethod
    def get_idle_seconds(self) -> float:
        """Returns physical seconds elapsed since user's last keyboard/mouse input."""
        pass

    @abstractmethod
    def is_screen_locked(self) -> bool:
        """Returns True if user's workstation screen is locked or asleep."""
        pass

    @abstractmethod
    def get_foreground_window(self) -> Tuple[str, str, str, str]:
        """
        Returns (process_name, window_title, app_name, category)
        Categories: Education, Programming, Communication, Entertainment, Social Media, Gaming, Productivity, Other.
        """
        pass

    @abstractmethod
    def get_notifications_summary(self, date_str: str) -> List[Dict[str, Any]]:
        """
        Returns authentic list of notifications received by application.
        Strict privacy: Returns counts only, zero message bodies, OTPs, or text.
        """
        pass

    @abstractmethod
    def is_supported(self) -> bool:
        """Returns True if the current OS platform has required system APIs available."""
        pass

    @abstractmethod
    def get_unsupported_reasons(self) -> List[str]:
        """Returns human-readable explanation if any telemetry capability requires OS permissions."""
        pass

    def classify_application(self, proc_name: str, window_title: str) -> Tuple[str, str]:
        """
        Canonical taxonomy categorizer used across all platforms.
        Returns (display_name, category)
        """
        proc_lower = proc_name.lower().replace(".exe", "")
        title_lower = window_title.lower()

        # 1. Programming & Software Development
        if any(p in proc_lower for p in ["code", "pycharm", "intellij", "devenv", "cursor", "sublime", "antigravity", "rider", "eclipse", "clion"]):
            display = "Visual Studio Code" if "code" in proc_lower else \
                      "Antigravity IDE" if "antigravity" in proc_lower else \
                      "PyCharm" if "pycharm" in proc_lower else proc_lower.title()
            return display, "Programming"

        if any(p in proc_lower for p in ["terminal", "powershell", "cmd", "bash", "wsl", "iterm", "alacritty", "warp"]):
            return "Developer Terminal", "Programming"

        # 2. Education & Coursework
        if any(p in proc_lower for p in ["word", "powerpnt", "excel", "acrobat", "notion", "obsidian", "zotero", "mendeley", "texstudio", "matlab"]):
            display = "Microsoft Word" if "word" in proc_lower else \
                      "Microsoft PowerPoint" if "powerpnt" in proc_lower else \
                      "Microsoft Excel" if "excel" in proc_lower else \
                      "Adobe Acrobat Reader" if "acrobat" in proc_lower else \
                      "Notion" if "notion" in proc_lower else proc_lower.title()
            return display, "Education"

        # 3. Communication & Teamwork
        if any(p in proc_lower for p in ["teams", "slack", "zoom", "olk", "outlook", "webex"]):
            display = "Microsoft Teams" if "teams" in proc_lower else \
                      "Slack" if "slack" in proc_lower else \
                      "Zoom Meeting" if "zoom" in proc_lower else \
                      "Microsoft Outlook" if any(k in proc_lower for k in ["olk", "outlook"]) else proc_lower.title()
            return display, "Communication"

        # 4. Social Media
        if any(p in proc_lower for p in ["discord", "telegram", "whatsapp", "signal", "element"]):
            display = "Discord" if "discord" in proc_lower else \
                      "Telegram" if "telegram" in proc_lower else \
                      "WhatsApp" if "whatsapp" in proc_lower else proc_lower.title()
            return display, "Social Media"

        # 5. Entertainment & Gaming
        if any(p in proc_lower for p in ["spotify", "vlc", "steam", "riot", "valorant", "epicgames", "league", "overwatch", "minecraft", "roblox"]):
            display = "Spotify" if "spotify" in proc_lower else \
                      "VLC Media Player" if "vlc" in proc_lower else \
                      "Steam" if "steam" in proc_lower else proc_lower.title()
            return display, "Entertainment"

        # 6. Web Browsers (Contextual categorization via active tab title)
        if any(p in proc_lower for p in ["chrome", "msedge", "edge", "firefox", "safari", "brave", "opera"]):
            browser = "Google Chrome" if "chrome" in proc_lower else \
                      "Microsoft Edge" if "edge" in proc_lower else \
                      "Mozilla Firefox" if "firefox" in proc_lower else \
                      "Apple Safari" if "safari" in proc_lower else "Web Browser"

            # Check study/coding context in tab title
            if any(k in title_lower for k in ["github", "stackoverflow", "docs", "leetcode", "arxiv", "canvas", "blackboard", "moodle", "coursera", "overleaf", "jupyter", "lecture", "assignment"]):
                return browser, "Education"
            if any(k in title_lower for k in ["youtube", "netflix", "twitch", "prime video", "anime", "crunchyroll"]):
                return browser, "Entertainment"
            if any(k in title_lower for k in ["reddit", "instagram", "twitter", "x.com", "tiktok", "facebook", "linkedin"]):
                return browser, "Social Media"
            return browser, "Productivity"

        # 7. System & Productivity
        if any(p in proc_lower for p in ["explorer", "finder", "nautilus", "calculator", "settings"]):
            return "File Manager / System", "Productivity"

        return proc_name.replace(".exe", "").title(), "Other"

