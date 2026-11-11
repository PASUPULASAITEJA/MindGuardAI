import React, { useState, useEffect } from "react";
import {
  Monitor,
  Moon,
  Sun,
  Clock,
  BookOpen,
  Gamepad2,
  MessageSquare,
  ShieldAlert,
  Search,
  Activity,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Laptop,
  Code,
  Globe,
  Music,
  TrendingUp,
  Brain,
  CalendarDays,
  Trophy,
  BarChart3,
  Target,
  ArrowUpRight,
  Eye,
  Sliders,
  HeartPulse,
  Flame,
  Check,
  Percent,
  Bell,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Calendar
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from "recharts";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { chatAPI } from "@/services/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { pageVariants, cardEntrance } from "@/utils/motion";
import { EyeBreakModal } from "@/components/EyeBreakModal";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { DotGridBackground } from "@/components/ui/DotGridBackground";
import { ShinyText } from "@/components/ui/ShinyText";

interface AppUsageItem {
  name: string;
  proc: string;
  minutes: number;
  times_opened?: number;
  notifications?: number;
  category: string;
  percentage?: number;
  icon?: string;
}

interface SearchTopicItem {
  query: string;
  count: number;
  category: string;
  flagged?: boolean;
}

export const ScreenTimePage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(() => {
    try {
      const cached = localStorage.getItem("mindguard_screen_summary_cache");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [refreshing, setRefreshing] = useState(false);
  const [isEyeBreakOpen, setIsEyeBreakOpen] = useState(false);
  const [customContinuousMins, setCustomContinuousMins] = useState<number | null>(null);
  const [appCategoryFilter, setAppCategoryFilter] = useState<string>("ALL");
  const [appMetricMode, setAppMetricMode] = useState<"time" | "opens" | "notifications">("time");

  const fetchSummary = async () => {
    try {
      setRefreshing(true);
      const res = await chatAPI.getBehavioralSummary();
      if (res) {
        setData(res);
        try {
          localStorage.setItem("mindguard_screen_summary_cache", JSON.stringify(res));
        } catch {}
      }
    } catch (err) {
      console.error("Error fetching screen time telemetry:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 15000); // 15s auto-refresh for live tracking
    return () => clearInterval(interval);
  }, []);

  const latest = data?.latest_log;
  const rawTotalMins = latest?.total_screen_time_minutes || 0;

  // Local date in YYYY-MM-DD
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Read local tracker accumulation from useScreenTimeTracker if available
  let localActiveMins = 0;
  let localAcademicMins = 0;
  let localSocialMins = 0;
  let localEntertainmentMins = 0;
  let localLateNightMins = 0;
  try {
    const rawLocal = localStorage.getItem(`mindguard_screen_data_${user?.id}_${todayStr}`) ||
                     localStorage.getItem(`mindguard_screen_data_default_${todayStr}`);
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      localActiveMins = Math.round((parsed.activeSeconds || 0) / 60);
      localAcademicMins = Math.round((parsed.academicSeconds || 0) / 60);
      localSocialMins = Math.round((parsed.socialSeconds || 0) / 60);
      localEntertainmentMins = Math.round((parsed.entertainmentSeconds || 0) / 60);
      localLateNightMins = Math.round((parsed.lateNightSeconds || 0) / 60);
    }
  } catch {}

  const totalMins = rawTotalMins > 0 ? rawTotalMins : localActiveMins;
  const lateNightMins = latest?.late_night_usage_minutes ?? localLateNightMins;
  const daytimeMins = latest?.daytime_usage_minutes ?? Math.max(0, totalMins - lateNightMins);
  const academicMins = latest?.academic_usage_minutes ?? localAcademicMins;
  const entertainmentMins = latest?.entertainment_usage_minutes ?? localEntertainmentMins;
  const socialMins = latest?.social_usage_minutes ?? localSocialMins;
  const adultMins = latest?.adult_usage_minutes || 0;
  const continuousMins = latest?.continuous_screen_minutes || 0;
  const displayContinuousMins = customContinuousMins !== null ? customContinuousMins : continuousMins;
  const isCrisis = latest?.is_crisis_detected || false;

  const formatHoursMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  // 1. 7-Day Longitudinal Daily Screen Time Data
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const rawWeekly = data?.weekly_history || [];

  const dailyScreenTimeData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (6 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    const dayName = daysOfWeek[d.getDay()];
    const label = i === 6 ? "Today" : `${dayName} ${d.getMonth() + 1}/${d.getDate()}`;
    const isToday = i === 6 || dateStr === todayStr;

    if (isToday) {
      const sMins = academicMins;
      const pMins = entertainmentMins;
      const lMins = lateNightMins;
      const tMins = totalMins;
      // Allocate active browsing & general PC time to social/normal so stacked bar matches full total
      const socMins = Math.max(socialMins, Math.max(0, tMins - sMins - pMins));
      return {
        day: "Today",
        date: dateStr,
        isToday: true,
        studyingHours: Number((sMins / 60).toFixed(1)),
        playingHours: Number((pMins / 60).toFixed(1)),
        socialHours: Number((socMins / 60).toFixed(1)),
        lateNightHours: Number((lMins / 60).toFixed(1)),
        totalHours: Number((tMins / 60).toFixed(1)),
      };
    }

    const record = rawWeekly.find((w: any) => w.date === dateStr);
    if (record) {
      const sMins = record.academic_usage_minutes || 0;
      const pMins = record.entertainment_usage_minutes || 0;
      const lMins = record.late_night_usage_minutes || 0;
      const tMins = record.total_screen_time_minutes || (sMins + pMins);
      const socMins = Math.max(record.social_usage_minutes || 0, Math.max(0, tMins - sMins - pMins));
      return {
        day: label,
        date: dateStr,
        isToday: false,
        studyingHours: Number((sMins / 60).toFixed(1)),
        playingHours: Number((pMins / 60).toFixed(1)),
        socialHours: Number((socMins / 60).toFixed(1)),
        lateNightHours: Number((lMins / 60).toFixed(1)),
        totalHours: Number((tMins / 60).toFixed(1)),
      };
    }

    return {
      day: label,
      date: dateStr,
      isToday: false,
      studyingHours: 0,
      playingHours: 0,
      socialHours: 0,
      lateNightHours: 0,
      totalHours: 0,
    };
  });

  const avgDailyHours = Number(
    (dailyScreenTimeData.reduce((acc, curr) => acc + curr.totalHours, 0) / 7).toFixed(1)
  );

  // Smartphone-Style Day Selector State
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const isSelectedToday = selectedDate === todayStr;
  const currentDayIndex = dailyScreenTimeData.findIndex((d) => d.date === selectedDate);
  const selectedDayObj = dailyScreenTimeData.find((d) => d.date === selectedDate) || dailyScreenTimeData[6];
  const selectedDayLabel = selectedDayObj?.isToday ? "Today" : selectedDayObj?.day || "Selected Day";
  const selectedPastRecord = rawWeekly.find((w: any) => w.date === selectedDate);

  // Day Navigation Stepper Handlers
  const handlePrevDay = () => {
    if (currentDayIndex > 0) {
      setSelectedDate(dailyScreenTimeData[currentDayIndex - 1].date);
    }
  };
  const handleNextDay = () => {
    if (currentDayIndex < dailyScreenTimeData.length - 1) {
      setSelectedDate(dailyScreenTimeData[currentDayIndex + 1].date);
    }
  };
  const handleResetToToday = () => {
    setSelectedDate(todayStr);
  };

  // Dynamic values mapped to selected day (Live values if Today; Database record if past day)
  const activeTotalMins = isSelectedToday
    ? totalMins
    : (selectedPastRecord?.total_screen_time_minutes ?? Math.round((selectedDayObj?.totalHours || 0) * 60));

  const activeLateNightMins = isSelectedToday
    ? lateNightMins
    : (selectedPastRecord?.late_night_usage_minutes ?? Math.round((selectedDayObj?.lateNightHours || 0) * 60));

  const activeDaytimeMins = isSelectedToday
    ? daytimeMins
    : (selectedPastRecord?.daytime_usage_minutes ?? Math.max(0, activeTotalMins - activeLateNightMins));

  const activeAcademicMins = isSelectedToday
    ? academicMins
    : (selectedPastRecord?.academic_usage_minutes ?? Math.round((selectedDayObj?.studyingHours || 0) * 60));

  const activeEntertainmentMins = isSelectedToday
    ? entertainmentMins
    : (selectedPastRecord?.entertainment_usage_minutes ?? Math.round((selectedDayObj?.playingHours || 0) * 60));

  const activeSocialMins = isSelectedToday
    ? socialMins
    : (selectedPastRecord?.social_usage_minutes ?? Math.round((selectedDayObj?.socialHours || 0) * 60));

  const activeAdultMins = isSelectedToday
    ? adultMins
    : (selectedPastRecord?.adult_usage_minutes || 0);

  const activeContinuousMins = isSelectedToday
    ? displayContinuousMins
    : (selectedPastRecord?.continuous_screen_minutes || 0);

  // 2. Category Chart Data for Selected Day (Studying, Playing, Normal, Adult)
  const categoryData = [
    { name: "Studying", value: activeAcademicMins, color: "#3b82f6", icon: BookOpen, desc: "Academic, Coding & Coursework" },
    { name: "Playing", value: activeEntertainmentMins, color: "#8b5cf6", icon: Gamepad2, desc: "Gaming, Media & Streaming" },
    { name: "Normal", value: activeSocialMins, color: "#10b981", icon: MessageSquare, desc: "Social, Messaging & Browsing" },
    { name: "Adult", value: activeAdultMins, color: "#f43f5e", icon: ShieldAlert, desc: "Restricted / Sensitive Content" },
  ].filter(c => c.value > 0);

  // Dominant purpose analysis for Selected Day
  const sortedCategories = [...categoryData].sort((a, b) => b.value - a.value);
  const dominantCategory = sortedCategories[0] || {
    name: "General Activity",
    value: activeTotalMins,
    desc: "Active desktop computing session",
    color: "#3b82f6"
  };
  const dominantPercentage = activeTotalMins > 0 && dominantCategory.value > 0
    ? Math.round((dominantCategory.value / activeTotalMins) * 100)
    : 0;

  // 3. Day vs Late Night Data for Selected Day
  const timeOfDayData = [
    { name: "Daytime (5am-11:59pm)", minutes: activeDaytimeMins, color: "#0ea5e9" },
    { name: "Late Night (12am-5am)", minutes: activeLateNightMins, color: "#f59e0b" },
  ];

  // 4. Digital Wellbeing & Phone Screen Time Metrics for Selected Day
  const rawTopApps: AppUsageItem[] = isSelectedToday
    ? (data?.top_apps || latest?.top_apps || [])
    : (selectedPastRecord?.top_apps || []);

  const allTopApps: AppUsageItem[] = rawTopApps.filter(
    (a: AppUsageItem) => a.minutes > 0 || (a.times_opened || 0) > 0 || (a.notifications || 0) > 0
  );

  // Totals for the 3 Phone Digital Wellbeing features on Selected Day
  const totalScreenTimeMins = activeTotalMins;
  const totalTimesOpened = isSelectedToday
    ? (data?.digital_wellbeing_summary?.total_times_opened ?? 
       allTopApps.reduce((acc: number, a: AppUsageItem) => acc + (a.times_opened || 1), 0))
    : (selectedPastRecord?.total_times_opened ?? 
       allTopApps.reduce((acc: number, a: AppUsageItem) => acc + (a.times_opened || 1), 0));

  const totalNotifications = isSelectedToday
    ? (data?.digital_wellbeing_summary?.total_notifications ?? 
       allTopApps.reduce((acc: number, a: AppUsageItem) => acc + (a.notifications || 0), 0))
    : (selectedPastRecord?.total_notifications ?? 
       allTopApps.reduce((acc: number, a: AppUsageItem) => acc + (a.notifications || 0), 0));

  // Filter by category
  const filteredApps = appCategoryFilter === "ALL"
    ? allTopApps
    : allTopApps.filter((a) => {
        const cat = (a.category || "").toLowerCase();
        const target = appCategoryFilter.toLowerCase();
        if (target === "studying") return cat === "studying" || cat === "academic";
        if (target === "playing") return cat === "playing" || cat === "entertainment";
        if (target === "normal") return cat === "normal" || cat === "social";
        return cat === target;
      });

  // Dynamically sort apps based on selected Phone Screen Time feature
  const topApps: AppUsageItem[] = [...filteredApps].sort((a, b) => {
    if (appMetricMode === "opens") {
      return (b.times_opened || 0) - (a.times_opened || 0);
    }
    if (appMetricMode === "notifications") {
      return (b.notifications || 0) - (a.notifications || 0);
    }
    return (b.minutes || 0) - (a.minutes || 0);
  });

  // 5. Online Searches for Selected Day
  const rawSearchTopics: SearchTopicItem[] = isSelectedToday
    ? (data?.search_topics || latest?.search_topics || [])
    : (selectedPastRecord?.search_topics || []);

  const searchTopics: SearchTopicItem[] = (rawSearchTopics || []).filter(
    (item) => {
      if (!item || typeof item.query !== "string") return false;
      const q = item.query.toLowerCase().trim();
      return !q.includes("harsha kushi") && !q.includes("metro");
    }
  );

  // Helper for App Icon
  const renderAppIcon = (icon?: string, category?: string) => {
    switch (icon) {
      case "code": return <Code className="w-5 h-5 text-blue-500" />;
      case "book": return <BookOpen className="w-5 h-5 text-indigo-500" />;
      case "gamepad": return <Gamepad2 className="w-5 h-5 text-purple-500" />;
      case "music": return <Music className="w-5 h-5 text-pink-500" />;
      case "message": return <MessageSquare className="w-5 h-5 text-emerald-500" />;
      case "globe": return <Globe className="w-5 h-5 text-sky-500" />;
      case "camera": return <Smartphone className="w-5 h-5 text-pink-500" />;
      case "video":
      case "tv": return <Activity className="w-5 h-5 text-amber-500" />;
      case "brain": return <Brain className="w-5 h-5 text-indigo-500" />;
      case "shield-alert": return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      default:
        if (category === "Playing") return <Gamepad2 className="w-5 h-5 text-purple-500" />;
        if (category === "Normal") return <MessageSquare className="w-5 h-5 text-emerald-500" />;
        if (category === "Adult") return <ShieldAlert className="w-5 h-5 text-rose-500" />;
        return <Smartphone className="w-5 h-5 text-blue-500" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "Studying":
      case "Academic":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "Playing":
      case "Entertainment":
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30";
      case "Normal":
      case "Social":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "Adult":
        return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
      case "Crisis / Urgent":
        return "bg-red-600 text-white animate-pulse border-red-500";
      default:
        return "bg-slate-500/15 text-muted-foreground border-slate-500/30";
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="relative w-full space-y-6 pb-12 font-sans text-foreground"
    >
      <DotGridBackground />

      {/* Top Navigation & Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={data?.is_agent_connected
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1.5 px-3 py-1"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-1.5 px-3 py-1"
            }
          >
            <span className={`w-2 h-2 rounded-full ${data?.is_agent_connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            {data?.is_agent_connected ? "Live Device Telemetry Active" : "Passive Screen Time Tracking"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSummary}
            disabled={refreshing}
            className="rounded-xl border-slate-200 dark:border-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Sync Now
          </Button>
        </div>
      </div>

      {/* Hero Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Monitor className="w-8 h-8 text-blue-500" />
          <ShinyText text="Screen Time & Digital Phenotyping" />
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Real-time activity classification, late-night circadian tracking, application usage, and search intent analysis.
        </p>
      </div>

      {/* Crisis Alert Banner (if flagged) */}
      {isCrisis && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 flex items-start gap-3 shadow-lg"
        >
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 animate-bounce" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Crisis Query Detected & Protection Safeguard Active</h4>
            <p className="text-xs text-red-600/90 dark:text-red-300 mt-0.5">
              A search query indicating severe acute distress was observed. Your campus counselor has been discretely notified.
              24/7 Crisis Hotline is available immediately at <span className="font-bold underline">988</span> or via the AI Companion.
            </p>
          </div>
        </motion.div>
      )}

      {/* 4 Stat Metric Cards (React Bits SpotlightCards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Screen Time */}
        <SpotlightCard className="p-5" spotlightColor="rgba(59, 130, 246, 0.15)">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Active {isSelectedToday ? "Today" : `(${selectedDayLabel})`}
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight">{formatHoursMins(activeTotalMins)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-amber-500" /> {formatHoursMins(activeDaytimeMins)} daytime active
            </p>
          </div>
        </SpotlightCard>

        {/* Stat 2: Late Night Disruption */}
        <SpotlightCard className="p-5" spotlightColor={activeLateNightMins >= 60 ? "rgba(245, 158, 11, 0.18)" : "rgba(16, 185, 129, 0.15)"}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Late Night (12am–5am)</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Moon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-2xl font-bold tracking-tight ${activeLateNightMins >= 60 ? "text-amber-600 dark:text-amber-400" : ""}`}>
                {formatHoursMins(activeLateNightMins)}
              </span>
              <Badge variant="outline" className={activeLateNightMins >= 60 ? "bg-amber-500/15 text-amber-600 text-[10px]" : "bg-emerald-500/15 text-emerald-600 text-[10px]"}>
                {activeLateNightMins >= 60 ? "Elevated Fatigue" : "Healthy Rest"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Circadian window between 00:00 & 05:00
            </p>
          </div>
        </SpotlightCard>

        {/* Stat 3: Study Focus Ratio */}
        <SpotlightCard className="p-5" spotlightColor="rgba(99, 102, 241, 0.15)">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Studying vs. Rest</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {activeTotalMins > 0 ? Math.round((activeAcademicMins / activeTotalMins) * 100) : 0}%
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">Academic Focus</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatHoursMins(activeAcademicMins)} on coursework & tools
            </p>
          </div>
        </SpotlightCard>

        {/* Stat 4: Unbroken Screen Session & 20-20-20 Pacer */}
        <SpotlightCard className="p-5" spotlightColor={activeContinuousMins >= 50 ? "rgba(245, 158, 11, 0.18)" : "rgba(16, 185, 129, 0.15)"}>
          <div className="flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {isSelectedToday ? "Active Strain Streak" : "Continuous Session Peak"}
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold tracking-tight">{formatHoursMins(activeContinuousMins)}</span>
                <Badge variant="outline" className={activeContinuousMins >= 50 ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] border-amber-500/30" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] border-emerald-500/30"}>
                  {activeContinuousMins >= 50 ? "Break Recommended" : "Rest Window OK"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeContinuousMins >= 50 ? "⚠️ Recommended: Take a 20-20-20 break" : "Within healthy eye-strain limits"}
              </p>
            </div>
            {isSelectedToday ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEyeBreakOpen(true)}
                className="mt-3 w-full text-xs h-8 rounded-xl border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center justify-center gap-1.5 font-semibold transition-all"
              >
                <Eye className="w-3.5 h-3.5" /> Start 20-20-20 Break
              </Button>
            ) : (
              <div className="mt-3 text-[11px] text-muted-foreground/80 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Historical session metric
              </div>
            )}
          </div>
        </SpotlightCard>
      </div>

      {/* Dominant Purpose Spotlight Banner */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Trophy className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Primary Device Purpose {isSelectedToday ? "(Today)" : `(${selectedDayLabel})`}
                </span>
                <Badge className="bg-blue-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                  {dominantCategory.name} • {dominantPercentage}% Dominance
                </Badge>
              </div>
              <h2 className="text-xl font-black text-foreground mt-0.5">
                Most Screen Time Spent on: <span className="text-blue-600 dark:text-blue-400">{dominantCategory.name}</span> {dominantCategory.value > 0 ? `(${formatHoursMins(dominantCategory.value)})` : ""}
              </h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                {activeTotalMins > 0
                  ? `Activity on ${selectedDayLabel} was predominantly dedicated to ${dominantCategory.desc} (${dominantPercentage}% of total classified activity).`
                  : "No active computer sessions recorded for this day."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 bg-background/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800/70">
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">7-Day Daily Avg</span>
              <span className="text-lg font-black text-foreground">{avgDailyHours}h / day</span>
            </div>
            <div className="h-7 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">{isSelectedToday ? "Today's Time" : "Day's Time"}</span>
              <span className="text-lg font-black text-blue-600 dark:text-blue-400">{formatHoursMins(activeTotalMins)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 7-Day Daily Screen Time of Student Graphic */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Daily Screen Time of Student (Past 7 Days)
              </CardTitle>
              <CardDescription className="text-xs">
                Total hours logged per day broken down by purpose: Studying vs. Playing vs. Social.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-blue-500" />
                <span className="text-muted-foreground text-[11px] font-medium">Studying</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-purple-500" />
                <span className="text-muted-foreground text-[11px] font-medium">Playing / Gaming</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500" />
                <span className="text-muted-foreground text-[11px] font-medium">Social / Web</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded-full bg-amber-500" />
                <span className="text-muted-foreground text-[11px] font-medium">Daily Avg ({avgDailyHours}h)</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyScreenTimeData}
                margin={{ top: 15, right: 20, left: 0, bottom: 0 }}
                onClick={(state: any) => {
                  if (state && state.activePayload && state.activePayload.length > 0) {
                    const payload = state.activePayload[0].payload;
                    if (payload && payload.date) {
                      setSelectedDate(payload.date);
                    }
                  }
                }}
                className="cursor-pointer"
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} vertical={false} />
                <XAxis dataKey="day" stroke={isDark ? "#94a3b8" : "#475569"} fontSize={11} tickLine={false} />
                <YAxis 
                  stroke={isDark ? "#94a3b8" : "#475569"} 
                  fontSize={11} 
                  tickLine={false} 
                  width={36}
                  tickFormatter={(val: number) => `${Math.round(val)}h`}
                  domain={[0, (dataMax: number) => Math.max(6, Math.ceil(Number(dataMax) + 1))]} 
                />
                <Tooltip
                  formatter={(val: any, name: string) => {
                    const labelMap: Record<string, string> = {
                      studyingHours: "Studying (Academic)",
                      playingHours: "Playing (Gaming & Media)",
                      socialHours: "Social / Browsing",
                      totalHours: "Total Active Time"
                    };
                    return [`${val} hrs`, labelMap[name] || name];
                  }}
                  contentStyle={{
                    backgroundColor: isDark ? "#0f172a" : "#ffffff",
                    borderColor: isDark ? "#1e293b" : "#e2e8f0",
                    color: isDark ? "#f8fafc" : "#0f172a",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                  }}
                />
                <ReferenceLine y={avgDailyHours} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `Avg ${avgDailyHours}h`, fill: '#f59e0b', fontSize: 10, position: 'right' }} />
                <Bar dataKey="studyingHours" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="playingHours" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="socialHours" stackId="a" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Row 1: The Screen Time Breakdown Donut & Day vs Late-Night Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Category Donut (Studying, Playing, Normal, Adult) */}
        <Card className="lg:col-span-7 rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Screen Time Purpose Breakdown
                </CardTitle>
                <CardDescription className="text-xs">
                  Classified into Studying, Playing, Normal Socializing, and Adult Content.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {data?.purpose_analysis?.focus_stability_score && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold">
                    Focus Score: {data.purpose_analysis.focus_stability_score}%
                  </Badge>
                )}
                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-xs font-semibold">
                  Most Used: {dominantCategory.name} ({dominantPercentage}%)
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
                {/* Donut Chart */}
                <div className="h-64 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`${formatHoursMins(Number(val))}`, "Duration"]}
                        contentStyle={{
                          backgroundColor: isDark ? "#0f172a" : "#ffffff",
                          borderColor: isDark ? "#1e293b" : "#e2e8f0",
                          color: isDark ? "#f8fafc" : "#0f172a",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-muted-foreground font-medium">Classified</span>
                    <span className="text-xl font-bold">{formatHoursMins(activeTotalMins)}</span>
                  </div>
                </div>

                {/* Category Legend & Details */}
                <div className="space-y-3">
                  {categoryData.map((cat) => {
                    const Icon = cat.icon;
                    const pct = activeTotalMins > 0 ? Math.round((cat.value / activeTotalMins) * 100) : 0;
                    return (
                      <div key={cat.name} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: cat.color }}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs">{cat.name}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-slate-300 dark:border-slate-700">
                                {pct}%
                              </Badge>
                            </div>
                            <span className="text-[11px] text-muted-foreground block">{cat.desc}</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-foreground shrink-0">{formatHoursMins(cat.value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-12 px-4 text-center border border-dashed rounded-xl border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                <Clock className="w-8 h-8 text-muted-foreground/60 mb-2" />
                <h4 className="text-xs font-semibold text-foreground">No Screen Time Classified for {selectedDayLabel}</h4>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
                  {isSelectedToday
                    ? "Active computer time will be classified into Studying, Playing, Normal, and Adult content as you work."
                    : "No screen usage sessions were recorded in the system on this date."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Day vs. Late-Night Circadian Analysis */}
        <Card className="lg:col-span-5 rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Moon className="w-5 h-5 text-amber-500" />
              Day vs. Late Night Divide
            </CardTitle>
            <CardDescription className="text-xs">
              Circadian rhythm & melatonin preservation tracking for {selectedDayLabel}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeOfDayData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                  <XAxis type="number" tickFormatter={(v) => `${Math.round(v / 60)}h`} stroke={isDark ? "#94a3b8" : "#475569"} fontSize={11} />
                  <YAxis type="category" dataKey="name" width={110} stroke={isDark ? "#94a3b8" : "#475569"} fontSize={10} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`${formatHoursMins(Number(val))}`, "Usage"]}
                    contentStyle={{
                      backgroundColor: isDark ? "#0f172a" : "#ffffff",
                      borderColor: isDark ? "#1e293b" : "#e2e8f0",
                      color: isDark ? "#f8fafc" : "#0f172a",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="minutes" radius={[0, 8, 8, 0]}>
                    {timeOfDayData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Circadian Insight Card */}
            <div className={`p-3.5 rounded-xl border text-xs ${activeLateNightMins >= 60 ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"}`}>
              <div className="flex items-center gap-2 font-semibold">
                {activeLateNightMins >= 60 ? <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                {activeLateNightMins >= 60 ? "Nocturnal Screen Delay Detected" : "Optimal Sleep Preservation"}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {activeLateNightMins >= 60
                  ? `Active screen exposure of ${formatHoursMins(activeLateNightMins)} occurred past midnight on this date. Nocturnal blue light delays REM sleep and increases cognitive fatigue.`
                  : "Minimal computer usage past midnight. Your natural sleep-wake cycle and melatonin production were preserved."}
              </p>
              {data?.circadian_sleep_analysis?.sleep_regularity_index && (
                <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground flex items-center gap-1 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Sleep Regularity Index (SRI):
                  </span>
                  <span className="font-bold text-foreground">
                    {data.circadian_sleep_analysis.sleep_regularity_index} / 100
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Top Apps Leaderboard & Online Searches */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Top Apps Leaderboard with Phone-Style Digital Wellbeing (Screen Time, Times Opened, Notifications) */}
        <Card className="lg:col-span-6 rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-card/60 backdrop-blur-sm shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-blue-500" />
                    Application Screen Time & Wellbeing
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Smartphone-style breakdown for {selectedDayLabel} across Screen Time, Times Opened, and Notifications Received.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs self-start sm:self-auto font-medium">
                  {topApps.length} Apps on {selectedDayLabel}
                </Badge>
              </div>

              {/* 3 Phone Screen Time Overview Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3">
                {/* 1. Screen Time */}
                <div
                  onClick={() => setAppMetricMode("time")}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    appMetricMode === "time"
                      ? "bg-blue-500/10 border-blue-500/40 shadow-xs ring-1 ring-blue-500/30"
                      : "bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Screen Time</span>
                    <Clock className={`w-3.5 h-3.5 ${appMetricMode === "time" ? "text-blue-500" : "text-muted-foreground"}`} />
                  </div>
                  <div className="text-lg font-bold text-foreground">{formatHoursMins(totalScreenTimeMins)}</div>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">Daily device time</span>
                </div>

                {/* 2. Times Opened */}
                <div
                  onClick={() => setAppMetricMode("opens")}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    appMetricMode === "opens"
                      ? "bg-purple-500/10 border-purple-500/40 shadow-xs ring-1 ring-purple-500/30"
                      : "bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Times Opened</span>
                    <ArrowUpRight className={`w-3.5 h-3.5 ${appMetricMode === "opens" ? "text-purple-500" : "text-muted-foreground"}`} />
                  </div>
                  <div className="text-lg font-bold text-foreground">{totalTimesOpened} opens</div>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">Phone unlocks / pickups</span>
                </div>

                {/* 3. Notifications */}
                <div
                  onClick={() => setAppMetricMode("notifications")}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    appMetricMode === "notifications"
                      ? "bg-amber-500/10 border-amber-500/40 shadow-xs ring-1 ring-amber-500/30"
                      : "bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Notifications</span>
                    <Bell className={`w-3.5 h-3.5 ${appMetricMode === "notifications" ? "text-amber-500" : "text-muted-foreground"}`} />
                  </div>
                  <div className="text-lg font-bold text-foreground">{totalNotifications} received</div>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">Smartphone alerts</span>
                </div>
              </div>

              {/* Segmented Tab Selector (Phone Settings Style) */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-800/80 gap-1 mt-3">
                <button
                  type="button"
                  onClick={() => setAppMetricMode("time")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                    appMetricMode === "time"
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/60 dark:border-slate-700"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Screen Time</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAppMetricMode("opens")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                    appMetricMode === "opens"
                      ? "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs border border-slate-200/60 dark:border-slate-700"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                  <span>Times Opened</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAppMetricMode("notifications")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                    appMetricMode === "notifications"
                      ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200/60 dark:border-slate-700"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 shrink-0" />
                  <span>Notifications</span>
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                {["ALL", "Studying", "Playing", "Normal"].map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setAppCategoryFilter(category)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                      appCategoryFilter === category
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800/60 text-muted-foreground border-slate-200 dark:border-slate-800 hover:text-foreground"
                    }`}
                  >
                    {category === "ALL" ? "All Apps" : category}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {topApps.length > 0 ? (
                topApps.map((app, idx) => {
                  const maxMinutes = Math.max(...topApps.map(a => a.minutes), 1);
                  const maxOpens = Math.max(...topApps.map(a => a.times_opened || 1), 1);
                  const maxNotifs = Math.max(...topApps.map(a => a.notifications || 0), 1);

                  const barWidth = appMetricMode === "time"
                    ? Math.min(100, Math.round((app.minutes / maxMinutes) * 100))
                    : appMetricMode === "opens"
                    ? Math.min(100, Math.round(((app.times_opened || 1) / maxOpens) * 100))
                    : Math.min(100, Math.round(((app.notifications || 0) / maxNotifs) * 100));

                  return (
                    <div
                      key={`${app.proc}-${idx}`}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 space-y-2 hover:border-blue-500/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-bold text-muted-foreground w-4 text-center shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="w-9 h-9 rounded-xl bg-background border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 shadow-xs">
                            {renderAppIcon(app.icon, app.category)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-xs block text-foreground truncate">{app.name}</span>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>⏱️ {formatHoursMins(app.minutes)}</span>
                              <span>•</span>
                              <span>📱 {app.times_opened || 1} opens</span>
                              <span>•</span>
                              <span>🔔 {app.notifications || 0} alerts</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={`text-[10px] font-medium border px-2 py-0.5 ${getCategoryBadgeClass(app.category)}`}>
                            {app.category}
                          </Badge>
                          {appMetricMode === "time" && (
                            <span className="text-xs font-bold text-foreground min-w-[55px] text-right font-mono">
                              {formatHoursMins(app.minutes)}
                            </span>
                          )}
                          {appMetricMode === "opens" && (
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 min-w-[55px] text-right font-mono">
                              {app.times_opened || 1} opens
                            </span>
                          )}
                          {appMetricMode === "notifications" && (
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 min-w-[55px] text-right font-mono">
                              {app.notifications || 0} alerts
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dynamic Progress Bar */}
                      <div className="w-full bg-slate-200/60 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            appMetricMode === "opens" ? "bg-purple-500" :
                            appMetricMode === "notifications" ? "bg-amber-500" :
                            app.category === "Studying" ? "bg-blue-500" :
                            app.category === "Playing" ? "bg-purple-500" :
                            app.category === "Adult" ? "bg-rose-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 px-4 text-center border border-dashed rounded-xl border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                  <Laptop className="w-8 h-8 text-muted-foreground/60 mb-2" />
                  <h4 className="text-xs font-semibold text-foreground">No Applications Recorded for {selectedDayLabel}</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
                    {appCategoryFilter !== "ALL"
                      ? `No applications detected under the "${appCategoryFilter}" filter on this date.`
                      : isSelectedToday
                      ? "Foreground applications will be automatically detected and ranked as you work on your PC."
                      : "No application telemetry was archived for this date."}
                  </p>
                </div>
              )}
            </CardContent>
          </div>
        </Card>

        {/* Right: What the Student is Searching for Online */}
        <Card className="lg:col-span-6 rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Search className="w-5 h-5 text-indigo-500" />
                  Online Search Topics & Intent
                </CardTitle>
                <CardDescription className="text-xs">
                  Keywords and research topics observed on {selectedDayLabel}.
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Safe Search Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {searchTopics.length > 0 ? (
              searchTopics.map((item, idx) => (
                <div
                  key={`${item.query}-${idx}`}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    item.flagged
                      ? "bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-400"
                      : "bg-slate-50 dark:bg-slate-900/60 border-slate-200/50 dark:border-slate-800/50 hover:border-indigo-500/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      item.flagged ? "bg-red-500/20 text-red-500" : "bg-indigo-500/10 text-indigo-500"
                    }`}>
                      {item.flagged ? <AlertTriangle className="w-4 h-4 animate-pulse" /> : <Search className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <span className="font-medium text-xs text-foreground block truncate">
                        "{item.query}"
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        {item.count} search queries observed on {selectedDayLabel}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2 py-0.5 border shrink-0 ${getCategoryBadgeClass(item.category)}`}
                  >
                    {item.category}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="py-12 px-4 text-center border border-dashed rounded-xl border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground/60 mb-2" />
                <h4 className="text-xs font-semibold text-foreground">No Web Searches Recorded on {selectedDayLabel}</h4>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
                  {isSelectedToday
                    ? "Queries performed in Google, Bing, YouTube, or DuckDuckGo will be logged here with category tags."
                    : "No browser queries were archived for this historical date."}
                </p>
              </div>
            )}

            {/* Privacy & FERPA Disclaimer */}
            <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 text-[11px] text-muted-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-500 shrink-0" />
              <span>
                Zero keystroke logging. Searches are categorized semantically to protect student privacy in compliance with FERPA & HIPAA standards.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Digital Wellbeing: Correlation Insights Engine */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-rose-500" />
              Digital Wellbeing & Habit Correlations ({selectedDayLabel})
            </h3>
            <p className="text-xs text-muted-foreground">
              Clinical insights bridging screen time habits with mood resilience and cognitive stamina.
            </p>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
            Wellbeing AI Active
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Nocturnal Sleep-Wake Correlation */}
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-card/60 backdrop-blur-sm p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">Circadian Rest Impact</span>
              </div>
              <Badge variant="outline" className={activeLateNightMins >= 60 ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px]" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px]"}>
                {activeLateNightMins >= 60 ? "Disruption Risk" : "Healthy Alignment"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {activeLateNightMins >= 60
                ? `${formatHoursMins(activeLateNightMins)} of screen exposure past midnight suppresses natural melatonin secretion, correlating with lower focus scores during morning study sessions.`
                : "Nocturnal computer usage was kept under critical thresholds, protecting restorative REM sleep cycles and next-day attention span."}
            </p>
          </Card>

          {/* Card 2: Deep Work & Break Endurance Ratio */}
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-card/60 backdrop-blur-sm p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">Focus & Fatigue Ratio</span>
              </div>
              <Badge variant="outline" className="bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px]">
                {dominantPercentage}% Academic
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {activeAcademicMins > activeEntertainmentMins
                ? `You dedicated ${formatHoursMins(activeAcademicMins)} to coursework vs ${formatHoursMins(activeEntertainmentMins)} to recreation on ${selectedDayLabel}. Remember to weave in 5-minute cognitive resets between intensive study blocks.`
                : `Entertainment usage (${formatHoursMins(activeEntertainmentMins)}) balanced your study hours (${formatHoursMins(activeAcademicMins)}) on ${selectedDayLabel}, preventing mental saturation.`}
            </p>
          </Card>

          {/* Card 3: Digital Habit Equilibrium Score */}
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-card/60 backdrop-blur-sm p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">Digital Equilibrium</span>
              </div>
              {(() => {
                const lateNightPenalty = Math.min(35, Math.round((activeLateNightMins / 60) * 15));
                const strainPenalty = activeContinuousMins >= 50 ? Math.min(25, Math.round(((activeContinuousMins - 50) / 20) * 10)) : 0;
                const computedScore = activeTotalMins > 0 ? Math.max(30, 100 - lateNightPenalty - strainPenalty) : 100;
                return (
                  <Badge variant="outline" className="bg-teal-500/15 text-teal-600 dark:text-teal-400 text-[10px] font-bold">
                    Score: {computedScore} / 100
                  </Badge>
                );
              })()}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {activeLateNightMins >= 60
                ? "Slight fatigue penalty applied due to late-night screen time. Shifting 45 minutes of evening study to earlier in the day will elevate your equilibrium score."
                : "Excellent digital balance. Healthy daytime study focus combined with proper nocturnal rest preserves high mental clarity and mood equilibrium."}
            </p>
          </Card>
        </div>
      </div>

      {/* 20-20-20 Eye Break Modal */}
      <EyeBreakModal
        isOpen={isEyeBreakOpen}
        onClose={() => setIsEyeBreakOpen(false)}
        onComplete={() => setCustomContinuousMins(0)}
      />
    </motion.div>
  );
};

export default ScreenTimePage;
