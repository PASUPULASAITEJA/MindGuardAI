import platform
from .base import BaseCollector
from .windows import WindowsCollector
from .macos import MacOSCollector
from .linux import LinuxCollector

def get_platform_collector() -> BaseCollector:
    """Instantiates the appropriate native collector for the current host operating system."""
    system = platform.system().lower()
    if system == "windows":
        return WindowsCollector()
    elif system == "darwin":
        return MacOSCollector()
    elif system.startswith("linux"):
        return LinuxCollector()
    else:
        # Default fallback to Windows or Linux interface
        return WindowsCollector()
