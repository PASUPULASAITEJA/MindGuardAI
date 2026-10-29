import { useState, useEffect } from "react";

export interface MobileDetectResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  orientation: "portrait" | "landscape";
  width: number;
  height: number;
}

/**
 * Custom React hook for dynamic mobile phone and touch viewport detection.
 * Automatically updates on window resize, device orientation change, or virtual keyboard toggle.
 */
export function useMobileDetect(): MobileDetectResult {
  const getWindowDimensions = (): MobileDetectResult => {
    if (typeof window === "undefined") {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        orientation: "landscape",
        width: 1280,
        height: 800,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1024;
    const isDesktop = width >= 1024;
    const orientation = height >= width ? "portrait" : "landscape";

    return {
      isMobile,
      isTablet,
      isDesktop,
      isTouch,
      orientation,
      width,
      height,
    };
  };

  const [state, setState] = useState<MobileDetectResult>(getWindowDimensions);

  useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setState(getWindowDimensions());
      }, 100);
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, []);

  return state;
}

export default useMobileDetect;
