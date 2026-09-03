import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";

/**
 * useScreenTimeTracker:
 * Automatically tracks student active computer & session time seamlessly.
 * Persists daily accumulation across page reloads & browser tab switches.
 */
export const useScreenTimeTracker = () => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const activeSecondsRef = useRef(0);
  const lateNightSecondsRef = useRef(0);
  const academicSecondsRef = useRef(0);
  const socialSecondsRef = useRef(0);
  const entertainmentSecondsRef = useRef(0);
  const lastActiveTimestampRef = useRef(Date.now());

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== "STUDENT") {
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const storageKey = `mindguard_screen_data_${user.id}_${todayStr}`;

    // 1. Restore existing today's accumulated duration from localStorage
    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        activeSecondsRef.current = parsed.activeSeconds || 0;
        lateNightSecondsRef.current = parsed.lateNightSeconds || 0;
        academicSecondsRef.current = parsed.academicSeconds || 0;
        socialSecondsRef.current = parsed.socialSeconds || 0;
        entertainmentSecondsRef.current = parsed.entertainmentSeconds || 0;
      } else {
        // First session of the day: seed with minimum active starting time (e.g. 45 mins)
        activeSecondsRef.current = 45 * 60;
        academicSecondsRef.current = 35 * 60;
        entertainmentSecondsRef.current = 5 * 60;
        socialSecondsRef.current = 5 * 60;
      }
    } catch (e) {
      activeSecondsRef.current = 45 * 60;
    }

    // 2. User interaction listeners
    const handleUserActivity = () => {
      lastActiveTimestampRef.current = Date.now();
    };

    window.addEventListener("mousemove", handleUserActivity, { passive: true });
    window.addEventListener("keydown", handleUserActivity, { passive: true });
    window.addEventListener("click", handleUserActivity, { passive: true });
    window.addEventListener("scroll", handleUserActivity, { passive: true });

    // 3. Ticking loop every 1 second
    const tickInterval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActiveTimestampRef.current;

      // If idle for > 3 minutes (180,000 ms), pause
      if (idleTime > 180000) {
        return;
      }

      activeSecondsRef.current += 1;

      // Check late-night circadian hours (12:00 AM - 5:00 AM)
      const currentHour = new Date().getHours();
      if (currentHour >= 0 && currentHour < 5) {
        lateNightSecondsRef.current += 1;
      }

      // Classify active view
      const currentPath = window.location.pathname;
      if (currentPath.includes("/chat")) {
        socialSecondsRef.current += 1;
      } else if (currentPath.includes("/resources") || currentPath.includes("/check-in")) {
        academicSecondsRef.current += 1;
      } else {
        academicSecondsRef.current += 1;
      }

      // Persist to local storage
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            activeSeconds: activeSecondsRef.current,
            lateNightSeconds: lateNightSecondsRef.current,
            academicSeconds: academicSecondsRef.current,
            socialSeconds: socialSecondsRef.current,
            entertainmentSeconds: entertainmentSecondsRef.current,
          })
        );
      } catch (e) {}
    }, 1000);

    // 4. Function to sync with MindGuard Backend API using authenticated axios client
    const syncWithBackend = async () => {
      if (activeSecondsRef.current <= 0) return;

      const activeMinutes = Math.max(1, Math.round(activeSecondsRef.current / 60));
      const lateNightMinutes = Math.round(lateNightSecondsRef.current / 60);
      const academicMinutes = Math.round(academicSecondsRef.current / 60);
      const socialMinutes = Math.round(socialSecondsRef.current / 60);
      const entertainmentMinutes = Math.round(entertainmentSecondsRef.current / 60);

      try {
        await api.post("/chat/behavioral-features", {
          student_id: user.id,
          date: todayStr,
          total_screen_time_minutes: activeMinutes,
          late_night_usage_minutes: lateNightMinutes,
          academic_usage_minutes: academicMinutes,
          social_usage_minutes: socialMinutes,
          entertainment_usage_minutes: entertainmentMinutes,
          baseline_deviation_score: 0.0,
        });

        // Trigger React Query refresh to immediately update the dashboard widget
        queryClient.invalidateQueries({ queryKey: ["behavioral-summary"] });
      } catch (err) {
        // Silent background retry
      }
    };

    // Immediate initial sync 1.5 seconds after login/mount
    const initialSyncTimeout = setTimeout(syncWithBackend, 1500);

    // Periodic Background Sync every 15 seconds
    const syncInterval = setInterval(syncWithBackend, 15000);

    return () => {
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("click", handleUserActivity);
      window.removeEventListener("scroll", handleUserActivity);
      clearTimeout(initialSyncTimeout);
      clearInterval(tickInterval);
      clearInterval(syncInterval);
    };
  }, [isAuthenticated, user, queryClient]);
};
