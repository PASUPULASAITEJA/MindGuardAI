import React, { useState } from "react";
import { useLocation, NavLink, useNavigate } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useLatestAssessment } from "@/hooks/usePredictions";
import { useCurrentRecommendations } from "@/hooks/useRecommendations";
import { useMoodHistory, useSubmitJournal } from "@/hooks/useMood";
import { useToast } from "@/components/ui/toast";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid
} from "recharts";
import { 
  Sparkles, Heart, Check, ClipboardCheck, Activity,
  Laptop, Moon, Clock, RefreshCw, Zap, Calendar, FileDown, Cpu, 
  Wind, CheckCircle2, ChevronRight, ShieldCheck, Flame, AlertTriangle, 
  MessageSquare, BookOpen, Video, Mic, MicOff, Smile, TrendingUp, Sun
} from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useScreenTimeTracker } from "@/hooks/useScreenTimeTracker";
import { classifyMentalWellness } from "@/utils/wellness";
import { ExplainableAIFactors } from "@/components/ExplainableAIFactors";
import { HabitRecoverySimulator } from "@/components/HabitRecoverySimulator";
import { ClinicalDossierModal } from "@/components/ClinicalDossierModal";
import { ModelBenchmarksModal } from "@/components/ModelBenchmarksModal";
import { EmergencySOSModal } from "@/components/EmergencySOSModal";
import { ClinicalSurveyModal } from "@/components/ClinicalSurveyModal";
import { BoxBreathingModal } from "@/components/BoxBreathingModal";
import { CounselorBookingModal } from "@/components/CounselorBookingModal";

