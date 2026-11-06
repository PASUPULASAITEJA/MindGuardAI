import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useLatestAssessment, useWellnessTrends } from "@/hooks/usePredictions";
import { useCurrentRecommendations } from "@/hooks/useRecommendations";
import { useMoodHistory } from "@/hooks/useMood";
import { useAuth } from "@/contexts/AuthContext";
import { useScreenTimeTracker } from "@/hooks/useScreenTimeTracker";
import { classifyMentalWellness } from "@/utils/wellness";
import { cn } from "@/utils/cn";
import { chatAPI, consentRecordsAPI } from "@/services/api";

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { DotGridBackground } from "@/components/ui/DotGridBackground";
import { ShinyText } from "@/components/ui/ShinyText";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { GSAPTilt } from "@/components/ui/gsap-tilt";
import { GSAPMagnetic } from "@/components/ui/gsap-magnetic";
import { GSAPStagger } from "@/components/ui/gsap-stagger";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Sparkles,
  MessageSquare,
  Clock,
  RefreshCw,
  Activity,
  Wind,
  Calendar,
  CheckCircle2,
  Flame,
  ShieldAlert,
  MoonStar,
  ChevronRight,
  Smile,
  Meh,
  Frown,
  Monitor,
  Gamepad2,
  BookOpen,
  TrendingUp,
} from "lucide-react";

