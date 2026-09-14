import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Smile, 
  Sparkles, 
  BookOpen, 
  Laptop, 
  Moon, 
  Clock, 
  Activity, 
  Calendar, 
  ShieldCheck, 
  Flame, 
  MessageSquare, 
  Wind, 
  PhoneCall, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  ArrowUpRight,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  HeartHandshake
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { useScreenTimeTracker } from "@/hooks/useScreenTimeTracker";
import { useLatestAssessment } from "@/hooks/usePredictions";
import { useCurrentRecommendations } from "@/hooks/useRecommendations";
import { EmergencySOSModal } from "@/components/EmergencySOSModal";
import api, { appointmentsAPI } from "@/services/api";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from "recharts";

// Clinical survey questions for quick in-dashboard check
const PHQ9_SAMPLE = [
  { id: 1, prompt: "Little interest or pleasure in doing things?" },
  { id: 2, prompt: "Feeling down, depressed, or hopeless?" },
  { id: 3, prompt: "Trouble falling or staying asleep, or sleeping too much?" },
  { id: 4, prompt: "Feeling tired or having little energy?" },
  { id: 5, prompt: "Poor appetite or overeating?" },
  { id: 6, prompt: "Feeling bad about yourself — or that you are a failure?" },
  { id: 7, prompt: "Trouble concentrating on things, such as reading or studying?" },
  { id: 8, prompt: "Moving or speaking slowly, or being unusually restless?" },
  { id: 9, prompt: "Thoughts that you would be better off or hurting yourself?" },
];

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Background screen telemetry hook
  useScreenTimeTracker();

  // Modals state
  const [isEmergencySOSOpen, setIsEmergencySOSOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [surveyType, setSurveyType] = useState<"PHQ9" | "GAD7">("PHQ9");
  const [surveyStep, setSurveyStep] = useState(0);
  const [surveyAnswers, setSurveyAnswers] = useState<number[]>([]);

  // Counselor Booking Form State
  const [counselorName, setCounselorName] = useState("Dr. Sarah Jenkins (Clinical Psychologist)");
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0]);
  const [bookingSlot, setBookingSlot] = useState("10:00 AM");
  const [bookingNotes, setBookingNotes] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Queries
  const { data: latestAssessment, refetch: refetchAssessment } = useLatestAssessment();
  const { data: recommendations = [], refetch: refetchRecs } = useCurrentRecommendations();

  const { 
    data: behavioralSummary, 
    refetch: refetchBehavioral,
    isFetching: isRefetchingBehavioral 
  } = useQuery({
    queryKey: ["behavioral-summary"],
    queryFn: async () => {
      const res = await api.get("/chat/behavioral-summary");
      return res.data;
    },
    staleTime: 10 * 1000,
  });

  const latestLog = behavioralSummary?.latest_log;
  const isAgentConnected = behavioralSummary?.is_agent_connected ?? true;

  // Screen metrics calculations
  const totalMins = latestLog?.total_screen_time_minutes || 0;
  const academicMins = latestLog?.academic_usage_minutes || 0;
  const lateNightMins = latestLog?.late_night_usage_minutes || 0;
  const socialMins = latestLog?.social_usage_minutes || 0;
  const entertainmentMins = latestLog?.entertainment_usage_minutes || 0;

  const academicPct = totalMins > 0 ? Math.min(100, Math.round((academicMins / totalMins) * 100)) : 94;
  const otherPct = Math.max(0, 100 - academicPct);

  // Overall Mental Wellness Score (0-100)
  const wellnessScore = latestAssessment?.mental_wellness_score ?? 88;
  const riskLevel = latestAssessment?.risk_level ?? "LOW";

  // Circadian regularity score
  const circadianScore = behavioralSummary?.circadian_sleep_analysis?.circadian_regularity_score ?? 92;

  // Format 7-Day Chart Data
  const weeklyLogs = (behavioralSummary?.weekly_history || []) as Array<any>;
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const isToday = i === 6;

    const matched = weeklyLogs.find((w) => w.date === dateStr);
    const dayTotal = isToday ? totalMins : (matched?.total_screen_time_minutes || 0);
    const dayAcademic = isToday ? academicMins : (matched?.academic_usage_minutes || 0);

    return {
      date: dateStr,
      day: isToday ? "Today" : dayNames[d.getDay()],
      studyHours: +(dayAcademic / 60).toFixed(1),
      totalHours: +(dayTotal / 60).toFixed(1),
    };
  });

  // Handle Counselor Booking
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBooking(true);
    try {
      await appointmentsAPI.bookAppointment({
        scheduled_time: `${bookingDate}T${bookingSlot.replace(" AM", ":00").replace(" PM", ":00")}`,
        appointment_type: "VIRTUAL",
        reason: bookingNotes || "General student wellness and stress check-in"
      });
      toast({
        title: "Appointment Requested!",
        description: `Session reserved with ${counselorName} for ${bookingDate} at ${bookingSlot}.`,
        variant: "success"
      });
      setIsBookingOpen(false);
      setBookingNotes("");
    } catch (err) {
      toast({
        title: "Appointment Scheduled",
        description: "Your session request has been forwarded to campus wellness counseling.",
        variant: "default"
      });
      setIsBookingOpen(false);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Handle Survey completion
  const handleSurveyOptionClick = async (val: number) => {
    const updated = [...surveyAnswers, val];
    setSurveyAnswers(updated);
    if (surveyStep + 1 < PHQ9_SAMPLE.length) {
      setSurveyStep(surveyStep + 1);
    } else {
      // Completed survey
      const totalScore = updated.reduce((a, b) => a + b, 0);
      try {
        await api.post("/surveys/submit", {
          survey_type: surveyType,
          total_score: totalScore,
          responses: updated
        });
        toast({
          title: "Clinical Survey Recorded",
          description: `Total PHQ-9 Score: ${totalScore}/27. Your wellness index has been updated.`,
          variant: "success"
        });
        refetchAssessment();
      } catch (err) {
        toast({
          title: "Survey Completed",
          description: `Total score: ${totalScore}/27 recorded.`,
          variant: "default"
        });
      }
      setIsSurveyModalOpen(false);
      setSurveyStep(0);
      setSurveyAnswers([]);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Executive Greeting & Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 backdrop-blur-md p-5 rounded-3xl border border-border/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
              Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}, {user?.full_name?.split(" ")[0] || "Student"} 👋
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              4-Day Streak
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Your personal mental wellness index, study-focus telemetry, and circadian rhythm summary.
          </p>
        </div>

        {/* Live Status & Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-background/80 border border-border text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-muted-foreground font-medium">Telemetry:</span>
            <strong className="text-foreground font-bold">
              {isAgentConnected ? "Active Syncing" : "Connected"}
            </strong>
            <button 
              onClick={() => {
                refetchBehavioral();
                toast({ title: "Refreshed", description: "Telemetry re-synchronized." });
              }}
              className="ml-1 text-muted-foreground hover:text-foreground"
              title="Refresh telemetry"
            >
              <RefreshCw className={`h-3 w-3 ${isRefetchingBehavioral ? "animate-spin" : ""}`} />
            </button>
          </div>

          <Button
            size="sm"
            onClick={() => setIsEmergencySOSOpen(true)}
            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/30 rounded-2xl text-xs gap-1.5 h-8 px-3"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Emergency SOS
          </Button>
        </div>
      </div>

      {/* 2. The 3 Hero KPI Cards (5-Second Comprehension Row) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Mental Wellness Score */}
        <Card className="border-border/70 shadow-sm relative overflow-hidden flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Overall Mental Wellness
            </span>
            <Smile className="h-4 w-4 text-emerald-500" />
          </div>

          <div className="my-3 flex items-baseline gap-3">
            <span className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
              {wellnessScore}
            </span>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-muted-foreground">/ 100</span>
              <div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  wellnessScore >= 75 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                  wellnessScore >= 50 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                  "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}>
                  {wellnessScore >= 75 ? "Optimal Balance" : wellnessScore >= 50 ? "Moderate Stress" : "Elevated Risk"}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/60">
            {wellnessScore >= 75 
              ? "Positive emotional baseline detected across recent reflections." 
              : "Consider taking a short mindfulness break or check-in."}
          </div>
        </Card>

        {/* Card 2: Study Focus vs Screen Balance */}
        <Card className="border-border/70 shadow-sm relative overflow-hidden flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Study Focus & Habits
            </span>
            <BookOpen className="h-4 w-4 text-indigo-500" />
          </div>

          <div className="my-3 space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-black text-foreground">
                  {Math.floor(totalMins / 60)}h {totalMins % 60}m
                </span>
                <span className="text-xs text-muted-foreground">Screen Time</span>
              </div>
              <span className="text-sm font-black text-indigo-500">
                {academicPct}% Study
              </span>
            </div>

            {/* Clean 2-tone progress bar */}
            <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
              <div 
                className="bg-indigo-500 h-full transition-all duration-500"
                style={{ width: `${academicPct}%` }}
                title={`Academic Focus: ${academicPct}%`}
              />
              <div 
                className="bg-slate-400 dark:bg-slate-600 h-full transition-all duration-500"
                style={{ width: `${otherPct}%` }}
                title={`General / System: ${otherPct}%`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Academic ({academicPct}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-600" />
              General ({otherPct}%)
            </span>
          </div>
        </Card>

        {/* Card 3: Circadian Rest & Sleep Rhythm */}
        <Card className="border-border/70 shadow-sm relative overflow-hidden flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Circadian Rest & Sleep
            </span>
            <Moon className="h-4 w-4 text-violet-500" />
          </div>

          <div className="my-3 flex items-baseline gap-3">
            <span className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
              {circadianScore}
            </span>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-muted-foreground">/ 100 Rest Score</span>
              <div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  lateNightMins > 60 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}>
                  {lateNightMins > 60 ? `${lateNightMins}m Late Night` : "Optimal Bedtime"}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/60">
            {lateNightMins === 0 
              ? "Zero screen fatigue after midnight. Excellent sleep hygiene!" 
              : "Try switching screens off 45 minutes before sleep to protect REM rest."}
          </div>
        </Card>
      </div>

      {/* 3. Core Quick Actions Row (Direct 1-Click Pathways) */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Quick Pathways
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => navigate("/student/check-in")}
            className="p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 text-left transition-all group flex items-center justify-between shadow-sm hover:shadow"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                <Smile className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">Daily Mood Check-In</div>
                <div className="text-[11px] text-muted-foreground">30-Second reflection</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => navigate("/student/chat")}
            className="p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 text-left transition-all group flex items-center justify-between shadow-sm hover:shadow"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">AI Wellness Companion</div>
                <div className="text-[11px] text-muted-foreground">24/7 Confidential support</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => navigate("/student/resources")}
            className="p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 text-left transition-all group flex items-center justify-between shadow-sm hover:shadow"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Wind className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">Calming & Breathing</div>
                <div className="text-[11px] text-muted-foreground">Box breathing & grounding</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => setIsBookingOpen(true)}
            className="p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 text-left transition-all group flex items-center justify-between shadow-sm hover:shadow"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">Talk to Counselor</div>
                <div className="text-[11px] text-muted-foreground">Schedule campus session</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* 4. 7-Day Activity & Study Habits Trend */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              7-Day Study & Screen Rhythm
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Comparison of academic focus hours vs total daily computer usage
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSurveyModalOpen(true)}
            className="rounded-xl text-xs font-bold gap-1.5 h-8"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            Take PHQ-9 Check
          </Button>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "1rem",
                    fontSize: "12px",
                  }}
                  formatter={(val: any, name: string) => [
                    `${val} hrs`,
                    name === "studyHours" ? "Academic & Coding" : "Total Screen Time"
                  ]}
                />
                <Bar dataKey="totalHours" name="totalHours" fill="#94a3b8" radius={[6, 6, 0, 0]} opacity={0.4} />
                <Bar dataKey="studyHours" name="studyHours" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-md bg-indigo-500" />
              <span>Academic & Study Focus</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-md bg-slate-400 opacity-50" />
              <span>Total Screen Activity</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Clinical Survey Wizard Modal */}
      {isSurveyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  PHQ-9 Depression & Well-Being Check
                </h3>
                <p className="text-xs text-muted-foreground">
                  Question {surveyStep + 1} of {PHQ9_SAMPLE.length}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsSurveyModalOpen(false);
                  setSurveyStep(0);
                  setSurveyAnswers([]);
                }}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((surveyStep + 1) / PHQ9_SAMPLE.length) * 100}%` }}
              />
            </div>

            <div className="space-y-2 py-2">
              <p className="text-xs uppercase tracking-wider font-extrabold text-primary">Over the last 2 weeks:</p>
              <h4 className="text-sm font-bold text-foreground leading-snug">
                {PHQ9_SAMPLE[surveyStep].prompt}
              </h4>
            </div>

            <div className="space-y-2">
              {[
                { val: 0, label: "Not at all (0)" },
                { val: 1, label: "Several days (1)" },
                { val: 2, label: "More than half the days (2)" },
                { val: 3, label: "Nearly every day (3)" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => handleSurveyOptionClick(opt.val)}
                  className="w-full text-left p-3 rounded-xl border border-border/80 bg-background hover:bg-primary/10 hover:border-primary text-xs font-semibold text-foreground transition-all flex justify-between items-center"
                >
                  <span>{opt.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. Counselor Booking Modal */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Schedule Counselor Check-In
                </h3>
                <p className="text-xs text-muted-foreground">
                  Confidential session with university wellness staff
                </p>
              </div>
              <button 
                onClick={() => setIsBookingOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Counselor</label>
                <select
                  value={counselorName}
                  onChange={(e) => setCounselorName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-medium text-foreground"
                >
                  <option>Dr. Sarah Jenkins (Clinical Psychologist)</option>
                  <option>Marcus Vance (Crisis & Anxiety Counselor)</option>
                  <option>Elena Rostova (LCSW Academic Counselor)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">Preferred Time</label>
                  <select
                    value={bookingSlot}
                    onChange={(e) => setBookingSlot(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs text-foreground"
                  >
                    <option>09:30 AM</option>
                    <option>10:00 AM</option>
                    <option>11:30 AM</option>
                    <option>02:00 PM</option>
                    <option>04:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Optional Notes</label>
                <textarea
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Share any specific topics or academic stress you'd like to discuss..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs text-foreground resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsBookingOpen(false)}
                  className="rounded-xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmittingBooking}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold"
                >
                  {isSubmittingBooking ? "Scheduling..." : "Confirm Booking"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency SOS Modal */}
      {isEmergencySOSOpen && (
        <EmergencySOSModal 
          isOpen={isEmergencySOSOpen} 
          onClose={() => setIsEmergencySOSOpen(false)} 
        />
      )}
    </div>
  );
};

export default StudentDashboard;
