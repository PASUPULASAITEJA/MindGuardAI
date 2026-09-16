import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useLatestAssessment 
} from "@/hooks/usePredictions";
import { 
  useCurrentRecommendations 
} from "@/hooks/useRecommendations";
import { 
  useMoodHistory 
} from "@/hooks/useMood";
import { useAuth } from "@/contexts/AuthContext";
import { useScreenTimeTracker } from "@/hooks/useScreenTimeTracker";
import { classifyMentalWellness } from "@/utils/wellness";
import { chatAPI } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

// UI Components
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  CartesianGrid,
  ReferenceLine,
  XAxis, 
  YAxis, 
  Tooltip,
  LabelList
} from "recharts";
import { 
  Smile, 
  Sparkles, 
  BookOpen, 
  MessageSquare, 
  Clock, 
  Moon, 
  Laptop, 
  RefreshCw, 
  ShieldAlert, 
  Activity, 
  ArrowRight, 
  Wind, 
  Calendar, 
  HeartHandshake, 
  HelpCircle,
  Zap,
  CheckCircle2,
  AlertCircle,
  BarChart3
} from "lucide-react";

// Modals
import { ExplainableAIFactors } from "@/components/ExplainableAIFactors";
import { BoxBreathingModal } from "@/components/BoxBreathingModal";
import { ClinicalSurveyModal } from "@/components/ClinicalSurveyModal";
import { CounselorBookingModal } from "@/components/CounselorBookingModal";
import { EmergencySOSModal } from "@/components/EmergencySOSModal";
import { ConsentBanner } from "@/components/ConsentBanner";

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Active Background Screen Time Hook
  useScreenTimeTracker();

  // Modal Visibility States
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isBreathOpen, setIsBreathOpen] = useState(false);
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);
  const [surveyType, setSurveyType] = useState<"phq-9" | "gad-7">("phq-9");
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [screenChartMode, setScreenChartMode] = useState<"total" | "circadian" | "purpose">("total");

  // Queries
  const { data: latestAssessment, isLoading: isAssessmentLoading } = useLatestAssessment();
  const { data: recommendations } = useCurrentRecommendations();
  const { data: moodHistory = [] } = useMoodHistory("7d");

  // Telemetry Behavioral Summary Query
  const { 
    data: behavioralSummary, 
    refetch: refetchBehavioral, 
    isFetching: isRefetchingBehavioral 
  } = useQuery({
    queryKey: ["behavioral-summary"],
    queryFn: () => chatAPI.getBehavioralSummary(),
    staleTime: 5000,
    refetchInterval: 15000,
  });

  // Telemetry computations
  const log = behavioralSummary?.latest_log;
  const isConnected = behavioralSummary?.is_agent_connected;
  const isLive = behavioralSummary?.is_currently_active;

  const totalMins = log?.total_screen_time_minutes || 0;
  const lateNightMins = log?.late_night_usage_minutes || 0;
  const academicMins = log?.academic_usage_minutes || 0;
  const socialMins = log?.social_usage_minutes || 0;
  const entertainmentMins = log?.entertainment_usage_minutes || 0;
  const adultMins = (log as any)?.adult_usage_minutes || 0;

  // Percentage calculations
  const rawCatSum = (academicMins || 0) + (socialMins || 0) + (entertainmentMins || 0) + (adultMins || 0);
  const catBase = Math.max(totalMins, rawCatSum, 1);
  const academicPct = Math.min(100, Math.round(((academicMins || 0) / catBase) * 100));
  const socialPct = Math.min(100 - academicPct, Math.round(((socialMins || 0) / catBase) * 100));
  const entertainmentPct = Math.min(100 - academicPct - socialPct, Math.round(((entertainmentMins || 0) / catBase) * 100));
  const adultPct = Math.min(100 - academicPct - socialPct - entertainmentPct, Math.round(((adultMins || 0) / catBase) * 100));
  const otherPct = Math.max(0, 100 - academicPct - socialPct - entertainmentPct - adultPct);

  // 7-Day Rolling Screen Time Telemetry Data for System Graph
  const weeklyLogs = (behavioralSummary?.weekly_history || []) as Array<{
    date: string;
    total_screen_time_minutes: number;
    academic_usage_minutes?: number;
    social_usage_minutes?: number;
    entertainment_usage_minutes?: number;
    adult_usage_minutes?: number;
    late_night_usage_minutes?: number;
    risk_level?: string;
  }>;

  const yesterdayStr = (() => {
    const yd = new Date();
    yd.setDate(yd.getDate() - 1);
    const yYear = yd.getFullYear();
    const yMonth = String(yd.getMonth() + 1).padStart(2, "0");
    const yDay = String(yd.getDate()).padStart(2, "0");
    return `${yYear}-${yMonth}-${yDay}`;
  })();
  const yesterdayLog = weeklyLogs.find((w) => w.date === yesterdayStr);

  const screenChartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const isToday = i === 6;
    const dayLabel = isToday
      ? `Today (${dayNames[d.getDay()]})`
      : `${dayNames[d.getDay()]} (${d.getMonth() + 1}/${d.getDate()})`;

    const matched = weeklyLogs.find((w) => w.date === dateStr);

    let totalM = 0;
    let acadM = 0;
    let socM = 0;
    let entM = 0;
    let adultM = 0;
    let lateM = 0;
    let risk = "LOW";
    let hasData = false;

    if (isToday) {
      hasData = totalMins > 0 || (matched?.total_screen_time_minutes || 0) > 0;
      totalM = Math.max(totalMins, matched?.total_screen_time_minutes || 0);
      acadM = Math.max(academicMins, matched?.academic_usage_minutes || 0);
      socM = Math.max(socialMins, matched?.social_usage_minutes || 0);
      entM = Math.max(entertainmentMins, matched?.entertainment_usage_minutes || 0);
      adultM = Math.max(adultMins, matched?.adult_usage_minutes || 0);
      lateM = Math.max(lateNightMins, matched?.late_night_usage_minutes || 0);
      risk = matched?.risk_level || "LOW";
    } else if (matched) {
      hasData = true;
      totalM = matched.total_screen_time_minutes || 0;
      acadM = matched.academic_usage_minutes || 0;
      socM = matched.social_usage_minutes || 0;
      entM = matched.entertainment_usage_minutes || 0;
      adultM = matched.adult_usage_minutes || 0;
      lateM = matched.late_night_usage_minutes || 0;
      risk = matched.risk_level || "LOW";
    }

    const dayCatSum = acadM + socM + entM + adultM;
    if (dayCatSum > totalM && totalM > 0) {
      const ratio = totalM / dayCatSum;
      acadM = Math.round(acadM * ratio);
      socM = Math.round(socM * ratio);
      entM = Math.round(entM * ratio);
      adultM = Math.round(adultM * ratio);
    }

    const daytimeMins = Math.max(0, totalM - lateM);
    const otherMins = Math.max(0, totalM - acadM - socM - entM - adultM);

    return {
      date: dateStr,
      dayLabel,
      isToday,
      hasData,
      totalHours: +(totalM / 60).toFixed(1),
      daytimeHours: +(daytimeMins / 60).toFixed(1),
      lateNightHours: +(lateM / 60).toFixed(1),
      academicHours: +(acadM / 60).toFixed(1),
      socialHours: +(socM / 60).toFixed(1),
      entertainmentHours: +(entM / 60).toFixed(1),
      otherHours: +(otherMins / 60).toFixed(1),
      totalMins: totalM,
      daytimeMins,
      academicMins: acadM,
      socialMins: socM,
      entertainmentMins: entM,
      adultMins,
      lateNightMins: lateM,
      riskLevel: risk,
    };
  });

  const recordedDays = screenChartData.filter((c) => c.hasData && c.totalMins > 0);
  const avgDailyHours =
    recordedDays.length > 0
      ? (
          recordedDays.reduce((acc, c) => acc + c.totalHours, 0) /
          recordedDays.length
        ).toFixed(1)
      : "0.0";

  // Mental wellness score & classification
  const rawScore = latestAssessment?.mental_wellness_score;
  const hasAssessment = typeof rawScore === "number" && !isNaN(rawScore);
  const wellnessScore = hasAssessment ? rawScore : null;
  const wellnessClass = wellnessScore !== null ? classifyMentalWellness(wellnessScore) : null;

  // Sparkline data for 7-day mood trend from real user check-ins
  const chartData = moodHistory.slice(-7).map((item) => ({
    name: new Date(item.logged_at).toLocaleDateString("en-US", { weekday: "short" }),
    score: (item.self_reported_score || 0) * 10,
    date: item.logged_at
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* 1. Welcome & Status Banner */}
      <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground" />
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {isConnected && isLive ? "Telemetry Active (Auto-Syncing)" : "Active Student Hub"}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            Welcome back, {user?.full_name?.split(" ")[0] || "Student"} 👋
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Here is your daily wellness pulse, study balance, and personalized self-care tools.
          </p>
        </div>

        {/* Quick Action Gateways */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => navigate("/student/check-in")}
            className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1.5 shadow-md shadow-primary/20 h-10 px-4 active:scale-95 transition-transform"
          >
            <Smile className="h-4 w-4" />
            <span>Daily Check-In</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/student/chat")}
            className="rounded-xl border-border/80 hover:bg-secondary text-xs font-bold gap-1.5 h-10 px-4"
          >
            <MessageSquare className="h-4 w-4 text-primary" />
            <span>AI Companion</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsSOSOpen(true)}
            className="rounded-xl border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold gap-1.5 h-10 px-3.5"
            title="Immediate 24/7 Crisis Support"
          >
            <ShieldAlert className="h-4 w-4 text-rose-500 animate-pulse" />
            <span>24/7 SOS</span>
          </Button>
        </div>
      </div>

      {/* Consent-First Enforcement Banner */}
      <ConsentBanner />

      {/* 2. Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Mental Wellness Score */}
        <Card className="shadow-xs border-border/80 flex flex-col justify-between p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Wellness Index
            </span>
            <button
              onClick={() => setIsExplainOpen(true)}
              className="text-muted-foreground hover:text-foreground"
              title="How this score is calculated"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            {wellnessScore !== null ? (
              <>
                <span className="text-3xl font-black text-foreground">
                  {wellnessScore.toFixed(0)}
                  <span className="text-sm font-normal text-muted-foreground">/100</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  wellnessScore >= 65 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" :
                  wellnessScore >= 40 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" :
                  "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                }`}>
                  {wellnessScore >= 65 ? "Stable & Balanced" : wellnessScore >= 40 ? "Needs Rest" : "High Strain"}
                </span>
              </>
            ) : (
              <>
                <span className="text-3xl font-black text-muted-foreground">--</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  Pending Check-In
                </span>
              </>
            )}
          </div>

          <div className="text-[11px] text-muted-foreground leading-tight">
            {wellnessScore !== null
              ? (wellnessScore >= 65
                  ? "Your recent check-ins reflect steady focus and positive emotional balance."
                  : "Mild fatigue noted. Remember to pace your coursework and take mindful breaks.")
              : "Complete your first check-in or clinical survey to compute your wellness index."}
          </div>
        </Card>

        {/* Metric 2: Active Screen Time */}
        <Card className="shadow-xs border-border/80 flex flex-col justify-between p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Active Screen Time
            </span>
            <Clock className="h-4 w-4 text-indigo-500" />
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">
              {Math.floor(totalMins / 60)}h {totalMins % 60}m
            </span>
            <span className="text-xs text-muted-foreground">
              today
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              <span>{academicPct}% study focus</span>
            </span>
            {yesterdayLog && (
              <span className="text-muted-foreground font-medium text-[10px]">
                Yesterday: {Math.floor(yesterdayLog.total_screen_time_minutes / 60)}h {yesterdayLog.total_screen_time_minutes % 60}m
              </span>
            )}
          </div>
        </Card>

        {/* Metric 3: Late-Night Screen Usage */}
        <Card className="shadow-xs border-border/80 flex flex-col justify-between p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Late-Night Screen (12 AM - 4 AM)
            </span>
            <Moon className="h-4 w-4 text-violet-500" />
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${lateNightMins > 60 ? "text-rose-500" : "text-foreground"}`}>
              {lateNightMins > 60 ? `${Math.floor(lateNightMins / 60)}h ${lateNightMins % 60}m` : `${lateNightMins}m`}
            </span>
            <span className="text-xs text-muted-foreground">12:00 AM – 4:00 AM</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
            <span className={`h-1.5 w-1.5 rounded-full ${lateNightMins === 0 ? "bg-emerald-500" : lateNightMins > 60 ? "bg-rose-500" : "bg-amber-500"}`} />
            <span className={lateNightMins === 0 ? "text-emerald-600 dark:text-emerald-400" : lateNightMins > 60 ? "text-rose-500" : "text-amber-500"}>
              {lateNightMins === 0 ? "Optimal Sleep Rhythm" : lateNightMins > 60 ? "Circadian Strain" : "Mild Late Use"}
            </span>
          </div>
        </Card>

        {/* Metric 4: Circadian Rhythm Score */}
        <Card className="shadow-xs border-border/80 flex flex-col justify-between p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Sleep Regularity
            </span>
            <Zap className="h-4 w-4 text-amber-500" />
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">
              {lateNightMins === 0 ? 100 : Math.max(20, Math.round(100 - (lateNightMins / 2.5)))}
              <span className="text-sm font-normal text-muted-foreground">/100</span>
            </span>
            <span className="text-xs text-muted-foreground">Circadian Score</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
            <span className={`h-1.5 w-1.5 rounded-full ${lateNightMins === 0 ? "bg-emerald-500" : lateNightMins > 60 ? "bg-rose-500" : "bg-amber-500"}`} />
            <span className={lateNightMins === 0 ? "text-emerald-600 dark:text-emerald-400" : lateNightMins > 60 ? "text-rose-500" : "text-amber-500"}>
              {lateNightMins === 0 ? "Optimal Regularity" : lateNightMins > 60 ? "Circadian Strain" : "Mild Late Activity"}
            </span>
          </div>
        </Card>
      </div>

      {/* 3. Daily Screen Habits & Study Balance Card (with 7-Day Screen Time Graph) */}
      <Card className="border-border/80 shadow-xs overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
              <Laptop className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>Daily Screen Habits & 7-Day Graph</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isConnected && isLive ? "Live Telemetry" : "Agent Active"}
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Continuous non-invasive PC telemetry: how much time you spend on your computer each day
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* View Mode Toggle */}
            <div className="flex bg-muted/50 p-0.5 rounded-lg border border-border/60 text-[10px]">
              <button
                type="button"
                onClick={() => setScreenChartMode("total")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  screenChartMode === "total"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                📊 Daily Total
              </button>
              <button
                type="button"
                onClick={() => setScreenChartMode("circadian")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  screenChartMode === "circadian"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🌙 Day vs Night
              </button>
              <button
                type="button"
                onClick={() => setScreenChartMode("purpose")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  screenChartMode === "purpose"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                📚 Study vs Leisure
              </button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchBehavioral()}
              disabled={isRefetchingBehavioral}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefetchingBehavioral ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-1">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Today's Active Screen</span>
              <span className="text-lg font-black text-foreground">
                {Math.floor(totalMins / 60)}h {totalMins % 60}m
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {yesterdayLog ? `Yesterday: ${Math.floor(yesterdayLog.total_screen_time_minutes / 60)}h ${yesterdayLog.total_screen_time_minutes % 60}m` : (totalMins >= 360 ? "⚠️ High Screen Strain" : "Normal Usage")}
              </span>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Academic & Coding</span>
              <span className="text-lg font-black text-indigo-500">
                {academicPct}%
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {Math.floor(academicMins / 60)}h {academicMins % 60}m coursework
              </span>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Late-Night (12AM-5AM)</span>
              <span className={`text-lg font-black ${lateNightMins > 60 ? "text-rose-500" : "text-foreground"}`}>
                {lateNightMins}m
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {lateNightMins === 0 ? "Zero late-night fatigue" : lateNightMins > 60 ? "Circadian strain" : "Mild late activity"}
              </span>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">7-Day Daily Avg</span>
              <span className="text-lg font-black text-foreground">
                {avgDailyHours} <span className="text-xs font-normal text-muted-foreground">hrs/day</span>
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                Guideline: ≤ 6.0 hrs
              </span>
            </div>
          </div>

          {/* Today's Distribution Stacked Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Today's Screen Time Distribution</span>
              <span>{Math.floor(totalMins / 60)}h {totalMins % 60}m total</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
              {academicPct > 0 && (
                <div 
                  className="bg-indigo-500 h-full transition-all duration-500" 
                  style={{ width: `${academicPct}%` }} 
                  title={`Academic/Coding: ${academicPct}%`} 
                />
              )}
              {entertainmentPct > 0 && (
                <div 
                  className="bg-purple-500 h-full transition-all duration-500" 
                  style={{ width: `${entertainmentPct}%` }} 
                  title={`Entertainment: ${entertainmentPct}%`} 
                />
              )}
              {socialPct > 0 && (
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${socialPct}%` }} 
                  title={`Social: ${socialPct}%`} 
                />
              )}
              {otherPct > 0 && totalMins > 0 && (
                <div 
                  className="bg-slate-400 dark:bg-slate-600 h-full transition-all duration-500" 
                  style={{ width: `${otherPct}%` }} 
                  title={`General / System: ${otherPct}%`} 
                />
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground gap-2 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                <span className="font-medium text-foreground">Academic & Coding ({academicPct}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                <span>Entertainment ({entertainmentPct}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Social ({socialPct}%)</span>
              </div>
              {otherPct > 0 && totalMins > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-600" />
                  <span>General ({otherPct}%)</span>
                </div>
              )}
            </div>
          </div>

          {/* 7-Day Screen Time Bar Chart */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-bold text-foreground">
                  7-Day Screen Time Usage Graph (Daily Total & Breakdown)
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                {screenChartMode === "total" ? "Daily Total Active Hours" : screenChartMode === "circadian" ? "Daytime vs Late-Night" : "Coursework vs Leisure"}
              </span>
            </div>

            <div className="h-[260px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={screenChartData} margin={{ top: 20, right: 15, left: -15, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis 
                    dataKey="dayLabel" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }} 
                    unit="h" 
                    domain={[0, "auto"]} 
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        if (!d.hasData || d.totalMins === 0) {
                          return (
                            <div className="rounded-xl border border-border/80 bg-popover/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1 min-w-[190px]">
                              <div className="flex items-center justify-between border-b border-border/50 pb-1 font-bold text-foreground">
                                <span>{d.dayLabel}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                                  0 hrs
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground pt-1 italic">
                                No PC activity detected on this day.
                              </p>
                            </div>
                          );
                        }
                        return (
                          <div className="rounded-xl border border-border/80 bg-popover/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1.5 min-w-[210px]">
                            <div className="flex items-center justify-between border-b border-border/50 pb-1 font-bold text-foreground">
                              <span>{d.dayLabel}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${
                                d.totalHours >= 6.0 ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
                              }`}>
                                {d.totalHours} hrs total
                              </span>
                            </div>
                            <div className="space-y-1 text-[11px]">
                              <div className="flex justify-between items-center text-foreground">
                                <span>☀️ Daytime (5AM-12AM):</span>
                                <span className="font-semibold">{Math.floor(d.daytimeMins / 60)}h {d.daytimeMins % 60}m</span>
                              </div>
                              <div className={`flex justify-between items-center ${d.lateNightMins > 0 ? "text-rose-400 font-bold" : "text-emerald-400"}`}>
                                <span>🌙 Late-Night (12AM-5AM):</span>
                                <span className="font-semibold">
                                  {d.lateNightMins > 0 ? `${d.lateNightMins}m (Late fatigue)` : "0m (Optimal)"}
                                </span>
                              </div>
                              <div className="pt-1 border-t border-border/30 space-y-0.5 text-muted-foreground">
                                <div className="flex justify-between text-indigo-400">
                                  <span>📚 Academic / Coding:</span>
                                  <span>{Math.floor(d.academicMins / 60)}h {d.academicMins % 60}m</span>
                                </div>
                                <div className="flex justify-between text-purple-400">
                                  <span>🎮 Entertainment:</span>
                                  <span>{Math.floor(d.entertainmentMins / 60)}h {d.entertainmentMins % 60}m</span>
                                </div>
                                <div className="flex justify-between text-emerald-400">
                                  <span>💬 Social & Chat:</span>
                                  <span>{Math.floor(d.socialMins / 60)}h {d.socialMins % 60}m</span>
                                </div>
                              </div>
                            </div>
                            <div className="pt-1 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>Risk Status:</span>
                              <span className={`font-bold ${d.riskLevel === "HIGH" || d.totalHours >= 8.0 ? "text-rose-400" : d.totalHours >= 6.0 ? "text-amber-400" : "text-emerald-400"}`}>
                                {d.riskLevel || "LOW"}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine 
                    y={6.0} 
                    stroke="#10b981" 
                    strokeDasharray="4 4" 
                    label={{ value: "Healthy Guideline (6h)", fill: "#10b981", fontSize: 10, position: "top" }} 
                  />
                  {screenChartMode === "total" ? (
                    <Bar dataKey="totalHours" name="Total Daily Screen Time" fill="#6366f1" radius={[6, 6, 0, 0]}>
                      <LabelList dataKey="totalHours" position="top" fill="currentColor" className="text-foreground" fontSize={11} fontWeight={700} formatter={(val: any) => val > 0 ? `${val}h` : ""} />
                    </Bar>
                  ) : screenChartMode === "circadian" ? (
                    <>
                      <Bar dataKey="daytimeHours" name="Daytime Screen Time" stackId="screen" fill="#6366f1" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="lateNightHours" name="Late-Night (12AM-5AM)" stackId="screen" fill="#f43f5e" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="totalHours" position="top" fill="currentColor" className="text-foreground" fontSize={11} fontWeight={700} formatter={(val: any) => val > 0 ? `${val}h` : ""} />
                      </Bar>
                    </>
                  ) : (
                    <>
                      <Bar dataKey="academicHours" name="Academic & Coding" stackId="screen" fill="#6366f1" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="socialHours" name="Social & Chat" stackId="screen" fill="#10b981" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="entertainmentHours" name="Entertainment & Media" stackId="screen" fill="#a855f7" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="otherHours" name="General / Other" stackId="screen" fill="#64748b" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="totalHours" position="top" fill="currentColor" className="text-foreground" fontSize={11} fontWeight={700} formatter={(val: any) => val > 0 ? `${val}h` : ""} />
                      </Bar>
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend & Status Footer */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40 gap-2">
              <div className="flex flex-wrap items-center gap-3">
                {screenChartMode === "total" ? (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
                      Active Daily Screen Time (Hours)
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span className="h-0.5 w-3 border-t-2 border-dashed border-emerald-500" />
                      Healthy Guideline (≤ 6.0h)
                    </span>
                  </>
                ) : screenChartMode === "circadian" ? (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
                      Daytime Screen (4 AM – 12 AM)
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-rose-500">
                      <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
                      Late-Night Screen (12 AM – 4 AM)
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
                      Academic / Coding
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                      Social
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-purple-500" />
                      Entertainment
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-slate-500" />
                      General
                    </span>
                  </>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live Logged: {recordedDays.length} of 7 days recorded
              </span>
            </div>

            {/* 7-Day Daily Breakdown Cards Grid */}
            <div className="pt-3 border-t border-border/40">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-bold text-foreground">
                  Daily Screen Time Breakdown (Past 7 Days)
                </span>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  System telemetry from physical boot & active window tracking
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {screenChartData.map((d, idx) => (
                  <div 
                    key={idx}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                      d.isToday 
                        ? "bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/30" 
                        : "bg-card/60 border-border/60 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold ${d.isToday ? "text-indigo-500 dark:text-indigo-400" : "text-muted-foreground"}`}>
                        {d.isToday ? "Today" : d.dayLabel.split(" ")[0]}
                      </span>
                      {d.isToday ? (
                        <span className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] font-extrabold text-emerald-500">LIVE</span>
                        </span>
                      ) : (
                        <span className="text-[9px] text-muted-foreground font-medium">
                          {d.date.split("-").slice(1).join("/")}
                        </span>
                      )}
                    </div>
                    <div className="my-2">
                      <div className="text-base sm:text-lg font-black text-foreground tracking-tight">
                        {d.totalMins > 0 ? `${Math.floor(d.totalMins / 60)}h ${d.totalMins % 60}m` : "0h 0m"}
                      </div>
                      <div className={`text-[10px] font-semibold ${
                        d.totalHours >= 8.0 ? "text-rose-500" : d.totalHours >= 6.0 ? "text-amber-500" : "text-emerald-500"
                      }`}>
                        {d.totalHours} hrs {d.totalHours >= 6.0 ? "• High" : "• Healthy"}
                      </div>
                    </div>
                    <div className="space-y-1 text-[10px] pt-1.5 border-t border-border/30">
                      <div className="flex items-center justify-between text-indigo-500 font-medium">
                        <span>📚 Study:</span>
                        <span>{Math.floor(d.academicMins / 60)}h {d.academicMins % 60}m</span>
                      </div>
                      <div className="flex items-center justify-between text-purple-500 dark:text-purple-400 font-medium">
                        <span>🎮 Leisure:</span>
                        <span>{Math.floor(((d.socialMins || 0) + (d.entertainmentMins || 0)) / 60)}h {((d.socialMins || 0) + (d.entertainmentMins || 0)) % 60}m</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={d.lateNightMins > 0 ? "text-rose-500 font-bold" : "text-muted-foreground"}>🌙 Late (12–4 AM):</span>
                        <span className={d.lateNightMins > 0 ? "text-rose-500 font-bold" : "text-muted-foreground"}>
                          {d.lateNightMins > 0 ? `${Math.floor(d.lateNightMins / 60)}h ${d.lateNightMins % 60}m` : "0m"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Actionable Next Steps & Personalized Interventions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recommendation 1: Box Breathing */}
        <Card className="border-border/80 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all">
          <div className="space-y-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Wind className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">2-Min Box Breathing</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Steady your autonomic nervous system and lower cortisol using the clinically proven 4-4-4-4 cadence.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsBreathOpen(true)}
            className="w-full rounded-xl text-xs font-bold gap-1.5"
          >
            <span>Start Breathing</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Card>

        {/* Recommendation 2: Clinical Screening */}
        <Card className="border-border/80 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all">
          <div className="space-y-2">
            <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Clinical Survey (PHQ-9 / GAD-7)</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Standardized mental health check questionnaires to monitor mood changes and stress factors.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsSurveyOpen(true)}
            className="w-full rounded-xl text-xs font-bold gap-1.5"
          >
            <span>Take Survey</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Card>

        {/* Recommendation 3: Counselor Consultation */}
        <Card className="border-border/80 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all">
          <div className="space-y-2">
            <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Talk to Campus Counselor</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Schedule a confidential 1-on-1 consultation (Virtual or in-person at campus clinic).
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsBookingOpen(true)}
            className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold gap-1.5"
          >
            <span>Book 1-on-1 Session</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Card>
      </div>

      {/* 5. Recent Mood Trajectory Chart & Longitudinal History */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              7-Day Mood & Wellness Trajectory
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Longitudinal tracking of your emotional wellness and check-in scores
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/student/history")}
            className="text-xs text-primary font-bold hover:underline gap-1"
          >
            <span>View Full History</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>

        <CardContent className="pt-2">
          {chartData.length > 0 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wellnessGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: "12px", 
                      fontSize: "12px", 
                      backgroundColor: "hsl(var(--card))", 
                      borderColor: "hsl(var(--border))" 
                    }} 
                    formatter={(value: any) => [`${value}/100`, "Wellness Index"]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#wellnessGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 w-full rounded-2xl border border-dashed border-border/80 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-muted/10">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Smile className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">No Check-Ins Logged Yet</h4>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Complete your first 1-minute daily check-in to start graphing your emotional wellness trajectory.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => navigate("/student/check-in")}
                className="rounded-xl text-xs font-bold gap-1.5 h-8 px-4"
              >
                <Smile className="h-3.5 w-3.5" />
                <span>Log Daily Check-In</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. Modals */}
      <EmergencySOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
      <BoxBreathingModal isOpen={isBreathOpen} onClose={() => setIsBreathOpen(false)} />
      <ClinicalSurveyModal isOpen={isSurveyOpen} surveyType={surveyType} onClose={() => setIsSurveyOpen(false)} />
      <CounselorBookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />

      {/* Explainable AI Factors Modal */}
      {isExplainOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border shadow-2xl p-6 space-y-4">
            <ExplainableAIFactors
              studentId={user?.id}
              wellnessScore={wellnessScore ?? 0}
              riskLevel={latestAssessment?.risk_level || "LOW"}
              lateNightMins={lateNightMins}
              totalScreenMins={totalMins}
              sentimentScore={latestAssessment?.sentiment_score}
              hasAssessment={hasAssessment}
            />
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsExplainOpen(false)}
                className="rounded-xl text-xs"
              >
                Close Explanation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
