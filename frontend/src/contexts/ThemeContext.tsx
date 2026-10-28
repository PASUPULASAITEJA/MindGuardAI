import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "light" | "dark";
export type ThemeMode = "light" | "dark" | "circadian";

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isNight: boolean;
  setTheme: (theme: Theme) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = "mindguard-theme";
const THEME_MODE_STORAGE_KEY = "mindguard-theme-mode";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Calculates whether it is currently daytime or nighttime according to local time.
 * Day Mood: 6:00 AM – 6:00 PM (18:00)
 * Night Mood: 6:00 PM – 6:00 AM
 */
export const getCircadianTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  const hours = new Date().getHours();
  return hours >= 6 && hours < 18 ? "light" : "dark";
};

const getSystemTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return getCircadianTheme();
};

const getStoredTheme = (): Theme | null => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "dark" || stored === "light" ? stored : null;
};

const getStoredMode = (): ThemeMode => {
  if (typeof window === "undefined") return "circadian";
  const stored = localStorage.getItem(THEME_MODE_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "circadian") {
    return stored;
  }
  return "circadian";
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storedTheme = getStoredTheme();
  const storedMode = getStoredMode();

  // If user explicitly chose light/dark, use that. Otherwise use circadian day/night mood.
  const [themeMode, setThemeModeState] = useState<ThemeMode>(
    storedTheme ? (storedTheme as ThemeMode) : storedMode
  );

  const [theme, setThemeState] = useState<Theme>(() => {
    if (storedTheme) return storedTheme;
    if (storedMode === "circadian") return getCircadianTheme();
    return getSystemTheme();
  });

  const isNight = theme === "dark";

  const applyTheme = useCallback((nextTheme: Theme) => {
    if (typeof document === "undefined") return;
    const isDark = nextTheme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.setAttribute("data-theme", nextTheme);
    document.documentElement.style.colorScheme = nextTheme;
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Periodic circadian check: if mode is circadian, update theme on the hour
  useEffect(() => {
    if (themeMode !== "circadian") return;

    const checkCircadian = () => {
      const naturalTheme = getCircadianTheme();
      setThemeState(naturalTheme);
      applyTheme(naturalTheme);
    };

    checkCircadian();
    const interval = setInterval(checkCircadian, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [themeMode, applyTheme]);

  // Listen for OS dark mode changes if in system/circadian
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (themeMode === "circadian") {
        const next = getCircadianTheme();
        setThemeState(next);
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [themeMode]);

  const setTheme = useCallback((nextTheme: Theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    localStorage.setItem(THEME_MODE_STORAGE_KEY, nextTheme);
    setThemeModeState(nextTheme);
    setThemeState(nextTheme);
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
    setThemeModeState(mode);
    if (mode === "circadian") {
      localStorage.removeItem(THEME_STORAGE_KEY);
      const circadianTheme = getCircadianTheme();
      setThemeState(circadianTheme);
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeState(mode);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [theme, setTheme]);

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      isNight,
      setTheme,
      setThemeMode,
      toggleTheme,
    }),
    [theme, themeMode, isNight, setTheme, setThemeMode, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};


