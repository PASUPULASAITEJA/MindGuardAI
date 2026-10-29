import { useState, useEffect } from "react";

export interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  dyslexicFont: boolean;
}

const STORAGE_KEY = "mindguard_accessibility_settings";

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    if (typeof window === "undefined") {
      return { reducedMotion: false, highContrast: false, largeText: false, dyslexicFont: false };
    }
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return {
      reducedMotion: prefersReducedMotion,
      highContrast: false,
      largeText: false,
      dyslexicFont: false,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }

    if (settings.highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }

    if (settings.largeText) {
      document.documentElement.classList.add("text-lg-scale");
    } else {
      document.documentElement.classList.remove("text-lg-scale");
    }
  }, [settings]);

  const toggleReducedMotion = () => setSettings((s) => ({ ...s, reducedMotion: !s.reducedMotion }));
  const toggleHighContrast = () => setSettings((s) => ({ ...s, highContrast: !s.highContrast }));
  const toggleLargeText = () => setSettings((s) => ({ ...s, largeText: !s.largeText }));
  const toggleDyslexicFont = () => setSettings((s) => ({ ...s, dyslexicFont: !s.dyslexicFont }));

  return {
    settings,
    toggleReducedMotion,
    toggleHighContrast,
    toggleLargeText,
    toggleDyslexicFont,
  };
}

export default useAccessibility;
