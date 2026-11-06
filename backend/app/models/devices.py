"""
Device models compatibility layer.
Aliases Device and DevicePlatform from digital_wellness to guarantee single source of truth.
"""
from app.models.digital_wellness import Device, DevicePlatform

# Backward compatibility alias
UserDevice = Device

__all__ = ["Device", "UserDevice", "DevicePlatform"]
