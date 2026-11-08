/**
 * MindGuard AI — Privacy-Preserving Client Telemetry & Analytics Service
 * 
 * Strict FERPA & HIPAA alignment:
 * - Zero third-party ad beacons or trackers
 * - Strict adherence to user cookie & consent preferences
 * - Strict compliance with Do-Not-Track (DNT) browser settings
 * - Anonymized aggregate session and performance metrics only
 */

export interface TelemetryEvent {
  category: "navigation" | "wellness_action" | "assessment" | "security" | "error";
  action: string;
  label?: string;
  value?: number;
  timestamp: string;
}

class TelemetryService {
  private isConsented(): boolean {
    if (typeof window === "undefined") return false;
    
    // Honor Do Not Track header
    if (navigator.doNotTrack === "1" || (window as any).doNotTrack === "1") {
      return false;
    }

    try {
      const consentRaw = localStorage.getItem("mindguard_cookie_consent");
      if (!consentRaw) return false;
      const consent = JSON.parse(consentRaw);
      return consent.level === "all";
    } catch {
      return false;
    }
  }

  /**
   * Tracks an anonymized user interaction or engagement event
   */
  public trackEvent(
    category: TelemetryEvent["category"],
    action: string,
    label?: string,
    value?: number
  ): void {
    if (!this.isConsented()) {
      return;
    }

    const event: TelemetryEvent = {
      category,
      action,
      label,
      value,
      timestamp: new Date().toISOString(),
    };

    // Store in-memory / session circular buffer (last 50 events)
    try {
      const sessionEventsKey = "mindguard_session_events";
      const existing = JSON.parse(sessionStorage.getItem(sessionEventsKey) || "[]");
      existing.push(event);
      if (existing.length > 50) {
        existing.shift();
      }
      sessionStorage.setItem(sessionEventsKey, JSON.stringify(existing));
    } catch {
      // Safe fallback if sessionStorage is restricted
    }

    if (import.meta.env.DEV) {
      console.debug("[MindGuard Telemetry]", event);
    }
  }

  /**
   * Tracks application errors or boundary catches
   */
  public trackError(error: Error, errorInfo?: any): void {
    const errorEvent: TelemetryEvent = {
      category: "error",
      action: "runtime_error",
      label: `${error.name}: ${error.message}`.slice(0, 150),
      timestamp: new Date().toISOString(),
    };

    try {
      const sessionErrorsKey = "mindguard_session_errors";
      const existing = JSON.parse(sessionStorage.getItem(sessionErrorsKey) || "[]");
      existing.push({
        ...errorEvent,
        stack: error.stack ? error.stack.slice(0, 500) : undefined,
        componentStack: errorInfo?.componentStack ? String(errorInfo.componentStack).slice(0, 500) : undefined,
      });
      if (existing.length > 20) {
        existing.shift();
      }
      sessionStorage.setItem(sessionErrorsKey, JSON.stringify(existing));
    } catch {
      // Ignore storage errors
    }

    if (import.meta.env.DEV) {
      console.error("[MindGuard Error Monitor]", error, errorInfo);
    }
  }

  /**
   * Measures web vitals and initial page performance
   */
  public reportWebPerformance(): void {
    if (typeof window === "undefined" || !window.performance) return;

    try {
      const navigation = window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      if (navigation) {
        const ttfb = Math.round(navigation.responseStart - navigation.requestStart);
        const domReady = Math.round(navigation.domContentLoadedEventEnd - navigation.startTime);
        this.trackEvent("navigation", "page_perf", "dom_ready_ms", domReady);
        this.trackEvent("navigation", "ttfb_metric", "ttfb_ms", ttfb);
      }
    } catch {
      // Non-critical performance measurement
    }
  }
}

export const telemetry = new TelemetryService();
export default telemetry;