// Tactile 5-tier mood weather board
const MOOD_WEATHER = [
  { score: 5, label: "Radiant", icon: "☀️", description: "Energized & Joyful", color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
  { score: 4, label: "Good", icon: "🌤️", description: "Calm & Grounded", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
  { score: 3, label: "Okay", icon: "⛅", description: "Navigating the Day", color: "text-blue-500 bg-blue-500/10 border-blue-500/30" },
  { score: 2, label: "Low", icon: "🌧️", description: "Stressed or Tired", color: "text-purple-500 bg-purple-500/10 border-purple-500/30" },
  { score: 1, label: "Overwhelmed", icon: "⛈️", description: "Seeking Gentle Care", color: "text-rose-500 bg-rose-500/10 border-rose-500/30" },
];

export const StudentDashboard: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  // Real-time local screen telemetry hook
  useScreenTimeTracker();

  // Primary Modal States
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isBenchmarksOpen, setIsBenchmarksOpen] = useState(false);
  const [isBreathModalOpen, setIsBreathModalOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [activeSurvey, setActiveSurvey] = useState<"phq-9" | "gad-7" | null>(null);

  // Active Bottom Tab
  const [activeTab, setActiveTab] = useState<"history" | "phenotyping" | "ai-science" | "mindfulness">("history");

  // Daily Check-In Form State
  const [journalText, setJournalText] = useState("");
  const [selectedMoodScore, setSelectedMoodScore] = useState<number | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [companionAffirmation, setCompanionAffirmation] = useState<string | null>(null);

  // Daily Mindful Habits (stored in localStorage per day)
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const HABITS_STORAGE_KEY = `mindguard_daily_habits_${todayDateStr}`;
  const defaultHabits = [
    { id: "water", label: "Mindful Hydration", icon: "💧", description: "Drank 500ml fresh water", completed: false },
    { id: "breathe", label: "2-Min Breath Break", icon: "🫁", description: "Paused to center your nervous system", completed: false },
    { id: "walk", label: "Screen-Free Walk", icon: "🚶", description: "Took a 10-min fresh air stroll", completed: false },
    { id: "gratitude", label: "Daily Reflection", icon: "✍️", description: "Noted 1 positive moment or thought", completed: false },
  ];

  const [habits, setHabits] = useState(() => {
    try {
      const saved = localStorage.getItem(HABITS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultHabits;
  });

  const toggleHabit = (id: string) => {
    setHabits((prev: typeof defaultHabits) => {
      const updated = prev.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h));
      try {
        localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const completedHabitsCount = habits.filter((h: any) => h.completed).length;
  const habitPercentage = Math.round((completedHabitsCount / habits.length) * 100);

  // Queries
  const { data: assessment, isLoading: isAssessmentLoading } = useLatestAssessment();
  const { data: recData } = useCurrentRecommendations();
  const recommendations = recData?.activities || [];
  const { data: moodHistory = [], isLoading: isHistoryLoading } = useMoodHistory("7d");
  const submitJournalMutation = useSubmitJournal();

  // Behavioral digital phenotyping summary
  const { data: behavioralSummary, refetch: refetchBehavioral } = useQuery({
    queryKey: ["behavioral-summary"],
    queryFn: async () => {
      const res = await api.get("/chat/behavioral-summary");
      return res.data;
    },
    refetchInterval: 15000,
  });

  // Calculate Mental Wellness Metrics
  const hasAssessment = !!assessment;
  const rawScore = hasAssessment ? Number(assessment.mental_wellness_score ?? 0) : 0;
  const wellnessScore = Math.min(100, Math.max(0, rawScore));
  const formattedScore = hasAssessment ? wellnessScore.toFixed(0) : "--";
  const classification = classifyMentalWellness(wellnessScore);

  // Telemetry Metrics
  const log = behavioralSummary?.latest_log;
  const totalMins = log?.total_screen_time_minutes || 0;
  const lateNightMins = log?.late_night_usage_minutes || 0;
  const academicMins = log?.academic_usage_minutes || 0;
  const socialMins = log?.social_usage_minutes || 0;
  const entertainmentMins = log?.entertainment_usage_minutes || 0;
  const isAgentConnected = behavioralSummary?.is_agent_connected;
  const circadianAnalysis = behavioralSummary?.circadian_sleep_analysis;

  // Formatted screen time
  const formatMins = (m: number) => {
    const hrs = Math.floor(m / 60);
    const mins = m % 60;
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  const rawCatSum = academicMins + socialMins + entertainmentMins;
  const catBase = Math.max(totalMins, rawCatSum, 1);
  const academicPct = Math.min(100, Math.round((academicMins / catBase) * 100));
  const entertainmentPct = Math.min(100 - academicPct, Math.round((entertainmentMins / catBase) * 100));
  const socialPct = Math.min(100 - academicPct - entertainmentPct, Math.round((socialMins / catBase) * 100));
  const otherPct = Math.max(0, 100 - academicPct - entertainmentPct - socialPct);

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };
  const displayName = user?.full_name || (user?.email ? user.email.split("@")[0] : "Student");

  // Handle Mood Selection
  const handleMoodSelect = (item: typeof MOOD_WEATHER[0]) => {
    setSelectedMoodScore(item.score);
    const affirmations = [
      "Honoring your feelings is the first step toward balance.",
      "Take gentle breaths today; you are doing your best.",
      "A steady, calm pace will carry you through your day.",
      "Wonderful! Channel your bright energy into what you love.",
      "Embrace your joy today and share a smile with someone."
    ];
    setCompanionAffirmation(affirmations[item.score - 1]);
  };

  // Voice recording toggle using Web Speech API
  const handleVoiceToggle = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Speech Recognition Unavailable",
        description: "Your browser does not support voice input. Please type your reflection.",
        variant: "destructive"
      });
      return;
    }

    if (!isRecordingVoice) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
          setIsRecordingVoice(true);
          toast({
            title: "Listening...",
            description: "Speak your thoughts naturally.",
            variant: "default"
          });
        };

        recognition.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript;
          setJournalText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsRecordingVoice(false);
          toast({
            title: "Speech Transcribed",
            description: "Your reflection has been added to the text box.",
            variant: "success"
          });
        };

        recognition.onerror = () => {
          setIsRecordingVoice(false);
        };

        recognition.onend = () => {
          setIsRecordingVoice(false);
        };

        recognition.start();
      } catch (err) {
        setIsRecordingVoice(false);
      }
    } else {
      setIsRecordingVoice(false);
    }
  };

  // Submit Check-In
  const handleSubmitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalText.trim() && !selectedMoodScore) {
      toast({
        title: "Share a Mood or Reflection",
        description: "Please select a mood icon or write a brief note.",
        variant: "destructive"
      });
      return;
    }

    try {
      await submitJournalMutation.mutateAsync({
        content: journalText.trim() || `Daily mood checked in: ${selectedMoodScore}/5`,
        self_reported_score: selectedMoodScore || undefined
      });

      toast({
        title: "Check-In Recorded",
        description: "Your reflection was analyzed and your wellness score updated.",
        variant: "success"
      });

      setJournalText("");
      setSelectedMoodScore(null);
      queryClient.invalidateQueries({ queryKey: ["mood-history"] });
      queryClient.invalidateQueries({ queryKey: ["latest-assessment"] });
    } catch (err) {
      toast({
        title: "Submission Error",
        description: "Unable to save your check-in. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Mood chart sparkline data
  const chartData = [...moodHistory].reverse().map((m: any) => ({
    date: new Date(m.created_at).toLocaleDateString(undefined, { weekday: "short" }),
    score: m.self_reported_score || (m.nlp_sentiment_scaled ? Math.round(m.nlp_sentiment_scaled) : 7)
  }));

  // Recharts dial dataset
  const dialData = [
    { name: "score", value: hasAssessment ? wellnessScore : 100 },
    { name: "remainder", value: hasAssessment ? (100 - wellnessScore) : 0 }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP SANCTUARY HERO & INSTANT STATUS */}
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-primary/5 p-6 md:p-8 shadow-sm">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                <Sparkles className="h-3.5 w-3.5" />
                Student Wellness Sanctuary • Private & Encrypted
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Telemetry Synced
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {getGreeting()}, <span className="capitalize text-primary">{displayName}</span> ✨
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              Take a slow, deep breath. MindGuardAI is quietly monitoring your study rhythm and wellness in the background.
            </p>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              onClick={() => {
                document.getElementById("daily-checkin-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 flex items-center gap-2"
            >
              <ClipboardCheck className="h-4 w-4" />
              <span>Start Daily Check-In</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/student/chat")}
              className="h-10 px-3.5 rounded-xl border-border/80 bg-card/60 hover:bg-card text-foreground font-bold text-xs flex items-center gap-1.5"
            >
              <MessageSquare className="h-4 w-4 text-primary" />
              <span>AI Companion</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSOSOpen(true)}
              className="h-10 px-3 rounded-xl border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5"
              title="24/7 Immediate Help"
            >
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              <span>SOS Help</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. THE 3-SECOND GLANCEABLE STATUS TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Mental Wellness Score */}
        <Card className="rounded-2xl border border-border/70 shadow-xs hover:border-primary/40 transition-all">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Wellness Index
              </span>
              <Activity className="h-4 w-4 text-primary" />
            </div>

            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dialData}
                      cx="50%"
                      cy="50%"
                      innerRadius={22}
                      outerRadius={28}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      <Cell fill={classification.color} />
                      <Cell fill={theme === "dark" ? "#1e293b" : "#e2e8f0"} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <span className="absolute text-base font-black text-foreground">{formattedScore}</span>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-foreground">{formattedScore}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
                <span className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full mt-0.5 ${classification.badgeClass}`}>
                  {classification.label}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-snug">
              {classification.recommendation}
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Mood & Emotional Vibe */}
        <Card className="rounded-2xl border border-border/70 shadow-xs hover:border-primary/40 transition-all">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Emotional Vibe
              </span>
              <Smile className="h-4 w-4 text-amber-500" />
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {assessment?.emotions_detected?.joy && assessment.emotions_detected.joy > 0.4
                    ? "Joyful & Calm"
                    : assessment?.risk_level === "HIGH"
                    ? "Elevated Stress"
                    : "Focused & Stable"}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">Based on recent reflections</span>
            </div>

            <div className="h-10 w-full pt-1">
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-amber-500" /> Check in daily to map trends
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Academic & Screen Balance */}
        <Card className="rounded-2xl border border-border/70 shadow-xs hover:border-primary/40 transition-all">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Screen & Study Focus
              </span>
              <Laptop className="h-4 w-4 text-indigo-500" />
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">{formatMins(totalMins)}</span>
                <span className="text-xs text-muted-foreground">active today</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                {academicPct}% Academic & Coding
              </span>
            </div>

            {/* Visual Balance Bar */}
            <div className="space-y-1">
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden flex">
                <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${academicPct}%` }} title={`Academic: ${academicPct}%`} />
                <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${entertainmentPct}%` }} title={`Entertainment: ${entertainmentPct}%`} />
                <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${socialPct}%` }} title={`Social: ${socialPct}%`} />
                <div className="bg-slate-400 dark:bg-slate-600 h-full transition-all duration-500" style={{ width: `${otherPct}%` }} title={`General: ${otherPct}%`} />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                <span>Coursework Focus</span>
                <span>{academicPct}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Sleep & Circadian Rest */}
        <Card className="rounded-2xl border border-border/70 shadow-xs hover:border-primary/40 transition-all">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Circadian & Sleep
              </span>
              <Moon className="h-4 w-4 text-violet-500" />
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black ${lateNightMins > 60 ? "text-rose-500" : "text-foreground"}`}>
                  {lateNightMins > 0 ? `${lateNightMins}m` : "0m"}
                </span>
                <span className="text-xs text-muted-foreground">after midnight</span>
              </div>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold mt-0.5 ${lateNightMins === 0 ? "text-emerald-500" : "text-amber-500"}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {lateNightMins === 0 ? "Optimal Sleep Rhythm" : "Late-Night Screen Use"}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
              <span>Rest Regularity Score:</span>
              <span className="font-bold text-foreground">{circadianAnalysis?.circadian_regularity_score || 92}/100</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. DAILY CHECK-IN & MINDFUL HABITS (UNIFIED 2-COLUMN) */}
      <div id="daily-checkin-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Daily Check-in */}
        <div className="lg:col-span-2">
          <Card className="rounded-3xl border border-border/80 shadow-sm p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-500" />
                  Daily Emotional Check-In
                </h3>
                <span className="text-xs font-bold text-muted-foreground">Encrypted & Confidential</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                How is your inner weather right now? Pick your mood or write a brief reflection.
              </p>
            </div>

            {/* 5 Tactile Mood Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {MOOD_WEATHER.map((item) => {
                const isSelected = selectedMoodScore === item.score;
                return (
                  <button
                    key={item.score}
                    type="button"
                    onClick={() => handleMoodSelect(item)}
                    className={`group relative flex flex-col items-center p-3 rounded-2xl border transition-all duration-200 active:scale-95 text-center ${
                      isSelected
                        ? `${item.color} shadow-md scale-[1.02] font-black ring-1 ring-primary`
                        : "bg-card/70 hover:bg-card border-border/70 hover:border-primary/40 text-foreground"
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl mb-1 transition-transform group-hover:scale-125">
                      {item.icon}
                    </span>
                    <span className="text-xs font-bold">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{item.description}</span>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Affirmation Toast if selected */}
            {companionAffirmation && (
              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-2 text-xs font-semibold text-foreground">
                <span>🌿</span>
                <span>{companionAffirmation}</span>
              </div>
            )}

            {/* Journal Input & Submit */}
            <form onSubmit={handleSubmitCheckIn} className="space-y-3 pt-1">
              <div className="relative">
                <textarea
                  rows={3}
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value)}
                  placeholder="What's on your mind today? (e.g., Coursework, relationships, hopes, or stress...)"
                  className="w-full rounded-2xl border border-border/80 bg-background/50 p-3.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none placeholder:text-muted-foreground/60"
                />
                
                {/* Voice button in textarea */}
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  className={`absolute right-3 bottom-3.5 p-2 rounded-xl border transition-all ${
                    isRecordingVoice
                      ? "bg-rose-500 text-white animate-pulse border-rose-500"
                      : "bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border-border/70"
                  }`}
                  title={isRecordingVoice ? "Stop Recording" : "Speak your thoughts"}
                >
                  {isRecordingVoice ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  Your entry is private and never shared with professors.
                </span>

                <Button
                  type="submit"
                  disabled={submitJournalMutation.isPending}
                  className="h-9 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md transition-all"
                >
                  {submitJournalMutation.isPending ? "Recording..." : "Log Daily Check-In"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column (1 Col): Mindful Self-Care Habits */}
        <div className="lg:col-span-1">
          <Card className="rounded-3xl border border-border/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Daily Gentle Habits
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Simple, grounding practices</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {completedHabitsCount}/{habits.length}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${habitPercentage}%` }}
              />
            </div>

            {/* Habit Items */}
            <div className="space-y-2.5 pt-1">
              {habits.map((habit: any) => (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => toggleHabit(habit.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                    habit.completed
                      ? "bg-emerald-500/5 border-emerald-500/30 text-foreground line-through opacity-85"
                      : "bg-card hover:bg-secondary/40 border-border/70 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-4 w-4 rounded-md flex items-center justify-center border transition-colors ${
                        habit.completed
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-muted-foreground/40 bg-card"
                      }`}
                    >
                      {habit.completed && <Check className="h-3 w-3" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{habit.icon} {habit.label}</span>
                      <span className="text-[10px] text-muted-foreground block">{habit.description}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {habitPercentage === 100 && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center text-xs font-bold text-amber-600 dark:text-amber-400">
                🎉 Wonderful! You completed all mindful habits today.
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* 4. INSTANT COPING & SUPPORT ACTION CARDS (4 TILES) */}
      <div className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
          Instant Calming & Care Tools
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tile 1: Box Breathing */}
          <button
            type="button"
            onClick={() => setIsBreathModalOpen(true)}
            className="group flex flex-col justify-between p-5 rounded-2xl border border-border/70 bg-card hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-left"
          >
            <div className="flex items-center justify-between w-full">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Wind className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-bold text-foreground">Box Breathing Pacer</h4>
              <p className="text-xs text-muted-foreground mt-0.5">4-4-4-4 rhythm for rapid calm</p>
            </div>
          </button>

          {/* Tile 2: AI Companion Chat */}
          <NavLink
            to="/student/chat"
            className="group flex flex-col justify-between p-5 rounded-2xl border border-border/70 bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
          >
            <div className="flex items-center justify-between w-full">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-bold text-foreground">AI Companion Chat</h4>
              <p className="text-xs text-muted-foreground mt-0.5">24/7 empathetic, safe venting</p>
            </div>
          </NavLink>

          {/* Tile 3: Book Counselor */}
          <button
            type="button"
            onClick={() => setIsBookingOpen(true)}
            className="group flex flex-col justify-between p-5 rounded-2xl border border-border/70 bg-card hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all text-left"
          >
            <div className="flex items-center justify-between w-full">
              <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Calendar className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-bold text-foreground">Book Campus Counselor</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Confidential 1-on-1 session</p>
            </div>
          </button>

          {/* Tile 4: Clinical Screener */}
          <button
            type="button"
            onClick={() => setActiveSurvey("phq-9")}
            className="group flex flex-col justify-between p-5 rounded-2xl border border-border/70 bg-card hover:border-violet-500/40 hover:bg-violet-500/5 transition-all text-left"
          >
            <div className="flex items-center justify-between w-full">
              <div className="h-10 w-10 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-bold text-foreground">Clinical Screener</h4>
              <p className="text-xs text-muted-foreground mt-0.5">PHQ-9 & GAD-7 assessment</p>
            </div>
          </button>
        </div>
      </div>

      {/* 5. DEEP-DIVE TABS (HISTORY, PHENOTYPING, SCIENCE, LIBRARY) */}
      <div className="space-y-4 pt-4">
        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-secondary/70 border border-border/70 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                activeTab === "history"
                  ? "bg-card text-foreground shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Reflection History
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("phenotyping")}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                activeTab === "phenotyping"
                  ? "bg-card text-foreground shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Screen Telemetry
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ai-science")}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                activeTab === "ai-science"
                  ? "bg-card text-foreground shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              AI Explainability
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("mindfulness")}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                activeTab === "mindfulness"
                  ? "bg-card text-foreground shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Self-Care Library
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsDossierOpen(true)}
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs font-bold border-border/80 rounded-xl"
            >
              <FileDown className="h-3.5 w-3.5 mr-1.5 text-primary" />
              Clinical Dossier
            </Button>
            <Button
              onClick={() => setIsBenchmarksOpen(true)}
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs font-bold border-border/80 rounded-xl"
            >
              <Cpu className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
              ML Benchmarks
            </Button>
          </div>
        </div>

        {/* Tab 1: Reflection History */}
        {activeTab === "history" && (
          <Card className="rounded-3xl border border-border/80 shadow-sm p-6">
            <h4 className="text-sm font-bold text-foreground mb-4">Recent Daily Logs & Mood Notes</h4>
            {moodHistory.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-xs">
                No check-ins logged yet. Log your first check-in above to begin tracking!
              </div>
            ) : (
              <div className="space-y-3">
                {moodHistory.slice(0, 5).map((entry: any, i: number) => {
                  const dateStr = new Date(entry.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  });
                  return (
                    <div
                      key={entry.id || i}
                      className="p-3.5 rounded-2xl border border-border/60 bg-card/60 hover:bg-card transition-all flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">{dateStr}</span>
                          {entry.self_reported_score && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                              Mood {entry.self_reported_score}/5
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 italic">
                          "{entry.content}"
                        </p>
                      </div>
                      <span className="text-xs font-black text-foreground shrink-0">
                        {entry.nlp_sentiment_scaled ? `${Math.round(entry.nlp_sentiment_scaled)}/10` : "Logged"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* Tab 2: Screen Telemetry Details */}
        {activeTab === "phenotyping" && (
          <Card className="rounded-3xl border border-border/80 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-foreground">Continuous Digital Telemetry</h4>
                <p className="text-xs text-muted-foreground">Logged automatically by MindGuard PC Agent</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchBehavioral()}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Telemetry Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Academic & Coding</span>
                <p className="text-xl font-black text-indigo-500">{formatMins(academicMins)}</p>
                <span className="text-[10px] text-muted-foreground">{academicPct}% of daily active session</span>
              </div>
              <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Circadian (12AM-5AM)</span>
                <p className={`text-xl font-black ${lateNightMins > 60 ? "text-rose-500" : "text-foreground"}`}>
                  {formatMins(lateNightMins)}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  {lateNightMins === 0 ? "Zero late-night fatigue" : "Late-night screen use noted"}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Total Active Time</span>
                <p className="text-xl font-black text-foreground">{formatMins(totalMins)}</p>
                <span className="text-[10px] text-muted-foreground">Today's total computer usage</span>
              </div>
            </div>
          </Card>
        )}

        {/* Tab 3: AI Explainability */}
        {activeTab === "ai-science" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExplainableAIFactors
              wellnessScore={wellnessScore}
              riskLevel={assessment?.risk_level || "LOW"}
              lateNightMins={lateNightMins}
              totalScreenMins={totalMins}
              sentimentScore={0.2}
              hasAssessment={hasAssessment}
            />
            <HabitRecoverySimulator currentScore={wellnessScore || 50} />
          </div>
        )}

        {/* Tab 4: Self-Care Library */}
        {activeTab === "mindfulness" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recommendations.slice(0, 6).map((rec: any, idx: number) => (
              <Card key={rec.id || idx} className="rounded-2xl border border-border/70 p-4 space-y-2 hover:border-primary/40 transition-all">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {rec.activity_type || "MINDFULNESS"}
                  </span>
                </div>
                <h5 className="text-xs font-bold text-foreground leading-snug">{rec.title}</h5>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{rec.description}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ALL INTERACTIVE MODALS */}
      <BoxBreathingModal
        isOpen={isBreathModalOpen}
        onClose={() => setIsBreathModalOpen(false)}
      />

      <CounselorBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />

      <ClinicalSurveyModal
        surveyType={activeSurvey}
        isOpen={!!activeSurvey}
        onClose={() => setActiveSurvey(null)}
      />

      <ClinicalDossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        studentName={user?.email ? user.email.split("@")[0].toUpperCase() : "ENROLLED STUDENT"}
        studentEmail={user?.email || "student@institution.edu"}
        wellnessScore={wellnessScore}
        riskLevel={assessment?.risk_level || "LOW"}
        lateNightMins={lateNightMins}
        totalScreenMins={totalMins}
        sentimentScore={0.2}
      />

      <ModelBenchmarksModal
        isOpen={isBenchmarksOpen}
        onClose={() => setIsBenchmarksOpen(false)}
      />

      <EmergencySOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
      />
    </div>
  );
};

export default StudentDashboard;
