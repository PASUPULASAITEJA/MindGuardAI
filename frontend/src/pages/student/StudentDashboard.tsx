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
  BarChart3,
  Sun,
  ShieldCheck,
  TrendingUp,
  Layers,
  ChevronRight
} from "lucide-react";

// Modals
import { ShapExplanationCard } from "@/components/ShapExplanationCard";
import { ExplainableAIFactors } from "@/components/ExplainableAIFactors";
import { BoxBreathingModal } from "@/components/BoxBreathingModal";
import { ClinicalSurveyModal } from "@/components/ClinicalSurveyModal";
import { CounselorBookingModal } from "@/components/CounselorBookingModal";
import { EmergencySOSModal } from "@/components/EmergencySOSModal";
import { ConsentBanner } from "@/components/ConsentBanner";
import { OnboardingConsentModal } from "@/components/OnboardingConsentModal";
import { MoodMicroCheckin } from "@/components/MoodMicroCheckin";

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
  const [isOnboardingConsentOpen, setIsOnboardingConsentOpen] = useState(false);
  const [screenChartMode, setScreenChartMode] = useState<"total" | "circadian" | "purpose">("total");

  // Onboarding Consent Check on first student login
  useEffect(() => {
    if (user?.role === "STUDENT") {
      consentRecordsAPI.getConsents().then((res) => {
        if (!res.onboarding_completed) {
          setIsOnboardingConsentOpen(true);
        }
      }).catch(() => {});
    }
  }, [user]);

  // Queries
  const [selectedTimeframe, setSelectedTimeframe] = useState<"7d" | "30d" | "90d" | "180d">("30d");
  const { data: latestAssessment, isLoading: isAssessmentLoading } = useLatestAssessment();
  const { data: recommendations } = useCurrentRecommendations();
  const { data: moodHistory = [] } = useMoodHistory("30d");
  const { data: trendData } = useWellnessTrends(selectedTimeframe);

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
  const circadianData = behavioralSummary?.circadian_sleep_analysis;

  const totalMins = log?.total_screen_time_minutes || 0;
  const lateNightMins = log?.late_night_usage_minutes || 0;

  let academicMins = log?.academic_usage_minutes || 0;
  let socialMins = log?.social_usage_minutes || 0;
  let entertainmentMins = log?.entertainment_usage_minutes || 0;
  const adultMins = (log as any)?.adult_usage_minutes || 0;

  if (totalMins > 0 && socialMins === 0 && entertainmentMins === 0) {
    academicMins = Math.round(totalMins * 0.62);
    entertainmentMins = Math.round(totalMins * 0.23);
    socialMins = Math.max(0, totalMins - academicMins - entertainmentMins);
  }

  // Percentage calculations
  const rawCatSum = (academicMins || 0) + (socialMins || 0) + (entertainmentMins || 0) + (adultMins || 0);
  const catBase = Math.max(totalMins, rawCatSum, 1);
  const academicPct = Math.min(100, Math.round(((academicMins || 0) / catBase) * 100));
  const socialPct = Math.min(100 - academicPct, Math.round(((socialMins || 0) / catBase) * 100));
  const entertainmentPct = Math.min(100 - academicPct - socialPct, Math.round(((entertainmentMins || 0) / catBase) * 100));
  const otherPct = Math.max(0, 100 - academicPct - socialPct - entertainmentPct);

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
      lateM = Math.max(lateNightMins, matched?.late_night_usage_minutes || 0);
      acadM = Math.max(academicMins, matched?.academic_usage_minutes || 0);
      socM = Math.max(socialMins, matched?.social_usage_minutes || 0);
      entM = Math.max(entertainmentMins, matched?.entertainment_usage_minutes || 0);
      adultM = Math.max(adultMins, matched?.adult_usage_minutes || 0);
      risk = lateM >= 120 ? "HIGH" : (matched?.risk_level || "LOW");
    } else if (matched) {
      hasData = true;
      totalM = matched.total_screen_time_minutes || 0;
      lateM = matched.late_night_usage_minutes || 0;
      acadM = matched.academic_usage_minutes || 0;
      socM = matched.social_usage_minutes || 0;
      entM = matched.entertainment_usage_minutes || 0;
      adultM = matched.adult_usage_minutes || 0;
      risk = matched.risk_level || (lateM >= 120 ? "HIGH" : "LOW");
    }

    if (totalM > 0 && socM === 0 && entM === 0) {
      acadM = Math.round(totalM * 0.62);
      entM = Math.round(totalM * 0.23);
      socM = Math.max(0, totalM - acadM - entM);
    } else {
      const dayCatSum = acadM + socM + entM + adultM;
      if (dayCatSum > totalM && totalM > 0) {
        const ratio = totalM / dayCatSum;
        acadM = Math.round(acadM * ratio);
        socM = Math.round(socM * ratio);
        entM = Math.round(entM * ratio);
        adultM = Math.round(adultM * ratio);
      }
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
      lateNightMins: lateM,
      academicMins: acadM,
      socialMins: socM,
      entertainmentMins: entM,
      riskLevel: risk
    };
  });

  const avgDailyHours = (
    screenChartData.reduce((acc, d) => acc + d.totalHours, 0) / 7
  ).toFixed(1);

  // Time-calibrated greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const studentName = user?.full_name ? user.full_name.split(" ")[0] : "there";

  // Score computation
  const hasAssessment = !!latestAssessment;
  const rawScore = (latestAssessment as any)?.mental_wellness_score ?? (latestAssessment as any)?.wellness_score ?? (trendData?.summary?.average_wellness_score && trendData.summary.average_wellness_score > 0 ? trendData.summary.average_wellness_score : null);
  const wellnessScore = rawScore !== null ? Math.min(100, Math.max(0, rawScore)) : null;
  const wellnessClass = classifyMentalWellness(wellnessScore ?? 75);

  // Circadian data values
  const sleepOnset = circadianData?.estimated_sleep_onset || (lateNightMins > 0 ? "Late Night" : "—");
  const wakeTime = circadianData?.estimated_wake_time || "—";
  const sleepDuration = circadianData?.sleep_duration_hours ?? null;
  const circadianDebt = (circadianData as any)?.circadian_debt_hours || 0;

  // Historical Area Chart Data
  const chartData = moodHistory.map((item, index) => ({
    name: new Date(item.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: (item.self_reported_score || 0) * 10,
  }));

  if (chartData.length === 0 && wellnessScore !== null) {
    chartData.push({
      name: "Recent Assessment",
      score: wellnessScore,
    });
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Welcoming Header & Quick Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            {getGreeting()}, {studentName}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Here is an overview of your wellbeing and campus support journey.
          </p>
        </div>

        {/* Quick Actions Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate("/student/check-in")}
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <Smile className="h-3.5 w-3.5" />
            <span>Complete Check-in</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSurveyType("phq-9");
              setIsSurveyOpen(true);
            }}
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Take Assessment</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/student/chat")}
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Talk to AI Assistant</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsBookingOpen(true)}
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <HeartHandshake className="h-3.5 w-3.5" />
            <span>Request Counselling</span>
          </Button>
        </div>
      </div>

      {/* Consent Notice if applicable */}
      <ConsentBanner />

      {/* 2. Support Status & Personal Baseline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Current Support Status Card */}
        <Card className="lg:col-span-1 p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Support Status
              </span>
              <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded border", wellnessClass.badgeClass)}>
                {wellnessClass.label === "Low Risk / Optimal" ? "Stable" : wellnessClass.label}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-foreground font-sans">
                {wellnessScore !== null ? wellnessScore.toFixed(0) : "—"}
              </span>
              <span className="text-xs text-muted-foreground">/ 100 Wellbeing Index</span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Based on your recent daily check-ins, circadian rhythm, and psychometric assessments.
            </p>
          </div>

          <div className="pt-4 border-t border-border mt-4 flex items-center justify-between">
            <button
              onClick={() => setIsExplainOpen(true)}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View details & AI factors</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] text-muted-foreground">
              {latestAssessment ? "Model Calibrated" : "Baseline Mode"}
            </span>
          </div>
        </Card>

        {/* Personal Baseline Analysis Panel */}
        <Card className="lg:col-span-2 p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Personal Wellbeing Baseline</h3>
              <p className="text-xs text-muted-foreground">Calibrated against your own longitudinal check-in trajectory</p>
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-border bg-secondary text-muted-foreground">
              Confidence: {trendData?.baseline?.baseline_confidence || "ESTABLISHING"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-secondary/40 border border-border/60">
              <div className="text-[10px] text-muted-foreground font-medium uppercase">Usual Stress</div>
              <div className="text-base font-bold text-foreground mt-0.5">
                {trendData?.baseline?.usual_stress ? `${trendData.baseline.usual_stress} / 10` : "—"}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Recent: {trendData?.baseline?.recent_stress ? `${trendData.baseline.recent_stress} / 10` : "—"}
              </div>
              {trendData?.baseline?.stress_delta !== undefined && trendData.baseline.stress_delta !== null && (
                <div className={cn("text-[10px] font-semibold mt-1", trendData.baseline.stress_delta > 0 ? "text-amber-500" : "text-emerald-500")}>
                  {trendData.baseline.stress_delta > 0 ? `+${trendData.baseline.stress_delta}` : trendData.baseline.stress_delta} deviation
                </div>
              )}
            </div>

            <div className="p-3 rounded-lg bg-secondary/40 border border-border/60">
              <div className="text-[10px] text-muted-foreground font-medium uppercase">Usual Sleep</div>
              <div className="text-base font-bold text-foreground mt-0.5">
                {trendData?.baseline?.usual_sleep_hours ? `${trendData.baseline.usual_sleep_hours}h` : "—"}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Recent: {trendData?.baseline?.recent_sleep_hours ? `${trendData.baseline.recent_sleep_hours}h` : "—"}
              </div>
              {trendData?.baseline?.sleep_delta !== undefined && trendData.baseline.sleep_delta !== null && (
                <div className={cn("text-[10px] font-semibold mt-1", trendData.baseline.sleep_delta < 0 ? "text-amber-500" : "text-emerald-500")}>
                  {trendData.baseline.sleep_delta > 0 ? `+${trendData.baseline.sleep_delta}h` : `${trendData.baseline.sleep_delta}h`} deviation
                </div>
              )}
            </div>

            <div className="p-3 rounded-lg bg-secondary/40 border border-border/60">
              <div className="text-[10px] text-muted-foreground font-medium uppercase">Usual Mood</div>
              <div className="text-base font-bold text-foreground mt-0.5">
                {trendData?.baseline?.usual_mood_score ? `${trendData.baseline.usual_mood_score} / 10` : "—"}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Recent: {trendData?.baseline?.recent_mood_score ? `${trendData.baseline.recent_mood_score} / 10` : "—"}
              </div>
              {trendData?.baseline?.mood_delta !== undefined && trendData.baseline.mood_delta !== null && (
                <div className={cn("text-[10px] font-semibold mt-1", trendData.baseline.mood_delta >= 0 ? "text-emerald-500" : "text-amber-500")}>
                  {trendData.baseline.mood_delta > 0 ? `+${trendData.baseline.mood_delta}` : trendData.baseline.mood_delta} shift
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-secondary/30 p-2.5 rounded-lg border border-border/40 flex items-center gap-2">
            <span className="text-sm">💡</span>
            <span>{trendData?.baseline?.summary_message || "Continue checking in to establish your personal wellbeing baseline."}</span>
          </div>
        </Card>
      </div>

      {/* 3. My Wellbeing Journey Area Chart */}
      <Card className="p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">My Wellbeing Journey</h3>
            <p className="text-xs text-muted-foreground">Longitudinal composite wellness indicators over time</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-secondary p-0.5 text-xs font-medium border border-border">
              {(["7d", "30d", "90d", "180d"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTimeframe(t)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors uppercase",
                    selectedTimeframe === t ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t === "180d" ? "6M" : t === "90d" ? "3M" : t}
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/student/history")}
              className="text-xs text-primary font-semibold hover:underline gap-1 h-8 px-2"
            >
              <span>Full Analytics</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {((trendData?.points && trendData.points.length > 0) || chartData.length > 0) ? (
          <div className="h-48 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={trendData?.points && trendData.points.length > 0 
                  ? trendData.points.map(p => ({
                      name: new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                      score: p.wellness_score,
                      rolling: p.rolling_avg
                    }))
                  : chartData
                } 
                margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="wellGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: "8px", 
                    fontSize: "12px", 
                    backgroundColor: "hsl(var(--card))", 
                    borderColor: "hsl(var(--border))" 
                  }} 
                  formatter={(val: any) => [`${val} / 100`, "Wellbeing"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#wellGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4">
            <Activity className="h-6 w-6 text-muted-foreground/40 mb-1" />
            <p className="text-xs text-muted-foreground">Complete your daily check-in to generate trend data.</p>
          </div>
        )}
      </Card>

      {/* 3. Today's Fast Micro Check-in Widget */}
      <MoodMicroCheckin />

      {/* 4. Digital Phenotyping & Telemetry Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Study-Rest & Circadian Telemetry
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Hardware agent: {isConnected ? "Connected" : "Standby"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchBehavioral()}
              disabled={isRefetchingBehavioral}
              className="h-8 px-2.5 text-xs font-medium"
            >
              <RefreshCw className={cn("h-3 w-3 mr-1", isRefetchingBehavioral && "animate-spin text-primary")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* 4-Stat Metric Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <span className="text-[11px] text-muted-foreground uppercase font-medium block">Active PC Time</span>
            <span className="text-2xl font-bold text-foreground font-sans mt-1 block">
              {Math.floor(totalMins / 60)}h {totalMins % 60}m
            </span>
            <span className="text-[11px] text-muted-foreground block mt-1">
              {yesterdayLog ? `Yesterday: ${Math.floor(yesterdayLog.total_screen_time_minutes / 60)}h ${yesterdayLog.total_screen_time_minutes % 60}m` : "Today's active usage"}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <span className="text-[11px] text-muted-foreground uppercase font-medium block">Academic Coursework</span>
            <span className="text-2xl font-bold text-foreground font-sans mt-1 block">
              {academicPct}%
            </span>
            <span className="text-[11px] text-muted-foreground block mt-1">
              {Math.floor(academicMins / 60)}h {academicMins % 60}m logged
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <span className="text-[11px] text-muted-foreground uppercase font-medium block">Late-Night Usage</span>
            <span className={cn(
              "text-2xl font-bold font-sans mt-1 block",
              lateNightMins >= 120 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
            )}>
              {Math.floor(lateNightMins / 60)}h {lateNightMins % 60}m
            </span>
            <span className="text-[11px] text-muted-foreground block mt-1">
              {lateNightMins >= 120 ? "Elevated nocturnal fatigue" : "12:00 AM – 5:00 AM window"}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <span className="text-[11px] text-muted-foreground uppercase font-medium block">Inferred Rest</span>
            <span className="text-2xl font-bold text-foreground font-sans mt-1 block">
              {sleepDuration !== null ? `${sleepDuration} hrs` : "—"}
            </span>
            <span className="text-[11px] text-muted-foreground block mt-1">
              Onset: {sleepOnset} • Wake: {wakeTime}
            </span>
          </div>
        </div>

        {/* 7-Day Chart Panel */}
        <Card className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">7-Day Usage Telemetry</h3>
              <p className="text-xs text-muted-foreground">Daily total hours vs healthy threshold (6.0h)</p>
            </div>

            <div className="flex rounded-lg bg-secondary p-0.5 text-xs font-medium border border-border">
              <button
                type="button"
                onClick={() => setScreenChartMode("total")}
                className={cn("px-3 py-1 rounded-md transition-colors", screenChartMode === "total" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground")}
              >
                Total
              </button>
              <button
                type="button"
                onClick={() => setScreenChartMode("circadian")}
                className={cn("px-3 py-1 rounded-md transition-colors", screenChartMode === "circadian" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground")}
              >
                Day / Night
              </button>
              <button
                type="button"
                onClick={() => setScreenChartMode("purpose")}
                className={cn("px-3 py-1 rounded-md transition-colors", screenChartMode === "purpose" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground")}
              >
                Study / Leisure
              </button>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={screenChartData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />
                <XAxis dataKey="dayLabel" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} unit="h" />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: "8px", 
                    fontSize: "12px", 
                    backgroundColor: "hsl(var(--card))", 
                    borderColor: "hsl(var(--border))" 
                  }} 
                />
                <ReferenceLine y={6.0} stroke="#10b981" strokeDasharray="3 3" />
                {screenChartMode === "total" ? (
                  <Bar dataKey="totalHours" name="Total Hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="totalHours" position="top" fontSize={10} formatter={(v: any) => v > 0 ? `${v}h` : ""} />
                  </Bar>
                ) : screenChartMode === "circadian" ? (
                  <>
                    <Bar dataKey="daytimeHours" name="Daytime Hours" stackId="s" fill="#38bdf8" />
                    <Bar dataKey="lateNightHours" name="Late-Night Hours" stackId="s" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </>
                ) : (
                  <>
                    <Bar dataKey="academicHours" name="Study Hours" stackId="s" fill="hsl(var(--primary))" />
                    <Bar dataKey="socialHours" name="Social Hours" stackId="s" fill="#10b981" />
                    <Bar dataKey="entertainmentHours" name="Leisure Hours" stackId="s" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 5. Recommended Support Pathways */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Recommended Care & Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Wind className="h-4 w-4" />
                <h4 className="text-xs font-semibold text-foreground">Box Breathing Pacer</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                2-minute physiological 4-4-4-4 cadence to ease sympathetic nervous system tension.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsBreathOpen(true)}
              className="text-xs font-medium w-full"
            >
              Start Breathing Exercise
            </Button>
          </Card>

          <Card className="p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-4 w-4" />
                <h4 className="text-xs font-semibold text-foreground">Psychometric Screener</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Standardized PHQ-9 & GAD-7 assessment to track your personal wellbeing baseline.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSurveyType("phq-9");
                setIsSurveyOpen(true);
              }}
              className="text-xs font-medium w-full"
            >
              Take Assessment
            </Button>
          </Card>

          <Card className="p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Calendar className="h-4 w-4" />
                <h4 className="text-xs font-semibold text-foreground">Campus Counsellor</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Book a confidential 1-on-1 appointment with a certified campus wellbeing counsellor.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsBookingOpen(true)}
              className="text-xs font-medium w-full"
            >
              Book Session
            </Button>
          </Card>
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
      <OnboardingConsentModal isOpen={isOnboardingConsentOpen} onCompleted={() => setIsOnboardingConsentOpen(false)} />

      {/* Explainable AI Factors Modal */}
      {isExplainOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-card border border-border shadow-lg p-6 space-y-5">
            <ShapExplanationCard predictionId={latestAssessment?.assessment_id} />
            <ExplainableAIFactors
              studentId={user?.id}
              wellnessScore={wellnessScore ?? 78}
              riskLevel={lateNightMins >= 120 ? "HIGH" : (latestAssessment?.risk_level || "LOW")}
              lateNightMins={lateNightMins}
              totalScreenMins={totalMins}
              sentimentScore={latestAssessment?.sentiment_score}
              hasAssessment={hasAssessment}
            />
            <div className="flex justify-end pt-2 border-t border-border">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsExplainOpen(false)}
                className="text-xs font-medium"
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
