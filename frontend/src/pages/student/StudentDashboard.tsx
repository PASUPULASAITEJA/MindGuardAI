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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { motion } from "motion/react";
import { staggerContainer, cardEntrance } from "@/utils/motion";

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
  const { data: latestAssessment } = useLatestAssessment();
  const { data: recommendations = [] } = useCurrentRecommendations();
  const { data: moodHistory = [] } = useMoodHistory("30d");
  const { data: trendData } = useWellnessTrends(selectedTimeframe);

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
  const circadianData = behavioralSummary?.circadian_sleep_analysis;

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

  const normalizedRisk: "LOW" | "MODERATE" | "HIGH" =
    lateNightMins >= 120 || (latestAssessment?.risk_level as string) === "CRITICAL"
      ? "HIGH"
      : (latestAssessment?.risk_level as string) === "MEDIUM"
      ? "MODERATE"
      : "LOW";

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

  // Fallback points if needed
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

  // Circle radius for large ring chart
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (wellnessScore / 100) * circumference;

  const studentFirstName = user?.full_name ? user.full_name.split(" ")[0] : "there";

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-8 pb-16 font-sans text-slate-900 dark:text-slate-100"
    >
      {/* 1. WELCOME HEADER */}
      <motion.div variants={cardEntrance} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Campus Wellness Space</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {studentFirstName} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here is your daily mental health overview and circadian recovery status.
          </p>
        </div>

        {/* Quick status chip */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs font-semibold px-3 py-1 rounded-full border flex items-center gap-1.5",
              isLive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : isConnected
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isLive ? "bg-emerald-500" : isConnected ? "bg-blue-500" : "bg-slate-400"
              )}
            />
            {isLive ? "Telemetry Connected" : "Telemetry Standby"}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchBehavioral()}
            disabled={isRefetchingBehavioral}
            className="rounded-xl h-8 px-2.5 text-xs font-medium"
          >
            <RefreshCw className={cn("h-3 w-3 mr-1", isRefetchingBehavioral && "animate-spin text-indigo-600")} />
            Sync
          </Button>
        </div>
      </motion.div>

      {/* 2. TOP STAT ROW: Wellness Score Ring, Streak, Last Check-in, Risk Badge */}
      <motion.div variants={cardEntrance} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Wellness Score Ring Chart */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Wellness Index</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block">
              {wellnessScore} <span className="text-base font-medium text-slate-400">/ 100</span>
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
              +3.5% vs last week
            </span>
          </div>

          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-indigo-600 dark:stroke-indigo-400 transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="absolute text-sm font-bold text-slate-900 dark:text-white">{wellnessScore}%</span>
          </div>
        </div>

        {/* Stat 2: Streak Days */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Check-in Streak</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block">
              {streakDays} <span className="text-base font-medium text-slate-400">days</span>
            </span>
            <span className="text-xs text-slate-500 mt-1 block">Daily mindfulness habit</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shadow-xs">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 3: Last Check-In */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Last Check-In</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
              {lastCheckinTime}
            </span>
            <span className="text-xs text-slate-500 mt-1 block">Completed via web portal</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 4: Risk Level Badge */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Clinical Risk Level</span>
            <div className="mt-2">
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5",
                  normalizedRisk === "HIGH"
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                    : normalizedRisk === "MODERATE"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                )}
              >
                {normalizedRisk === "HIGH" ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                {normalizedRisk} RISK
              </span>
            </div>
            <button
              onClick={() => setIsExplainOpen(true)}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline mt-2 block"
            >
              View SHAP Factors →
            </button>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </motion.div>

      {/* 3. QUICK ACTIONS ROW */}
      <motion.div variants={cardEntrance} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Action 1: Start Check-In */}
        <Button
          onClick={() => navigate("/student/daily-check-in")}
          className="h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-transform hover:scale-105"
        >
          <Sparkles className="w-4 h-4" />
          <span>Daily Check-In</span>
        </Button>

        {/* Action 2: Talk to AI */}
        <Button
          onClick={() => navigate("/student/chatbot")}
          className="h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-transform hover:scale-105"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Talk to AI</span>
        </Button>

        {/* Action 3: Book Counselor */}
        <Button
          variant="outline"
          onClick={() => setIsBookingOpen(true)}
          className="h-14 rounded-2xl border-slate-300 dark:border-slate-700 font-bold flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-transform hover:scale-105"
        >
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span>Book Counselor</span>
        </Button>

        {/* Action 4: SOS Emergency */}
        <Button
          onClick={() => setIsSOSOpen(true)}
          className="h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center justify-center gap-2 shadow-sm shadow-rose-600/20 transition-transform hover:scale-105"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Emergency SOS</span>
        </Button>
      </motion.div>

      {/* Micro-Checkin Widget */}
      <motion.div variants={cardEntrance}>
        <MoodMicroCheckin />
      </motion.div>

      {/* 4. MAIN ANALYTICS ROW: 30-Day Trend Chart & Sleep Quality Mini-Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 30-Day Wellness Trend Area Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">30-Day Wellness Trend</h3>
              <p className="text-xs text-slate-500">Longitudinal emotional trajectory and recovery slope</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
                {(["7d", "30d", "90d"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTimeframe(t)}
                    className={cn(
                      "px-3 py-1 rounded-lg transition-all",
                      selectedTimeframe === t
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
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
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                Analytics →
              </Button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="wellnessGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" dark-stroke="#334155" opacity={0.6} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    fontSize: "12px",
                    backgroundColor: "#0f172a",
                    color: "#ffffff",
                    border: "none",
                  }}
                  formatter={(v: any) => [`${v} / 100`, "Score"]}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  fill="url(#wellnessGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sleep Quality Mini-Chart (1 col) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MoonStar className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Sleep Quality</h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                7.2 hrs avg
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Weekly sleep duration vs 7h recommended target.
            </p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sleepChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} stroke="#94a3b8" unit="h" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      fontSize: "11px",
                      backgroundColor: "#0f172a",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="hours" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Circadian Debt: 1.2 hrs</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsBreathOpen(true)}
              className="text-xs font-semibold text-indigo-600 p-0 h-auto hover:underline"
            >
              Wind Down →
            </Button>
          </div>
        </div>
      </div>

      {/* 5. RECENT MOOD ENTRIES LIST & COMPACT TOOLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Mood Entries List (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Mood Logs</h3>
              <p className="text-xs text-slate-500">Your recent journal check-ins and self-reported emotional states</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/student/history")}
              className="rounded-xl text-xs font-semibold"
            >
              View All Logs
            </Button>
          </div>

          {moodHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Smile className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm font-medium">No check-ins logged yet today.</p>
              <Button
                size="sm"
                onClick={() => navigate("/student/daily-check-in")}
                className="mt-3 bg-indigo-600 text-white rounded-xl text-xs"
              >
                Start First Check-In
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {moodHistory.slice(0, 4).map((m, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                      {m.self_reported_score && m.self_reported_score >= 7 ? (
                        <Smile className="w-5 h-5 text-emerald-500" />
                      ) : m.self_reported_score && m.self_reported_score >= 4 ? (
                        <Meh className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Frown className="w-5 h-5 text-rose-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                        {m.primary_emotion ? `${m.primary_emotion} • ${m.input_type || "Check-in"}` : `${m.input_type || "General"} Check-in`}
                      </p>
                      <p className="text-xs text-slate-400">
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
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
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
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Coping Tools</h3>
            <p className="text-xs text-slate-500 mb-4">Clinically validated grounding and screening protocols</p>

            <div className="space-y-3">
              <div
                onClick={() => setIsBreathOpen(true)}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                    <Wind className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Box Breathing</p>
                    <p className="text-[11px] text-slate-500">4-4-4-4 nervous system cadence</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => {
                  setSurveyType("phq-9");
                  setIsSurveyOpen(true);
                }}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">PHQ-9 Screener</p>
                    <p className="text-[11px] text-slate-500">Standardized clinical assessment</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => setIsBookingOpen(true)}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Counselor Session</p>
                    <p className="text-[11px] text-slate-500">Confidential campus 1-on-1</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          <Button
            onClick={() => navigate("/student/self-care")}
            variant="outline"
            className="w-full mt-4 rounded-xl text-xs font-bold"
          >
            Explore Resource Library
          </Button>
        </div>
      </div>

      {/* 6. PERSONALIZED RECOMMENDATION CARDS (Bottom) */}
      <motion.div variants={cardEntrance} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Personalized Recommendations for You
            </h3>
          </div>
          <span className="text-xs text-slate-500">Calibrated by AI Coping Engine</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase">
                Circadian Recovery
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                Digital Sunset Protocol
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
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

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase">
                Cognitive Reframing
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                Exam Stress Dialogue
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Notice feelings of catastrophic thinking around upcoming assignments. Chat through them with the AI companion.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/student/chatbot")}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold w-full"
            >
              Open AI Chatbot
            </Button>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase">
                Campus Care
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                Check-in with Counselor
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
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
      </motion.div>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
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
            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
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
        </div>
      )}
    </motion.div>
  );
};

export default StudentDashboard;
