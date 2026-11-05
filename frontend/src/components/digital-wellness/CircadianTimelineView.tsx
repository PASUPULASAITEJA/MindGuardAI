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

export const CircadianTimelineView: React.FC = () => {
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
    const interval = setInterval(fetchSummary, 15000);
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

  // 2. Category Chart Data
  const categoryData = [
    { name: "Studying", value: activeAcademicMins, color: "#3b82f6", icon: BookOpen, desc: "Academic, Coding & Coursework" },
    { name: "Playing", value: activeEntertainmentMins, color: "#8b5cf6", icon: Gamepad2, desc: "Gaming, Media & Streaming" },
    { name: "Normal", value: activeSocialMins, color: "#10b981", icon: MessageSquare, desc: "Social, Messaging & Browsing" },
    { name: "Adult", value: activeAdultMins, color: "#f43f5e", icon: ShieldAlert, desc: "Restricted / Sensitive Content" },
  ].filter(c => c.value > 0);

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

  return (
    <div className="space-y-6">
      {/* 4 Stat Metric Cards */}
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
                  {dominantCategory.name} &bull; {dominantPercentage}% Dominance
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

      {/* 7-Day Daily Screen Time Chart */}
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
            {/* Day Selector Pill Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevDay}
                disabled={currentDayIndex <= 0}
                className="h-8 w-8 p-0 rounded-xl"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold">
                {selectedDayLabel}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextDay}
                disabled={currentDayIndex >= dailyScreenTimeData.length - 1}
                className="h-8 w-8 p-0 rounded-xl"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              {!isSelectedToday && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetToToday}
                  className="h-8 text-xs text-blue-500"
                >
                  Today
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyScreenTimeData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="h" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border/80 shadow-lg p-3 rounded-xl text-xs space-y-1">
                          <p className="font-semibold">{p.day} ({p.date})</p>
                          <p className="text-blue-500">Studying: {p.studyingHours}h</p>
                          <p className="text-purple-500">Playing: {p.playingHours}h</p>
                          <p className="text-emerald-500">Social: {p.socialHours}h</p>
                          <p className="text-foreground font-bold pt-1 border-t border-border/40">
                            Total: {p.totalHours}h
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="studyingHours" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} name="Studying" />
                <Bar dataKey="playingHours" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} name="Playing" />
                <Bar dataKey="socialHours" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} name="Social" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Circadian Rest & Mental Equilibrium Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">Circadian Rest Impact</span>
            </div>
            <Badge variant="outline" className={activeLateNightMins >= 60 ? "bg-amber-500/15 text-amber-600 text-[10px]" : "bg-emerald-500/15 text-emerald-600 text-[10px]"}>
              {activeLateNightMins >= 60 ? "Disruption Risk" : "Healthy Alignment"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {activeLateNightMins >= 60
              ? `${formatHoursMins(activeLateNightMins)} of screen exposure past midnight suppresses natural melatonin secretion, correlating with lower focus scores during morning study sessions.`
              : "Nocturnal computer usage was kept under critical thresholds, protecting restorative REM sleep cycles and next-day attention span."}
          </p>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">Focus & Fatigue Ratio</span>
            </div>
            <Badge variant="outline" className="bg-blue-500/15 text-blue-600 text-[10px]">
              {dominantPercentage}% Academic
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {activeAcademicMins > activeEntertainmentMins
              ? `You dedicated ${formatHoursMins(activeAcademicMins)} to coursework vs ${formatHoursMins(activeEntertainmentMins)} to recreation on ${selectedDayLabel}.`
              : `Entertainment usage (${formatHoursMins(activeEntertainmentMins)}) balanced your study hours (${formatHoursMins(activeAcademicMins)}) on ${selectedDayLabel}.`}
          </p>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm p-4 space-y-2.5">
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
              ? "Slight fatigue penalty applied due to late-night screen time. Shifting 45 minutes of evening study earlier will elevate your equilibrium score."
              : "Excellent digital balance. Healthy daytime study focus combined with nocturnal rest preserves high mental clarity."}
          </p>
        </Card>
      </div>

      {/* 20-20-20 Eye Break Modal */}
      <EyeBreakModal
        isOpen={isEyeBreakOpen}
        onClose={() => setIsEyeBreakOpen(false)}
        onComplete={() => setCustomContinuousMins(0)}
      />
    </div>
  );
};

export default CircadianTimelineView;

