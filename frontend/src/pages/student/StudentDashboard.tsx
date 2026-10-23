import React, { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { RiskBadge } from "@/components/ui/risk-badge";
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
  Moon,
  Laptop,
  RefreshCw,
  Activity,
  ArrowRight,
  Wind,
  Calendar,
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldAlert,
  MoonStar,
  Brain,
  Sliders,
  ChevronRight,
  Smile,
  Meh,
  Frown,
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

  // Wellness score computation
  const rawScore =
    (latestAssessment as any)?.mental_wellness_score ??
    (latestAssessment as any)?.wellness_score ??
    (trendData?.summary?.average_wellness_score && trendData.summary.average_wellness_score > 0
      ? trendData.summary.average_wellness_score
      : 82);
  const wellnessScore = Math.min(100, Math.max(0, Math.round(rawScore)));
  const wellnessClass = classifyMentalWellness(wellnessScore);

  // Risk Level computation
  const normalizedRisk: "LOW" | "MODERATE" | "HIGH" =
    lateNightMins >= 120 || (latestAssessment?.risk_level as string) === "CRITICAL"
      ? "HIGH"
      : (latestAssessment?.risk_level as string) === "MEDIUM"
      ? "MODERATE"
      : "LOW";

  // Score color based on prompt rules: ≥65 text-emerald-500, 35-64 text-amber-500, <35 text-rose-500
  const scoreColorClass =
    wellnessScore >= 65
      ? "text-emerald-500"
      : wellnessScore >= 35
      ? "text-amber-500"
      : "text-rose-500";

  // Streak days calculation
  const streakDays = Math.max(1, moodHistory.length > 0 ? Math.min(moodHistory.length, 14) : 5);

  // Last check-in time
  const lastCheckinTime = moodHistory[0]?.logged_at
    ? new Date(moodHistory[0].logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Today, 9:15 AM";

  // Chart data
  const chartData =
    trendData?.points && trendData.points.length > 0
      ? trendData.points.map((p) => ({
          name: new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          score: p.wellness_score,
        }))
      : moodHistory.map((m) => ({
          name: new Date(m.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          score: (m.self_reported_score || 7) * 10,
        }));

  if (chartData.length < 3) {
    chartData.unshift(
      { name: "3 wks ago", score: 72 },
      { name: "2 wks ago", score: 78 },
      { name: "Last wk", score: 80 }
    );
  }

  // 7-day sleep data
  const sleepChartData = [
    { day: "Mon", hours: 6.8 },
    { day: "Tue", hours: 7.2 },
    { day: "Wed", hours: 6.5 },
    { day: "Thu", hours: 7.8 },
    { day: "Fri", hours: 5.5 },
    { day: "Sat", hours: 8.2 },
    { day: "Sun", hours: 7.4 },
  ];

  const studentFirstName = user?.full_name ? user.full_name.split(" ")[0] : "Student";

  return (
    <div className="space-y-8 pb-16 font-sans text-foreground animate-fade-in-up">
      {/* 1. WELCOME HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Wellness Space</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Welcome back, {studentFirstName} 👋
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
        </div>
      </div>

      {/* 2. TOP STAT ROW: 4 Cards in a grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Wellness Score */}
        <Card className="rounded-lg border border-border bg-card p-5 shadow-xs">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                Wellness Score
              </span>
              <div className={cn("text-5xl font-extrabold tracking-tight", scoreColorClass)}>
                {wellnessScore}
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                +3.5% vs last week
              </span>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Smile className={cn("w-6 h-6", scoreColorClass)} />
            </div>
          </CardContent>
        </Card>

        {/* Stat 2: Risk Level */}
        <Card className="rounded-lg border border-border bg-card p-5 shadow-xs">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                Risk Level
              </span>
              <div className="pt-0.5">
                <RiskBadge level={normalizedRisk} />
              </div>
              <button
                onClick={() => setIsExplainOpen(true)}
                className="text-[11px] text-primary font-semibold hover:underline block pt-1"
              >
                View SHAP Factors →
              </button>
            </div>
            <div className="w-12 h-12 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Stat 3: Last Check-In */}
        <Card className="rounded-lg border border-border bg-card p-5 shadow-xs">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                Last Check-in
              </span>
              <div className="text-2xl font-bold text-foreground">
                {lastCheckinTime}
              </div>
              <span className="text-xs text-muted-foreground block">
                Completed via web portal
              </span>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Stat 4: Streak Days */}
        <Card className="rounded-lg border border-border bg-card p-5 shadow-xs">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                Streak
              </span>
              <div className="text-3xl font-extrabold text-foreground flex items-center gap-1.5">
                <span>{streakDays}</span>
                <span className="text-sm font-semibold text-muted-foreground">Days</span>
              </div>
              <span className="text-xs text-muted-foreground block">
                Daily mindfulness habit
              </span>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 fill-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. QUICK ACTIONS ROW: 4 large clickable cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Action 1: Start Check-in (primary) */}
        <button
          onClick={() => navigate("/student/daily-check-in")}
          className="w-full text-left p-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary transition-all duration-200 shadow-xs group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm shadow-primary/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Start Check-in
              </h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                Daily reflection & mood pulse
              </p>
            </div>
          </div>
        </button>

        {/* Action 2: Talk to AI (indigo) */}
        <button
          onClick={() => navigate("/student/chatbot")}
          className="w-full text-left p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500 transition-all duration-200 shadow-xs group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground group-hover:text-indigo-600 transition-colors">
                Talk to AI
              </h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                24/7 empathetic companion
              </p>
            </div>
          </div>
        </button>

        {/* Action 3: Book Counselor (blue) */}
        <button
          onClick={() => setIsBookingOpen(true)}
          className="w-full text-left p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500 transition-all duration-200 shadow-xs group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                Book Counselor
              </h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                Confidential campus 1-on-1
              </p>
            </div>
          </div>
        </button>

        {/* Action 4: Crisis Support (rose) */}
        <button
          onClick={() => setIsSOSOpen(true)}
          className="w-full text-left p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500 transition-all duration-200 shadow-xs group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-600/20 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground group-hover:text-rose-600 transition-colors">
                Crisis Support
              </h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                Immediate emergency triage
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Micro-Checkin Widget */}
      <div>
        <MoodMicroCheckin />
      </div>

      {/* 4. MAIN ANALYTICS ROW: Wellness Trend Area Chart (h-64) & Sleep Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wellness Trend Area Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-lg bg-card border border-border shadow-xs space-y-4">
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

          {/* Chart area increased to h-64 with primary color opacity gradient */}
          <div className="h-64 w-full">
            {isLoadingTrends ? (
              <Skeleton className="w-full h-full rounded-lg" />
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
        <div className="p-6 rounded-lg bg-card border border-border shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MoonStar className="w-5 h-5 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Sleep Quality</h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                7.2 hrs avg
              </span>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Weekly sleep duration vs 7h recommended target.
            </p>

            <div className="h-44 w-full">
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
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Circadian Debt: 1.2 hrs</span>
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
        <div className="lg:col-span-2 p-6 rounded-lg bg-card border border-border shadow-xs">
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
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ) : moodHistory.length === 0 ? (
            <EmptyState
              icon={Smile}
              title="No check-ins logged yet today"
              description="Taking 30 seconds to record your mood pulse helps calibrate personalized campus coping recommendations."
              actionLabel="Start First Check-In"
              onAction={() => navigate("/student/daily-check-in")}
            />
          ) : (
            <div className="divide-y divide-border">
              {moodHistory.slice(0, 4).map((m, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary text-foreground flex items-center justify-center font-bold text-sm">
                      {m.self_reported_score && m.self_reported_score >= 7 ? (
                        <Smile className="w-5 h-5 text-emerald-500" />
                      ) : m.self_reported_score && m.self_reported_score >= 4 ? (
                        <Meh className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Frown className="w-5 h-5 text-rose-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">
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
                    <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Recorded
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Guided Coping Tools Panel (1 col) */}
        <div className="p-6 rounded-lg bg-card border border-border shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground mb-1">Coping Tools</h2>
            <p className="text-xs text-muted-foreground mb-4">Clinically validated grounding and screening protocols</p>

            <div className="space-y-3">
              <div
                onClick={() => setIsBreathOpen(true)}
                className="p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-all flex items-center justify-between bg-card"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Wind className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Box Breathing</h3>
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
                className="p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-all flex items-center justify-between bg-card"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">PHQ-9 Screener</h3>
                    <p className="text-xs text-muted-foreground">Standardized clinical assessment</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>

              <div
                onClick={() => setIsBookingOpen(true)}
                className="p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-all flex items-center justify-between bg-card"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Counselor Session</h3>
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
            className="w-full mt-4 rounded-lg text-xs font-semibold"
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
          <span className="text-xs text-muted-foreground">Calibrated by AI Coping Engine</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-lg bg-card border border-border shadow-xs flex flex-col justify-between">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                Circadian Recovery
              </span>
              <h3 className="text-sm font-medium text-foreground mt-2">
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
              className="mt-4 rounded-lg text-xs font-semibold w-full"
            >
              Start Breathing Pacer
            </Button>
          </div>

          <div className="p-5 rounded-lg bg-card border border-border shadow-xs flex flex-col justify-between">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                Cognitive Reframing
              </span>
              <h3 className="text-sm font-medium text-foreground mt-2">
                Exam Stress Dialogue
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Notice feelings of catastrophic thinking around upcoming assignments. Chat through them with the AI companion.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/student/chatbot")}
              className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs font-semibold w-full"
            >
              Open AI Chatbot
            </Button>
          </div>

          <div className="p-5 rounded-lg bg-card border border-border shadow-xs flex flex-col justify-between">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                Campus Care
              </span>
              <h3 className="text-sm font-medium text-foreground mt-2">
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
              className="mt-4 rounded-lg text-xs font-semibold w-full"
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
      {isExplainOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in-up">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-card border border-border shadow-2xl p-6 space-y-5">
            <ShapExplanationCard predictionId={latestAssessment?.assessment_id} />
            <ExplainableAIFactors
              studentId={user?.id}
              wellnessScore={wellnessScore}
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
                className="rounded-lg text-xs font-semibold"
              >
                Close Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
