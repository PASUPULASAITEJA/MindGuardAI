import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Brain,
  Shield,
  Activity,
  HeartHandshake,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  Lock,
  Clock,
  MessageSquare,
  PhoneCall,
  CheckCircle2,
  Users,
  Compass,
  Zap,
  GraduationCap,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Laptop,
  Check,
  Play,
  Pause,
  RotateCcw,
  Smile,
  AlertTriangle,
  Building2,
  HelpCircle,
  ShieldCheck,
  Heart,
  Wind,
  Sliders,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Active platform preview tab: "student" | "counselor" | "institution"
  const [activeTab, setActiveTab] = useState<"student" | "counselor" | "institution">("student");

  // Interactive mood demonstration state in preview
  const [demoMood, setDemoMood] = useState<number>(4);

  // Interactive Mini Breath Widget
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale">("Inhale");
  const [breathSeconds, setBreathSeconds] = useState(4);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isBreathing) {
      interval = setInterval(() => {
        setBreathSeconds((prev) => {
          if (prev <= 1) {
            setBreathPhase((current) => {
              if (current === "Inhale") return "Hold";
              if (current === "Hold") return "Exhale";
              return "Inhale";
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBreathPhase("Inhale");
      setBreathSeconds(4);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBreathing]);

  const faqs = [
    {
      q: "Are student journal reflections and chatbot chats kept private?",
      a: "Yes, 100% confidential. All personal reflections, feelings, and chatbot conversations are encrypted and strictly private to the student. Campus administrators only view anonymized, aggregated population trends to improve campus resources."
    },
    {
      q: "Does the MindGuard PC Agent monitor keystrokes or camera pixels?",
      a: "Never. The background agent strictly reads high-level application categories (e.g. VS Code = Study, YouTube = Entertainment) and idle timestamps to calculate circadian sleep health and screen time harmony. Zero private content is recorded."
    },
    {
      q: "How does the Counselor Alert & Triage mechanism work?",
      a: "If clinical assessments (PHQ-9 / GAD-7) or prolonged late-night distress indicate severe strain, the platform automatically flags an intervention recommendation for campus counselors, ensuring timely, compassionate care."
    },
    {
      q: "What happens during a 1-Click Emergency SOS trigger?",
      a: "The system immediately offers one-tap access to 24/7 verified crisis helplines (such as Tele-MANAS 14416 and KIRAN 1800-599-0019) while offering the option to notify on-duty campus counseling staff with high priority."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 transition-colors duration-300 flex flex-col font-sans relative overflow-x-hidden">
      {/* Soft Ambient Background Elements */}
      <div className="fixed inset-0 pointer-none -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 -left-40 w-[600px] h-[500px] bg-indigo-500/5 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f293d_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* 1. TOP NAVIGATION */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-card/80 border-b border-border/70 transition-all shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-emerald-500 p-0.5 shadow-md shadow-primary/20 flex items-center justify-center transition-transform group-hover:scale-105">
              <div className="w-full h-full rounded-[14px] bg-card flex items-center justify-center overflow-hidden">
                <img src="/favicon.jpg" alt="MindGuardAI Logo" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-foreground">
                  MindGuard<span className="text-primary">AI</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Operational" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Student Wellness & Care
              </p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Pillars of Care</a>
            <a href="#platform-preview" className="hover:text-primary transition-colors">Platform Hub</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a>
            <a href="#privacy" className="hover:text-primary transition-colors">Privacy Promise</a>
            <a href="#helplines" className="hover:text-rose-500 transition-colors flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Crisis Helplines
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2.5 rounded-xl border border-border/80 bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition shadow-xs"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-border/80 bg-card hover:bg-accent text-foreground transition shadow-xs"
            >
              Sign In
            </Link>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-4.5 py-2 text-xs font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span>Next-Generation Student Mental Health & Early Care Platform</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.12] mb-6">
            Compassionate Care for Every Student's{" "}
            <span className="bg-gradient-to-r from-primary via-indigo-500 to-emerald-500 bg-clip-text text-transparent">
              Mind, Sleep & Spirit
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
            MindGuardAI unifies daily emotional check-ins, healthy digital study habits, and clinical triage—giving university students a private space to thrive and campus counselors the insights to save lives.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-16">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition active:scale-95"
            >
              <GraduationCap className="w-4.5 h-4.5" />
              <span>Launch Student Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-semibold border border-border/80 bg-card hover:bg-accent text-foreground transition shadow-xs"
            >
              <HeartHandshake className="w-4.5 h-4.5 text-primary" />
              <span>Counselor Console</span>
            </Link>

            <a
              href="#helplines"
              className="inline-flex items-center gap-2 px-4.5 py-3.5 rounded-2xl text-sm font-semibold border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition"
            >
              <PhoneCall className="w-4 h-4 text-rose-500" />
              <span>24/7 Helpline (14416)</span>
            </a>
          </div>

          {/* 3. HERO INTERACTIVE PRODUCT PREVIEW CARD */}
          <div className="max-w-4xl mx-auto rounded-3xl border border-border/80 bg-card/90 backdrop-blur-2xl shadow-xl overflow-hidden text-left transition-all">
            {/* Window Topbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/70 bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-semibold text-muted-foreground ml-2">
                  Student Sanctuary • Real-Time Health & Routine
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Telemetry Active
              </span>
            </div>

            {/* Inner Dashboard Preview Content */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Greeting & Prompt */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/50">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-foreground">
                    Good morning, Sai Teja ✨
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    "How are you feeling today? Take a slow, gentle breath."
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">Today's Check-In:</span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                    Logged 🌟 Thriving
                  </span>
                </div>
              </div>

              {/* 3 Metric Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Score */}
                <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                    <span>Mental Wellness Index</span>
                    <Activity className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-foreground">88.5</span>
                    <span className="text-xs text-muted-foreground">/ 100</span>
                  </div>
                  <div className="mt-2.5 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full w-[88%]" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mt-2">
                    ✓ Optimal Mental Equilibrium
                  </span>
                </div>

                {/* Screen Time */}
                <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                    <span>Study & Screen Time</span>
                    <Laptop className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-foreground">4.5 hrs</span>
                    <span className="text-xs text-muted-foreground">today</span>
                  </div>
                  <div className="mt-2.5 flex gap-1 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full w-[78%]" title="Academic: 78%" />
                    <div className="bg-purple-500 h-full w-[14%]" title="Social: 14%" />
                    <div className="bg-emerald-500 h-full w-[8%]" title="Breaks: 8%" />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block mt-2">
                    ✓ 78% Focused Academic Coursework
                  </span>
                </div>

                {/* Circadian Sleep */}
                <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                    <span>Sleep & Circadian Rhythm</span>
                    <Clock className="w-4 h-4 text-violet-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-foreground">7.8 hrs</span>
                    <span className="text-xs text-muted-foreground">deep rest</span>
                  </div>
                  <div className="mt-2.5 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="bg-violet-500 h-full rounded-full w-[92%]" />
                  </div>
                  <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 block mt-2">
                    ✓ 0m Late-Night Disruption
                  </span>
                </div>
              </div>

              {/* Interactive Mood Demonstration Bar */}
              <div className="p-4.5 rounded-2xl bg-background/50 border border-border/70 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    Interactive Check-In Demo: How is your mind right now?
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Tap a mood to preview response
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { score: 5, emoji: "🌟", label: "Radiant", note: "Glowing with momentum! Keep this positive rhythm." },
                    { score: 4, emoji: "🌿", label: "Calm", note: "Peaceful and grounded. Enjoy this calm focus." },
                    { score: 3, emoji: "☕", label: "Tired", note: "Take a short screen rest and hydrate." },
                    { score: 2, emoji: "🌊", label: "Anxious", note: "Remember to breathe. You don't have to carry it all." },
                    { score: 1, emoji: "🌧️", label: "Heavy", note: "We hear you. Dedicated support is always with you." }
                  ].map((m) => (
                    <button
                      key={m.score}
                      type="button"
                      onClick={() => setDemoMood(m.score)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        demoMood === m.score
                          ? "bg-primary text-primary-foreground border-primary shadow-sm font-bold scale-[1.02]"
                          : "bg-card hover:bg-secondary border-border/70 text-muted-foreground"
                      }`}
                    >
                      <span className="text-lg block mb-0.5">{m.emoji}</span>
                      <span className="text-[11px] block">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PILLARS OF CARE */}
      <section id="features" className="py-20 border-t border-border/60 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Four Pillars of Support
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mt-4">
              Modern Clinical Science Meets Empathetic AI
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mt-3 leading-relaxed">
              Designed specifically for university students navigating academic pressure, deadlines, and emotional hurdles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Continuous Wellness Index</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Standardized PHQ-9 & GAD-7 psychometrics coupled with NLP sentiment mapping to deliver a 0-100 mental wellness index.
              </p>
              <div className="pt-2 text-xs font-bold text-primary flex items-center gap-1">
                <span>Clinical DSM-5 Standard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center">
                <Laptop className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Circadian & Screen Habits</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Zero-spy PC phenotyping detects late-night screen fatigue (12 AM - 5 AM) and study vs. leisure ratios to protect restorative sleep.
              </p>
              <div className="pt-2 text-xs font-bold text-indigo-500 flex items-center gap-1">
                <span>100% Privacy Preserving</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Empathetic AI Companion</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                24/7 conversational support fine-tuned for active listening, cognitive reframing, grounding exercises, and safety triage.
              </p>
              <div className="pt-2 text-xs font-bold text-emerald-500 flex items-center gap-1">
                <span>Safe Non-Judgmental Space</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Counselor Triage Console</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Empowers university psychologists with priority risk queues, longitudinal wellness dossiers, and instant 1-on-1 scheduling.
              </p>
              <div className="pt-2 text-xs font-bold text-rose-500 flex items-center gap-1">
                <span>Early Human Escalation</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE PLATFORM HUB (PORTALS PREVIEW) */}
      <section id="platform-preview" className="py-20 border-t border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Unified Ecosystem
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mt-4">
              Tailored Portals for Every Role
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm mt-2">
              Select an account perspective to explore how MindGuard transforms campus mental health.
            </p>

            {/* Tab Switcher Pills */}
            <div className="inline-flex bg-muted/60 p-1 rounded-2xl border border-border/70 mt-6">
              {[
                { id: "student", label: "Student Sanctuary", icon: GraduationCap },
                { id: "counselor", label: "Counselor Triage", icon: HeartHandshake },
                { id: "institution", label: "Institutional Insights", icon: Building2 }
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-card text-foreground shadow-sm font-extrabold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-primary" : ""}`} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Portal Content Details */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-lg">
            {activeTab === "student" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>For University Students</span>
                  </div>
                  <h3 className="text-2xl font-black text-foreground">
                    A Safe, Stigma-Free Mental Sanctuary
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Check in with your feelings daily via text or voice, track your weekly study balance, explore guided box breathing, and connect with campus counselors when you need support.
                  </p>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Confidential mood journaling with instant sentiment insights</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>7-Day rolling screen time & late-night sleep analysis</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Direct 1-click confidential counselor booking</span>
                    </li>
                  </ul>
                  <div className="pt-3">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 transition"
                    >
                      <span>Explore Student Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-secondary/30 border border-border/60 space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold border-b border-border/50 pb-3">
                    <span className="text-foreground">Student Quick Access Tools</span>
                    <span className="text-emerald-500 font-extrabold">Live Features</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-card border border-border/60 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-xs">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        <span className="font-bold text-foreground">24/7 AI Wellness Companion</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">Active</span>
                    </div>
                    <div className="p-3 rounded-xl bg-card border border-border/60 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-xs">
                        <Wind className="w-4 h-4 text-emerald-500" />
                        <span className="font-bold text-foreground">Guided 4-4-4 Box Breathing</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">Instant Calming</span>
                    </div>
                    <div className="p-3 rounded-xl bg-card border border-border/60 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        <span className="font-bold text-foreground">1-Click Emergency SOS</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-bold">24/7 Support</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "counselor" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-bold">
                    <HeartHandshake className="w-3.5 h-3.5" />
                    <span>For Campus Counselors & Clinicians</span>
                  </div>
                  <h3 className="text-2xl font-black text-foreground">
                    Actionable Clinical Triage & Risk Prioritization
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Prioritize students requiring urgent follow-up with clear risk categories: Low, Medium, High, and Critical. View longitudinal wellness trends and export comprehensive clinical dossiers.
                  </p>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Dynamic Triage Queue with semantic urgency badges</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>One-click clinical dossier exports (PDF & Print)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Verified emergency dispatch logs with timestamped resolution</span>
                    </li>
                  </ul>
                  <div className="pt-3">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md transition"
                    >
                      <span>Access Counselor Console</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-secondary/30 border border-border/60 space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold border-b border-border/50 pb-3">
                    <span className="text-foreground">Active Clinical Risk Queue</span>
                    <span className="text-xs text-muted-foreground font-semibold">Triage Live</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-card border border-rose-500/30 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-foreground block">Critical Alert: Late-Night Distress</span>
                        <span className="text-[10px] text-muted-foreground">Enrolled Student • Follow-up recommended</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 font-extrabold border border-rose-500/20">
                        CRITICAL
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-card border border-amber-500/30 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-foreground block">Moderate Strain: Academic Overload</span>
                        <span className="text-[10px] text-muted-foreground">Enrolled Student • Check-in logged</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold border border-amber-500/20">
                        MEDIUM
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-card border border-emerald-500/30 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-foreground block">Optimal: Resilient Trajectory</span>
                        <span className="text-[10px] text-muted-foreground">Enrolled Student • Routine steady</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/20">
                        LOW
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "institution" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>For University Leadership & Deans</span>
                  </div>
                  <h3 className="text-2xl font-black text-foreground">
                    Macro-Level Campus Wellbeing Analytics
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Protect your student body proactively with fully anonymized population insights. Identify exam stress peaks, track department wellness trends, and allocate counseling staff where needed most.
                  </p>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Aggregated campus stress index across academic departments</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Zero individual data leakage—strictly macro statistics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Centralized student & staff directory management</span>
                    </li>
                  </ul>
                  <div className="pt-3">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md transition"
                    >
                      <span>Explore Institutional Reports</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-secondary/30 border border-border/60 space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold border-b border-border/50 pb-3">
                    <span className="text-foreground">Campus Macro Health Metrics</span>
                    <span className="text-xs text-muted-foreground font-semibold">Anonymized</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-card border border-border/60 text-center">
                      <span className="text-[10px] text-muted-foreground block">Campus Average Wellness</span>
                      <span className="text-2xl font-black text-emerald-500">76.4</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">Optimal Zone</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-card border border-border/60 text-center">
                      <span className="text-[10px] text-muted-foreground block">Active Student Cohort</span>
                      <span className="text-2xl font-black text-primary">1,240+</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">Enrolled Accounts</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section id="how-it-works" className="py-20 border-t border-border/60 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Simple 4-Step Routine
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mt-4">
              How MindGuard Protects You Daily
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm mt-2">
              A private, automated companion that works smoothly in the background of your college routine.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border/80 relative">
              <span className="text-3xl font-black text-primary/30">01</span>
              <h4 className="text-sm font-extrabold text-foreground mt-2">Daily 1-Min Check-In</h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Log your thoughts, tap your mood, or share a voice reflection at your convenience.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/80 relative">
              <span className="text-3xl font-black text-indigo-500/30">02</span>
              <h4 className="text-sm font-extrabold text-foreground mt-2">Passive Screen Harmony</h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                The lightweight PC agent observes daytime vs late-night screen time without recording your content.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/80 relative">
              <span className="text-3xl font-black text-emerald-500/30">03</span>
              <h4 className="text-sm font-extrabold text-foreground mt-2">AI Coping & Reflection</h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Receive personalized breathing tools, habit reset simulators, and conversational guidance.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/80 relative">
              <span className="text-3xl font-black text-rose-500/30">04</span>
              <h4 className="text-sm font-extrabold text-foreground mt-2">Counselor Safety Net</h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                If distress is detected, campus professionals are gently notified to offer proactive, stigma-free care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRIVACY GUARANTEE */}
      <section id="privacy" className="py-20 border-t border-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Healthcare-Grade Privacy & Ethical AI Standards</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Your Thoughts Belong to You. Always.
          </h2>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            MindGuardAI was built on the fundamental principle that student mental wellness cannot exist without absolute trust. We never monetize data, never log keystrokes, and never expose private reflections.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
            <div className="p-4 rounded-2xl bg-card border border-border/80">
              <Lock className="w-5 h-5 text-primary mb-2" />
              <h5 className="text-xs font-bold text-foreground">256-Bit Encryption</h5>
              <p className="text-[11px] text-muted-foreground mt-1">All journal entries and telemetry logs are encrypted at rest and in transit.</p>
            </div>
            <div className="p-4 rounded-2xl bg-card border border-border/80">
              <Shield className="w-5 h-5 text-emerald-500 mb-2" />
              <h5 className="text-xs font-bold text-foreground">Zero Keystroke / Pixel Spy</h5>
              <p className="text-[11px] text-muted-foreground mt-1">Telemetry tracks app category headers only. No web content or webcam access.</p>
            </div>
            <div className="p-4 rounded-2xl bg-card border border-border/80">
              <HeartHandshake className="w-5 h-5 text-indigo-500 mb-2" />
              <h5 className="text-xs font-bold text-foreground">Explicit Counselor Sharing</h5>
              <p className="text-[11px] text-muted-foreground mt-1">Students configure and control exactly what clinical notes are shared in Settings.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. VERIFIED 24/7 CRISIS HELPLINES */}
      <section id="helplines" className="py-20 border-t border-border/60 bg-rose-500/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-10">
            <span className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              Emergency Student Support
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              You Are Never Alone. 24/7 National Crisis Helplines.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              If you or a fellow student are experiencing severe emotional pain or distress, please dial any of the official toll-free services below immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tele-MANAS */}
            <div className="p-5 rounded-2xl bg-card border border-rose-500/20 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    24/7 Toll-Free
                  </span>
                  <span className="text-[10px] text-muted-foreground">Govt of India</span>
                </div>
                <h4 className="font-bold text-sm text-foreground">Tele-MANAS</h4>
                <p className="text-[11px] text-muted-foreground mt-1">
                  National comprehensive tele-mental health services in 20+ Indian regional languages.
                </p>
              </div>
              <a
                href="tel:14416"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call 14416</span>
              </a>
            </div>

            {/* KIRAN */}
            <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    24/7 Toll-Free
                  </span>
                  <span className="text-[10px] text-muted-foreground">National Helpline</span>
                </div>
                <h4 className="font-bold text-sm text-foreground">KIRAN Mental Health</h4>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Official psychological support, psychological first aid & distress helpline.
                </p>
              </div>
              <a
                href="tel:18005990019"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-sm transition"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call 1800-599-0019</span>
              </a>
            </div>

            {/* Campus Clinic */}
            <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Campus Clinic
                  </span>
                  <span className="text-[10px] text-muted-foreground">NMIMS Medical</span>
                </div>
                <h4 className="font-bold text-sm text-foreground">Campus Medical Desk</h4>
                <p className="text-[11px] text-muted-foreground mt-1">
                  On-campus emergency health responder and duty psychologist support desk.
                </p>
              </div>
              <a
                href="tel:+912242355555"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border/80 bg-card hover:bg-accent text-foreground font-bold text-xs shadow-sm transition"
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
                <span>Call +91 22 4235 5555</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ ACCORDION */}
      <section className="py-20 border-t border-border/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-4">
              Answers to Common Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/80 bg-card overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-bold text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="border-t border-border/70 bg-card/60 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-emerald-500 p-0.5 flex items-center justify-center">
              <div className="w-full h-full rounded-[10px] bg-card flex items-center justify-center overflow-hidden">
                <img src="/favicon.jpg" alt="MindGuardAI Logo" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <span className="font-bold text-sm text-foreground block">
                MindGuard<span className="text-primary">AI</span>
              </span>
              <span className="text-[10px]">Campus Psychological Safety & Early Intervention</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-semibold">
            <Link to="/login" className="hover:text-primary transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-primary transition-colors">Register</Link>
            <Link to="/forgot-password" className="hover:text-primary transition-colors">Password Reset</Link>
            <a href="#privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#helplines" className="hover:text-rose-500 transition-colors">Emergency Contacts</a>
          </div>

          <div className="text-center md:text-right text-[11px]">
            <p>© 2026 MindGuardAI Platform. All rights reserved.</p>
            <p className="text-muted-foreground/80 mt-0.5">Designed for NMIMS University Campus Health & Wellness.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