// Modals
import { ShapExplanationCard } from "@/components/ShapExplanationCard";
import { ExplainableAIFactors } from "@/components/ExplainableAIFactors";
import { BoxBreathingModal } from "@/components/BoxBreathingModal";
import { ClinicalSurveyModal } from "@/components/ClinicalSurveyModal";
import { CounselorBookingModal } from "@/components/CounselorBookingModal";
import { EmergencySOSModal } from "@/components/EmergencySOSModal";
import { OnboardingConsentModal } from "@/components/OnboardingConsentModal";
import { MoodMicroCheckin } from "@/components/MoodMicroCheckin";

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useScreenTimeTracker();

  // Modals
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isBreathOpen, setIsBreathOpen] = useState(false);
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);
  const [surveyType, setSurveyType] = useState<"phq-9" | "gad-7">("phq-9");
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [isOnboardingConsentOpen, setIsOnboardingConsentOpen] = useState(false);

  // Timeframe
  const [selectedTimeframe, setSelectedTimeframe] = useState<"7d" | "30d" | "90d">("30d");

  // Onboarding Consent Check
  useEffect(() => {
    if (user?.role === "STUDENT") {
      consentRecordsAPI
        .getConsents()
        .then((res) => {
          if (!res.onboarding_completed) {
            setIsOnboardingConsentOpen(true);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // Data Queries
  const { data: latestAssessment, isLoading: isLoadingAssessment } = useLatestAssessment();
  const { data: recommendations = [], isLoading: isLoadingRecs } = useCurrentRecommendations();
  const { data: moodHistory = [], isLoading: isLoadingMood } = useMoodHistory("30d");
  const { data: trendData, isLoading: isLoadingTrends } = useWellnessTrends(selectedTimeframe);

  const {
    data: behavioralSummary,
    refetch: refetchBehavioral,
    isFetching: isRefetchingBehavioral,
  } = useQuery({
    queryKey: ["behavioral-summary"],
    queryFn: () => chatAPI.getBehavioralSummary(),
    staleTime: 5000,
    refetchInterval: 15000,
  });

  const log = behavioralSummary?.latest_log;
  const isConnected = Boolean(behavioralSummary?.is_agent_connected);
  const isLive = Boolean(behavioralSummary?.is_currently_active);

  const totalMins = log?.total_screen_time_minutes || 0;
  const lateNightMins = log?.late_night_usage_minutes || 0;
  const academicMins = log?.academic_usage_minutes || 0;

  // Wellness score computation (authentic; null if unassessed)
  const hasAssessment = Boolean(
    (latestAssessment as any)?.mental_wellness_score !== undefined ||
    (latestAssessment as any)?.wellness_score !== undefined ||
    (trendData?.summary?.average_wellness_score && trendData.summary.average_wellness_score > 0)
  );
  const rawScore = hasAssessment
    ? ((latestAssessment as any)?.mental_wellness_score ??
       (latestAssessment as any)?.wellness_score ??
       trendData?.summary?.average_wellness_score ?? 0)
    : null;
  const wellnessScore = rawScore !== null ? Math.min(100, Math.max(0, Math.round(rawScore))) : null;
  const wellnessClass = wellnessScore !== null ? classifyMentalWellness(wellnessScore) : null;

  // Risk Level computation
  const normalizedRisk: "LOW" | "MODERATE" | "HIGH" =
    lateNightMins >= 120 || (latestAssessment?.risk_level as string) === "CRITICAL"
      ? "HIGH"
      : (latestAssessment?.risk_level as string) === "MEDIUM"
      ? "MODERATE"
      : "LOW";

  // Score color: ≥65 text-emerald-500, 35-64 text-amber-500, <35 text-rose-500
  const scoreColorClass =
    wellnessScore === null
      ? "text-muted-foreground"
      : wellnessScore >= 65
      ? "text-emerald-500"
      : wellnessScore >= 35
      ? "text-amber-500"
      : "text-rose-500";

  // Streak days calculation (strictly authentic, zero if no mood history)
  const streakDays = moodHistory.length > 0 ? Math.min(moodHistory.length, 14) : 0;

  // Last check-in time
  const lastCheckinTime = moodHistory[0]?.logged_at
    ? new Date(moodHistory[0].logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "No check-ins yet";

  // Chart data (strictly authentic, zero synthetic unshifts)
  const chartData =
    trendData?.points && trendData.points.length > 0
      ? trendData.points.map((p) => ({
          name: new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          score: p.wellness_score,
        }))
      : moodHistory.map((m) => ({
          name: new Date(m.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          score: (m.self_reported_score || 0) * 10,
        })).filter(item => item.score > 0);

  // 7-day sleep data from authentic history (empty array if no telemetry recorded yet)
  const sleepChartData: { day: string; hours: number }[] = (behavioralSummary?.weekly_history || [])
    .slice(-7)
    .map((item: any) => {
      const d = new Date(item.date);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const activeHrs = (item.total_screen_time_minutes || 0) / 60;
      const restHrs = Math.max(0, Math.min(12, Math.round((24 - activeHrs) * 10) / 10));
      return { day: dayName, hours: restHrs };
    });
  const avgSleepHours = sleepChartData.length > 0
    ? (sleepChartData.reduce((acc, c) => acc + c.hours, 0) / sleepChartData.length).toFixed(1)
    : null;

  const studentFirstName = user?.full_name ? user.full_name.split(" ")[0] : "Student";

  return (
    <div className="relative w-full space-y-6 pb-12 font-sans text-foreground">
      <DotGridBackground />

      {/* 1. WELCOME HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Wellness Space</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Welcome back, <ShinyText text={studentFirstName} className="inline-block" /> 👋
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Here is your daily mental health overview and circadian recovery status.
          </p>
        </div>

        {/* Quick status chip & sync */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs font-semibold px-3 py-1 rounded-full border flex items-center gap-1.5",
              isLive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : isConnected
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-secondary text-muted-foreground border-border"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isLive ? "bg-emerald-500" : isConnected ? "bg-primary" : "bg-muted-foreground"
              )}
            />
            {isLive ? "Telemetry Connected" : "Telemetry Standby"}
          </span>
          <GSAPMagnetic strength={0.25}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchBehavioral()}
              disabled={isRefetchingBehavioral}
              className="rounded-lg h-8 px-2.5 text-xs font-semibold"
            >
              <RefreshCw className={cn("h-3 w-3 mr-1", isRefetchingBehavioral && "animate-spin text-primary")} />
              Sync
            </Button>
          </GSAPMagnetic>
        </div>
      </div>

      {/* 2. TOP STAT ROW: 4 GSAP 3D Tilt Cards with Staggered Entrance */}
      <GSAPStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Wellness Score */}
        <GSAPTilt maxTilt={8} scaleOnHover={1.02} className="h-full">
          <SpotlightCard
            className="p-5 h-full"
            spotlightColor={
              wellnessScore === null
                ? "rgba(148, 163, 184, 0.15)"
                : wellnessScore >= 65
                ? "rgba(16, 185, 129, 0.15)"
                : wellnessScore >= 35
                ? "rgba(245, 158, 11, 0.15)"
                : "rgba(244, 63, 94, 0.15)"
            }
          >
            <div className="flex items-center justify-between w-full">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Wellness Score
                </span>
                {wellnessScore !== null ? (
                  <>
                    <div className={cn("text-5xl font-extrabold tracking-tight", scoreColorClass)}>
                      <AnimatedCounter value={wellnessScore} />
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                      Assessment baseline active
                    </span>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-extrabold tracking-tight text-muted-foreground py-1">
                      Unassessed
                    </div>
                    <button
                      onClick={() => navigate("/student/check-in")}
                      className="text-[11px] text-primary font-semibold hover:underline block"
                    >
                      Start First Check-in →
                    </button>
                  </>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Smile className={cn("w-6 h-6", wellnessScore !== null ? scoreColorClass : "text-muted-foreground")} />
              </div>
            </div>
          </SpotlightCard>
        </GSAPTilt>

        {/* Stat 2: Risk Level */}
        <GSAPTilt maxTilt={8} scaleOnHover={1.02} className="h-full">
          <SpotlightCard
            className="p-5 h-full"
            spotlightColor={normalizedRisk === "HIGH" ? "rgba(244, 63, 94, 0.15)" : normalizedRisk === "MODERATE" ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)"}
          >
            <div className="flex items-center justify-between w-full">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Risk Level
                </span>
                <div className="pt-0.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border",
                      normalizedRisk === "HIGH"
                        ? "badge-elevated"
                        : normalizedRisk === "MODERATE"
                        ? "badge-moderate"
                        : "badge-stable"
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        normalizedRisk === "HIGH"
                          ? "bg-rose-500"
                          : normalizedRisk === "MODERATE"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      )}
                    />
                    <span>{normalizedRisk}</span>
                  </span>
                </div>
                <button
                  onClick={() => setIsExplainOpen(true)}
                  className="text-[11px] text-primary font-semibold hover:underline block pt-1"
                >
                  View SHAP Factors →
                </button>
              </div>
              <div className="w-12 h-12 rounded-xl bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                <Activity className="w-6 h-6 text-primary" />
              </div>
            </div>
          </SpotlightCard>
        </GSAPTilt>

        {/* Stat 3: Last Check-In */}
        <GSAPTilt maxTilt={8} scaleOnHover={1.02} className="h-full">
          <SpotlightCard
            className="p-5 h-full"
            spotlightColor="rgba(99, 102, 241, 0.15)"
          >
            <div className="flex items-center justify-between w-full">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Last Check-in
                </span>
                <div className={cn("font-bold text-foreground", moodHistory.length > 0 ? "text-2xl" : "text-lg text-muted-foreground")}>
                  {lastCheckinTime}
                </div>
                <span className="text-xs text-muted-foreground block">
                  {moodHistory.length > 0 ? "Completed via web portal" : "No check-ins logged yet"}
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </SpotlightCard>
        </GSAPTilt>

        {/* Stat 4: Streak Days */}
        <GSAPTilt maxTilt={8} scaleOnHover={1.02} className="h-full">
          <SpotlightCard
            className="p-5 h-full"
            spotlightColor="rgba(245, 158, 11, 0.15)"
          >
            <div className="flex items-center justify-between w-full">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Streak
                </span>
                <div className="text-3xl font-extrabold text-foreground flex items-center gap-1.5">
                  <AnimatedCounter value={streakDays} />
                  <span className="text-sm font-semibold text-muted-foreground">Days</span>
                </div>
                <span className="text-xs text-muted-foreground block">
                  {streakDays > 0 ? "Daily mindfulness habit" : "Check in daily to build streak"}
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Flame className={cn("w-6 h-6", streakDays > 0 ? "fill-amber-500 text-amber-500" : "text-muted-foreground")} />
              </div>
            </div>
          </SpotlightCard>
        </GSAPTilt>
      </GSAPStagger>

      {/* 3. QUICK ACTIONS ROW: 4 GSAP 3D Tilt Cards with Magnetic Icons */}
      <GSAPStagger className="grid grid-cols-2 lg:grid-cols-4 gap-4" delay={0.12}>
        {/* Action 1: Start Check-in */}
        <GSAPTilt maxTilt={6} scaleOnHover={1.03} className="h-full">
          <SpotlightCard
            onClick={() => navigate("/student/check-in")}
            className="p-4 flex flex-col items-center gap-2.5 cursor-pointer text-center group h-full"
            spotlightColor="rgba(59, 130, 246, 0.18)"
          >
            <GSAPMagnetic strength={0.45}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
            </GSAPMagnetic>
            <span className="text-xs font-semibold text-foreground">Start Check-in</span>
            <span className="text-[10px] text-muted-foreground">Log today's mood</span>
          </SpotlightCard>
        </GSAPTilt>

        {/* Action 2: Talk to AI */}
        <GSAPTilt maxTilt={6} scaleOnHover={1.03} className="h-full">
          <SpotlightCard
            onClick={() => navigate("/student/chat")}
            className="p-4 flex flex-col items-center gap-2.5 cursor-pointer text-center group h-full"
            spotlightColor="rgba(168, 85, 247, 0.18)"
          >
            <GSAPMagnetic strength={0.45}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
            </GSAPMagnetic>
            <span className="text-xs font-semibold text-foreground">AI Companion</span>
            <span className="text-[10px] text-muted-foreground">Guided coping & chat</span>
          </SpotlightCard>
        </GSAPTilt>

        {/* Action 3: Book Counselor */}
        <GSAPTilt maxTilt={6} scaleOnHover={1.03} className="h-full">
          <SpotlightCard
            onClick={() => setIsBookingOpen(true)}
            className="p-4 flex flex-col items-center gap-2.5 cursor-pointer text-center group h-full"
            spotlightColor="rgba(16, 185, 129, 0.18)"
          >
            <GSAPMagnetic strength={0.45}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
            </GSAPMagnetic>
            <span className="text-xs font-semibold text-foreground">Book Counselor</span>
            <span className="text-[10px] text-muted-foreground">Schedule session</span>
          </SpotlightCard>
        </GSAPTilt>

        {/* Action 4: Crisis Support */}
        <GSAPTilt maxTilt={6} scaleOnHover={1.03} className="h-full">
          <SpotlightCard
            onClick={() => setIsSOSOpen(true)}
            className="p-4 flex flex-col items-center gap-2.5 cursor-pointer text-center group h-full"
            spotlightColor="rgba(244, 63, 94, 0.18)"
          >
            <GSAPMagnetic strength={0.45}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-500 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </GSAPMagnetic>
            <span className="text-xs font-semibold text-foreground">Crisis Support</span>
            <span className="text-[10px] text-muted-foreground">Get help now</span>
          </SpotlightCard>
        </GSAPTilt>
      </GSAPStagger>

      {/* Micro-Checkin Widget */}
      <div>
        <MoodMicroCheckin />
      </div>

      {/* Screen Time & Digital Wellbeing Quick Glance */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Screen Time & Digital Phenotyping</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {totalMins > 0 ? `${Math.floor(totalMins / 60)}h ${totalMins % 60}m Active` : isConnected ? "Standby" : "Not Connected"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalMins > 0 ? (
                `Breakdown: Studying (${academicMins}m) • Playing (${log?.entertainment_usage_minutes || 0}m) • Late Night (${lateNightMins}m)`
              ) : (
                "No activity data recorded yet • Connect Desktop Agent or Extension to monitor active study time"
              )}
            </p>
          </div>
        </div>

        <GSAPMagnetic strength={0.3}>
          <Button
            size="sm"
            onClick={() => navigate("/student/screentime")}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 shadow-xs"
          >
            {totalMins > 0 ? "View Full Graphics & Apps" : "Connect Device & Monitor"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </GSAPMagnetic>
      </div>

      {/* 4. MAIN ANALYTICS ROW: Wellness Trend Area Chart (h-64) & Sleep Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wellness Trend Area Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border shadow-xs card-hover space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Wellness Trend
              </h2>
              <p className="text-xs text-muted-foreground">
                Longitudinal emotional trajectory and recovery slope
              </p>
            </div>

            {/* Timeframe Toggle (7d / 30d / 90d) */}
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg bg-secondary p-1 text-xs font-semibold">
                {(["7d", "30d", "90d"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTimeframe(t)}
                    className={cn(
                      "px-3 py-1 rounded-md transition-all text-xs",
                      selectedTimeframe === t
                        ? "bg-card text-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/student/history")}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Analytics →
              </Button>
            </div>
          </div>

          {/* Chart area h-64 with primary color opacity gradient */}
          <div className="h-64 w-full">
            {isLoadingTrends ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : chartData.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-border/70 rounded-xl p-6 text-center">
                <TrendingUp className="w-8 h-8 text-muted-foreground/60 mb-2" />
                <p className="text-sm font-semibold text-foreground">No wellness history recorded yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Complete your daily check-in to start tracking your mood and recovery trajectory over time.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/student/check-in")}
                  className="mt-3 text-xs rounded-xl"
                >
                  Start First Check-In
                </Button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="primaryWellnessGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.6} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      fontSize: "12px",
                      backgroundColor: "hsl(var(--card))",
                      color: "hsl(var(--card-foreground))",
                      border: "1px solid hsl(var(--border))",
                    }}
                    formatter={(v: any) => [`${v} / 100`, "Wellness Score"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fill="url(#primaryWellnessGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Sleep Quality Mini-Chart (1 col) */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs card-hover flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MoonStar className="w-5 h-5 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Sleep Quality</h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                {sleepChartData.length > 0 ? `${avgSleepHours} hrs avg` : "Awaiting data"}
              </span>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Weekly sleep duration vs 7h recommended target.
            </p>

            <div className="h-44 w-full">
              {sleepChartData.length === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-border/70 rounded-xl p-4 text-center">
                  <MoonStar className="w-7 h-7 text-muted-foreground/50 mb-2" />
                  <p className="text-xs font-semibold text-foreground">No sleep telemetry yet</p>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px]">
                    Connect Desktop Agent or log daily check-ins to monitor circadian quality.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sleepChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.4} />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="currentColor" className="text-muted-foreground" />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} stroke="currentColor" className="text-muted-foreground" unit="h" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        fontSize: "11px",
                        backgroundColor: "hsl(var(--card))",
                        color: "hsl(var(--card-foreground))",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {sleepChartData.length > 0 ? "Circadian tracking active" : "Circadian baseline calibrating"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsBreathOpen(true)}
              className="text-xs font-semibold text-primary p-0 h-auto hover:underline"
            >
              Wind Down →
            </Button>
          </div>
        </div>
      </div>

      {/* 5. RECENT MOOD ENTRIES LIST & COPING TOOLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Mood Entries List (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border shadow-xs card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Recent Mood Logs</h2>
              <p className="text-xs text-muted-foreground">Your recent journal check-ins and self-reported emotional states</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/student/history")}
              className="rounded-lg text-xs font-semibold"
            >
              View All Logs
            </Button>
          </div>

          {isLoadingMood ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : moodHistory.length === 0 ? (
            <EmptyState
              illustration="empty"
              title="No check-ins logged yet today"
              description="Taking 30 seconds to record your mood pulse helps calibrate personalized campus coping recommendations."
              actionLabel="Start First Check-In"
              onAction={() => navigate("/student/check-in")}
            />
          ) : (
            <div className="divide-y divide-border">
              {moodHistory.slice(0, 4).map((m, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary text-foreground flex items-center justify-center font-bold text-sm">
                      {m.self_reported_score && m.self_reported_score >= 7 ? (
                        <Smile className="w-5 h-5 text-emerald-500" />
                      ) : m.self_reported_score && m.self_reported_score >= 4 ? (
                        <Meh className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Frown className="w-5 h-5 text-rose-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground capitalize">
                        {m.primary_emotion ? `${m.primary_emotion} • ${m.input_type || "Check-in"}` : `${m.input_type || "General"} Check-in`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(m.logged_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-foreground">
                      {m.self_reported_score || 7} / 10
                    </span>
                    <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Recorded
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Guided Coping Tools Panel (1 col) */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs card-hover flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground mb-1">Coping Tools</h2>
            <p className="text-xs text-muted-foreground mb-4">Clinically validated grounding and screening protocols</p>

            <div className="space-y-3">
              <div
                onClick={() => setIsBreathOpen(true)}
                className="p-3 rounded-xl border border-border hover:border-primary/50 cursor-pointer transition-all flex items-center justify-between bg-card card-hover"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Wind className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Box Breathing</h3>
                    <p className="text-xs text-muted-foreground">4-4-4-4 nervous system cadence</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>

              <div
                onClick={() => {
                  setSurveyType("phq-9");
                  setIsSurveyOpen(true);
                }}
                className="p-3 rounded-xl border border-border hover:border-primary/50 cursor-pointer transition-all flex items-center justify-between bg-card card-hover"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">PHQ-9 Screener</h3>
                    <p className="text-xs text-muted-foreground">Standardized clinical assessment</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>

              <div
                onClick={() => setIsBookingOpen(true)}
                className="p-3 rounded-xl border border-border hover:border-primary/50 cursor-pointer transition-all flex items-center justify-between bg-card card-hover"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Counselor Session</h3>
                    <p className="text-xs text-muted-foreground">Confidential campus 1-on-1</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <Button
            onClick={() => navigate("/student/resources")}
            variant="outline"
            className="w-full mt-4 rounded-xl text-xs font-semibold"
          >
            Explore Resource Library
          </Button>
        </div>
      </div>

      {/* 6. PERSONALIZED RECOMMENDATION CARDS (Bottom) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">
              Personalized Recommendations for You
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-medium">Calibrated by AI Coping Engine</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between card-hover">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                Circadian Recovery
              </span>
              <h3 className="text-sm font-semibold text-foreground mt-2">
                Digital Sunset Protocol
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Step away from academic screen workloads 45 minutes before bedtime to accelerate melatonin release.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsBreathOpen(true)}
              className="mt-4 rounded-xl text-xs font-semibold w-full"
            >
              Start Breathing Pacer
            </Button>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between card-hover">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                Cognitive Reframing
              </span>
              <h3 className="text-sm font-semibold text-foreground mt-2">
                Exam Stress Dialogue
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Notice feelings of catastrophic thinking around upcoming assignments. Chat through them with the AI companion.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/student/chat")}
              className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs font-semibold w-full"
            >
              Open AI Chatbot
            </Button>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between card-hover">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                Campus Care
              </span>
              <h3 className="text-sm font-semibold text-foreground mt-2">
                Check-in with Counselor
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Schedule a casual 20-minute chat with Dr. Radhika or campus counseling for guidance on time management.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsBookingOpen(true)}
              className="mt-4 rounded-xl text-xs font-semibold w-full"
            >
              Schedule Session
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EmergencySOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
      <BoxBreathingModal isOpen={isBreathOpen} onClose={() => setIsBreathOpen(false)} />
      <ClinicalSurveyModal
        isOpen={isSurveyOpen}
        surveyType={surveyType}
        onClose={() => setIsSurveyOpen(false)}
        onBookCounselor={() => setIsBookingOpen(true)}
      />
      <CounselorBookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
      <OnboardingConsentModal
        isOpen={isOnboardingConsentOpen}
        onCompleted={() => setIsOnboardingConsentOpen(false)}
      />

      {/* Explainable AI Factors Modal */}
      {isExplainOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in-up overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-5 my-auto">
            <ShapExplanationCard predictionId={latestAssessment?.assessment_id} />
            <ExplainableAIFactors
              studentId={user?.id}
              wellnessScore={wellnessScore ?? undefined}
              riskLevel={normalizedRisk}
              lateNightMins={lateNightMins}
              totalScreenMins={totalMins}
              sentimentScore={latestAssessment?.sentiment_score}
              hasAssessment={Boolean(latestAssessment)}
            />
            <div className="flex justify-end pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExplainOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Close Details
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default StudentDashboard;
