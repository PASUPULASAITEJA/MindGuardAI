/**
 * Haptic Vibration Feedback Utilities
 * Provides subtle tactile feedback on mobile devices using Web Vibration API.
 * Gracefully degrades to no-op when unsupported.
 */

export const triggerHaptic = (
  type: "selection" | "success" | "warning" | "error" | "crisis" | "breathIn" | "breathOut" = "selection"
): void => {
  if (typeof window === "undefined" || !("vibrate" in navigator)) {
    return;
  }

  try {
    switch (type) {
      case "selection":
        navigator.vibrate(12);
        break;
      case "success":
        navigator.vibrate([15, 60, 20]);
        break;
      case "warning":
        navigator.vibrate([30, 80, 30]);
        break;
      case "error":
        navigator.vibrate([50, 50, 50, 50, 50]);
        break;
      case "crisis":
        navigator.vibrate([100, 50, 100, 50, 200]);
        break;
      case "breathIn":
        navigator.vibrate([20, 100, 25]);
        break;
      case "breathOut":
        navigator.vibrate(15);
        break;
      default:
        navigator.vibrate(10);
    }
  } catch {
    // Suppress vibration security errors on unfocused frames
  }
};

export default triggerHaptic;
