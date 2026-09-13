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
  EyeOff
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Active portal preview tab: "student" | "counselor" | "institution"
  const [activePortalTab, setActivePortalTab] = useState<"student" | "counselor" | "institution">("student");

  // Interactive Mini Breath Reset widget in Hero
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Ready">("Ready");
  const [breathSeconds, setBreathSeconds] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(false);

  // FAQ Accordion states
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isBreathingActive) {
      interval = setInterval(() => {
        setBreathSeconds((prev) => {
          if (prev <= 1) {
            setBreathPhase((currentPhase) => {
              if (currentPhase === "Ready" || currentPhase === "Exhale") return "Inhale";
              if (currentPhase === "Inhale") return "Hold";
              return "Exhale";
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBreathPhase("Ready");
      setBreathSeconds(4);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBreathingActive]);

  const toggleBreathWidget = () => {
    setIsBreathingActive((prev) => {
      if (!prev) {
        setBreathPhase("Inhale");
        setBreathSeconds(4);
      }
      return !prev;
    });
  };

  const faqs = [
    {
      q: "Can professors or college administrators read my private journal entries?",
      a: "Absolutely not. All journal reflections and chatbot conversations are strictly private to the student and protected by medical-grade encryption. Institutional administrators only see macro-level, anonymized statistical aggregations (e.g. 'Campus average wellness is 74/100')."
    },
    {
      q: "Does the MindGuard PC Agent log my keystrokes, webcam, or private messages?",
      a: "Zero keystrokes, zero webcam pixels, and zero chat message text are ever captured. The agent only reads the operating system's active application category (e.g. 'VS Code = Academic', 'Netflix = Entertainment') and idle timers to compute healthy screen time harmony and prevent late-night circadian fatigue."
    },
    {
      q: "What happens when a student triggers the 1-Click Emergency SOS?",
      a: "An immediate, critical triage alert is dispatched to designated on-campus university counselors with the student's emergency contact information. At the same time, the student is immediately provided direct, toll-free access to 24/7 national mental health hotlines including Tele-MANAS (14416) and KIRAN (1800-599-0019)."
    },
    {
      q: "What clinical assessments are utilized?",
      a: "MindGuard uses the internationally validated PHQ-9 (Patient Health Questionnaire for depression severity) and GAD-7 (Generalized Anxiety Disorder questionnaire) standardized under DSM-5 criteria, modernized into step-by-step friendly check-in flows."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col selection:bg-indigo-500 selection:text-white relative overflow-x-hidden font-sans">
      {/* Background Decorative Grid & Ambient Aurora Orbs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[550px] h-[550px] bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-white/75 dark:bg-slate-950/75 border-b border-slate-200/80 dark:border-slate-800/80 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-emerald-400 p-0.5 shadow-md shadow-indigo-500/15 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full rounded-[14px] bg-card flex items-center justify-center overflow-hidden">
                <img src="/favicon.jpg" alt="MindGuardAI Logo" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xl tracking-tight text-foreground">
                  MindGuard<span className="text-primary">AI</span>
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Live & Secure" />
              </div>
              <p className="text-[10px] text-muted-foreground tracking-wider uppercase font-semibold">
                Campus Psychological Safety
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">
              Pillars of Care
            </a>
            <a href="#portals" className="hover:text-primary transition-colors">
              Platform Experience
            </a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">
              How It Works
            </a>
            <a href="#privacy" className="hover:text-primary transition-colors">
              Privacy Promise
            </a>
            <a href="#helplines" className="hover:text-primary transition-colors">
              Crisis Helplines
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2.5 rounded-xl border border-border/80 bg-card/80 text-muted-foreground hover:text-foreground hover:border-primary/40 transition shadow-xs"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition active:scale-[0.98]"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Shimmer Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/25 bg-card/90 backdrop-blur-md text-primary text-xs font-bold mb-8 shadow-xs">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span>Proactive Campus Psychological Safety & Early Care</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto text-foreground">
            Transforming Student Mental Health From{" "}
            <span className="text-rose-500">
              Reactive Crisis
            </span>{" "}
            To{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
              Proactive Care
            </span>
          </h1>

          {/* Subheading */}
          <p className="max-w-3xl mx-auto text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-10 leading-relaxed font-normal">
            MindGuardAI unifies daily emotional reflections, non-invasive study habit telemetry, and interactive CBT tools with closed-loop campus counselor support—100% private, respectful, and domain-protected.
          </p>

          {/* Primary Action Row */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
            <Link
              to="/login"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-base font-bold text-primary-foreground bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition active:scale-[0.98]"
            >
              <GraduationCap className="w-5 h-5" />
              Launch Student Hub
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-base font-semibold border border-border/80 bg-card/80 backdrop-blur-md text-foreground hover:border-primary/40 hover:bg-primary/5 transition shadow-xs"
            >
              <HeartHandshake className="w-5 h-5 text-primary" />
              Counselor Triage Board
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-base font-semibold border border-border/80 bg-card/80 backdrop-blur-md text-foreground hover:border-emerald-500/40 hover:bg-emerald-500/5 transition shadow-xs"
            >
              <Building2 className="w-5 h-5 text-emerald-500" />
              Campus Analytics
            </Link>
          </div>

          {/* Interactive Live Product Preview Card (Hero Interactive Showcase) */}
          <div className="max-w-4xl mx-auto rounded-3xl border border-border/80 bg-card/90 backdrop-blur-2xl shadow-xl p-6 sm:p-8 text-left transition-all relative overflow-hidden">
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between pb-6 border-b border-border/80 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-muted-foreground ml-2">
                  MindGuard Live Student Telemetry Simulator
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Active Routine
                </span>
              </div>
            </div>

            {/* Simulated Live Dashboard Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 py-6">
              {/* 1. Mental Wellness Score */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Mental Wellness Index</span>
                  <Activity className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">88</span>
                  <span className="text-xs text-muted-foreground font-semibold">/100 (Optimal)</span>
                </div>
                <div className="mt-3 w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full w-[88%]" />
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-2">
                  ✓ High Resilience & Positive Momentum
                </p>
              </div>

              {/* 2. Today's Balanced Screen Rhythm */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Study & Screen Balance</span>
                  <Laptop className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">4h 15m</span>
                  <span className="text-xs text-muted-foreground font-semibold">today</span>
                </div>
                <div className="mt-3 flex gap-1 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full w-[75%]" title="Academic: 75%" />
                  <div className="bg-purple-400 h-full w-[15%]" title="Social: 15%" />
                  <div className="bg-amber-400 h-full w-[10%]" title="Breaks: 10%" />
                </div>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold mt-2">
                  ✓ 75% Dedicated to Coursework & Coding
                </p>
              </div>

              {/* 3. Real-time Breath Reset Halo */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/60 dark:border-indigo-800/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  <span>Interactive 10s Breath Reset</span>
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="my-2 flex items-center justify-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xs shadow-md transition-all duration-1000 ${
                      breathPhase === "Inhale"
                        ? "scale-125 bg-emerald-500 text-white shadow-emerald-500/40"
                        : breathPhase === "Hold"
                        ? "scale-110 bg-amber-500 text-white shadow-amber-500/40"
                        : breathPhase === "Exhale"
                        ? "scale-90 bg-indigo-500 text-white shadow-indigo-500/40"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {isBreathingActive ? `${breathPhase} ${breathSeconds}s` : "Relax"}
                  </div>
                </div>
                <button
                  onClick={toggleBreathWidget}
                  className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {isBreathingActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {isBreathingActive ? "Pause Reset" : "Start Guided Calm"}
                </button>
              </div>
            </div>

            {/* Bottom Trust Row */}
            <div className="flex flex-wrap items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-500" />
                Zero Keystroke / Pixel Recording Guarantee
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                HIPAA & FERPA Compliant PII Masking
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Pillars of Care Section (Bento Grid Architecture) */}
      <section id="features" className="py-24 bg-slate-100/70 dark:bg-slate-900/50 border-y border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              The MindGuard Advantage
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2">
              Four Interlocking Pillars of Psychological Wellbeing
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300 mt-3">
              Unlike generic meditation apps, MindGuard provides clinical-grade tracking tailored specifically for student academic schedules.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Bento Card 1: AI Emotion Journal */}
            <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Dual-Input AI Reflection Journal
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Speak or type daily thoughts. The NLP engine detects subtle emotion shifts (anxiety, fatigue, joy) across longitudinal check-ins while automatically scrubbing personal identifiers.
                </p>
              </div>

              {/* Micro UI Simulation inside Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-800/60 text-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-semibold mb-1">
                  <span>Student Journal Entry</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">Emotion: Optimistic (89%)</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 italic">
                  "Exams were stressful today, but studying with my lab group helped me understand the topics..."
                </p>
              </div>
            </div>

            {/* Bento Card 2: Habit & Circadian Telemetry */}
            <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Intelligent Screen & Habit Harmony
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Passively understands active work sessions. Rewards high coursework focus in IDEs while gently alerting against prolonged unbroken screen strain and 3:00 AM circadian disruptions.
                </p>
              </div>

              {/* Micro UI Simulation inside Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-800/60 text-xs">
                <div className="flex items-center justify-between font-semibold mb-2">
                  <span className="text-slate-500 dark:text-slate-400">Context Engine</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Academic Focus</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                    VS Code / Canvas: 78%
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[10px]">
                    Zero Late-Night
                  </span>
                </div>
              </div>
            </div>

            {/* Bento Card 3: Interactive CBT Modules */}
            <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  In-Chat Clinical CBT Toolkit
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Immediate de-escalation tools: 4-4-4-4 Box Breathing, 4-7-8 relaxing breath, 5-4-3-2-1 tactile grounding, and Cognitive Thought Distortion Reframers for catastrophizing thoughts.
                </p>
              </div>

              {/* Micro UI Simulation inside Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-800/60 text-xs">
                <div className="flex items-center justify-between font-semibold mb-1">
                  <span className="text-slate-500 dark:text-slate-400">Available Exercises</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">4 Micro-Tools</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold text-[10px]">
                    Box Breathing
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold text-[10px]">
                    5-4-3-2-1 Grounding
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-semibold text-[10px]">
                    Thought Reframer
                  </span>
                </div>
              </div>
            </div>

            {/* Bento Card 4: Standardized Surveys */}
            <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Validated Clinical Assessments
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Interactive implementations of validated PHQ-9 (Depression) and GAD-7 (Anxiety) inventories with friendly progress tracking and plain-English recommendations.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-800/60 text-xs">
                <span className="font-bold text-amber-600 dark:text-amber-400">Step-by-Step Modern Check-in</span>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  Replaces intimidating medical tables with supportive conversational cards and longitudinal scoring.
                </p>
              </div>
            </div>

            {/* Bento Card 5: Explainable AI & SHAP Factors */}
            <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Transparent & Explainable AI
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Zero black-box mystery. Students and counselors see exactly which factors (sleep regularity, exam stress, social balance) drive their wellness index.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-800/60 text-xs">
                <span className="font-bold text-blue-600 dark:text-blue-400">SHAP-Inspired Factor Weighting</span>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  Empowers students with clear, actionable insights on what habits improve their mental focus.
                </p>
              </div>
            </div>

            {/* Bento Card 6: 1-Click Crisis SOS Gateway */}
            <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-rose-500/40 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Instant Emergency SOS Gateway
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Dispatches high-priority confidential alerts to campus counselors while instantly linking the student to toll-free 24/7 government tele-health crisis services.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-rose-600 dark:text-rose-400">Tele-MANAS: 14416</span>
                  <p className="text-slate-500 dark:text-slate-400 text-[10px]">Toll-free 24/7 Govt of India</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-rose-500 text-white font-bold text-[10px]">
                  Direct Dial
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Role Portals Explorer Section */}
      <section id="portals" className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Unified Ecosystem
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2">
              Engineered For Every Campus Role
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Select a persona below to explore how MindGuard empowers students, counseling teams, and institutional leaders.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex p-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-inner">
              <button
                onClick={() => setActivePortalTab("student")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activePortalTab === "student"
                    ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-md"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Student Portal
              </button>
              <button
                onClick={() => setActivePortalTab("counselor")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activePortalTab === "counselor"
                    ? "bg-white dark:bg-purple-600 text-purple-600 dark:text-white shadow-md"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <HeartHandshake className="w-4 h-4" />
                Counselor Command Center
              </button>
              <button
                onClick={() => setActivePortalTab("institution")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activePortalTab === "institution"
                    ? "bg-white dark:bg-emerald-600 text-emerald-600 dark:text-white shadow-md"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Building2 className="w-4 h-4" />
                Dean & Institutional Analytics
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="p-8 sm:p-12 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl transition-all">
            {activePortalTab === "student" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-4">
                    <Sparkles className="w-3.5 h-3.5" />
                    For Undergrads, Postgrads & Researchers
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
                    Your Confidential Daily Mental Wellness Sanctuary
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
                    Check in with your feelings without fear of judgment. MindGuard tracks your natural mood trajectory, reminds you to take screen pauses, and offers interactive exercises during stressful midterms.
                  </p>
                  <ul className="space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-8">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Daily voice and text reflections with emotion detection
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      24/7 AI wellness companion with Hinglish understanding
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Passive screen time tracking with zero keystroke logging
                    </li>
                  </ul>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition active:scale-[0.98]"
                  >
                    Open Student Portal
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Student Dashboard Highlights</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold">Live Status</span>
                  </div>
                  <div className="mt-4 space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <span>Mental Wellness Score</span>
                      <span className="font-black text-emerald-500">88/100 (Optimal)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <span>Screen & Study Harmony</span>
                      <span className="font-black text-indigo-500">4.2h Active (Balanced)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <span>CBT Coping Exercises Used</span>
                      <span className="font-black text-purple-500">Box Breathing (Complete)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePortalTab === "counselor" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 text-xs font-bold mb-4">
                    <HeartHandshake className="w-3.5 h-3.5" />
                    For Campus Therapists & Medical Staff
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
                    Prioritize High-Risk Cases With Clear Context
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
                    Rather than waiting for students to drop out or reach severe crisis, counselors receive early alerts based on triangulated longitudinal patterns, enabling timely, compassionate outreach.
                  </p>
                  <ul className="space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-8">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-purple-500 shrink-0" />
                      Automated risk stratification (Low, Medium, High triage queue)
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-purple-500 shrink-0" />
                      One-click student case claiming (PENDING ➔ REVIEWED ➔ RESOLVED)
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-purple-500 shrink-0" />
                      Comprehensive clinical dossiers with PHQ-9 and GAD-7 histories
                    </li>
                  </ul>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-600/20 transition active:scale-[0.98]"
                  >
                    Open Counselor Board
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Active Triage Queue</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 font-bold">1 High Priority</span>
                  </div>
                  <div className="mt-4 space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-500/30 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-rose-600 dark:text-rose-400">High Circadian Disruption</span>
                        <p className="text-[10px] text-slate-400">Student ID: #9842 &bull; 3:15 AM Spike</p>
                      </div>
                      <span className="px-2 py-1 rounded bg-rose-500 text-white text-[10px] font-bold">Needs Review</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-amber-500">Moderate Exam Anxiety</span>
                        <p className="text-[10px] text-slate-400">GAD-7 Score: 11 &bull; 2h ago</p>
                      </div>
                      <span className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">Claimed</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePortalTab === "institution" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-4">
                    <Building2 className="w-3.5 h-3.5" />
                    For Deans, Chancellors & University Leadership
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
                    Macro Wellbeing Trends Without Sacrificing Privacy
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
                    Empower campus administration to measure institutional wellness patterns during exam cycles, optimize counseling staff allocation, and prevent student burnout at scale.
                  </p>
                  <ul className="space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-8">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      100% anonymized institutional risk distribution charts
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Department-level burnout indicators (Engineering, Medicine, Arts)
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Exportable wellness compliance reports for academic accreditation
                    </li>
                  </ul>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition active:scale-[0.98]"
                  >
                    Open Institutional Analytics
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Campus Macro Wellness Overview</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold">2,400+ Students</span>
                  </div>
                  <div className="mt-4 space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <span>Campus Average Wellness Score</span>
                      <span className="font-black text-emerald-500">74.2 / 100</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <span>Low Risk Population</span>
                      <span className="font-black text-indigo-500">82% of Enrolled</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <span>Counselor Escalation Turnaround</span>
                      <span className="font-black text-purple-500">&lt; 15 Minutes Avg</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. How It Works (The 3-Step Lifecycle) */}
      <section id="how-it-works" className="py-20 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              The Intelligent Lifecycle
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2">
              How MindGuard Operates In 3 Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center relative shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center mx-auto mb-5 text-base shadow-lg shadow-indigo-600/30">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Check-in & Gentle Sensing</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Log a quick daily journal or take periodic standardized assessments. The background agent passively records study balance without touching personal data.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center relative shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white font-extrabold flex items-center justify-center mx-auto mb-5 text-base shadow-lg shadow-purple-600/30">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">The Decision Diamond</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                The ML risk engine correlates emotional vectors, study rhythms, and clinical survey tiers to objectively categorize risk (Low, Medium, High).
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center relative shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold flex items-center justify-center mx-auto mb-5 text-base shadow-lg shadow-emerald-600/30">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Proactive Care Delivery</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Low/Medium risk unlocks instant CBT self-care exercises; acute high risk seamlessly alerts the university counseling staff for compassionate support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Privacy & Trust Guarantee Section */}
      <section id="privacy" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-14 h-14 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/20">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
            Our Strict Privacy & Security Promise
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-12">
            Student privacy and psychological safety are fundamental rights. MindGuard is architected with strict boundary isolation to ensure zero invasive surveillance.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left max-w-3xl mx-auto text-xs">
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <EyeOff className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-slate-900 dark:text-white mb-1">Zero Keystroke / Pixel Recording</strong>
                <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  We never inspect what you type, read your browser URLs, or capture screen pixels. Only app categories (e.g. IDE vs Video) are counted.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <Lock className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-slate-900 dark:text-white mb-1">Automated PII Redaction</strong>
                <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Names, student roll numbers, phone numbers, and emails are scrubbed before any text reaches the ML emotion models.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <Shield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-slate-900 dark:text-white mb-1">Institutional Domain Verification</strong>
                <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Only students with pre-authorized institutional email domains (@nmims.in, @nmims.edu) can register or access campus resources.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <HeartHandshake className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-slate-900 dark:text-white mb-1">Confidential Clinical Outreach</strong>
                <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Only high-priority crisis distress signals trigger counselor alerts. Casual daily reflections remain exclusively your private sanctuary.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Frequently Asked Questions (Accordion) */}
      <section className="py-20 bg-slate-100/60 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Clear & Transparent
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4.5 text-left font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                      openFaq === idx ? "rotate-180 text-indigo-600" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Emergency 24/7 Helplines Banner */}
      <section id="helplines" className="py-14 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-indigo-500/10 border-t border-rose-200/50 dark:border-rose-900/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 text-rose-600 dark:text-rose-400 font-extrabold text-sm mb-2">
            <PhoneCall className="w-4 h-4" />
            <span>24/7 National Crisis & Emergency Tele-Health Helplines</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 max-w-lg mx-auto">
            If you or a student peer is in acute distress, reach out immediately. These verified government and campus services are 100% confidential and free of charge.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-bold">
            <a
              href="tel:14416"
              className="px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-sm text-slate-900 dark:text-slate-100 hover:border-rose-400 transition flex items-center gap-2"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              Tele-MANAS: <span className="text-rose-600 dark:text-rose-400 font-black">14416</span> (Govt of India)
            </a>
            <a
              href="tel:18005990019"
              className="px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-sm text-slate-900 dark:text-slate-100 hover:border-amber-400 transition flex items-center gap-2"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              KIRAN Mental Health: <span className="text-amber-600 dark:text-amber-400 font-black">1800-599-0019</span>
            </a>
            <a
              href="tel:02242355555"
              className="px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 shadow-sm text-slate-900 dark:text-slate-100 hover:border-indigo-400 transition flex items-center gap-2"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Campus Health Clinic: <span className="text-indigo-600 dark:text-indigo-400 font-black">+91 22 4235 5555</span>
            </a>
          </div>
        </div>
      </section>

      {/* 9. Final Call to Action Card */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-2xl relative overflow-hidden">
            <div className="max-w-2xl mx-auto relative z-10">
              <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">
                Prioritize Your Academic & Mental Health Today
              </h2>
              <p className="text-indigo-100 text-sm sm:text-base mb-8 leading-relaxed font-normal">
                Join students and faculty across NMIMS in fostering an environment where seeking support is easy, proactive, and celebrated.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/login"
                  className="px-8 py-3.5 rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 font-extrabold text-sm shadow-lg transition active:scale-[0.98]"
                >
                  Enter Student Hub
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-3.5 rounded-2xl bg-indigo-800/60 hover:bg-indigo-800/80 text-white border border-indigo-400/40 font-bold text-sm transition"
                >
                  Counselor Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="mt-auto py-8 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
              M
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">MindGuardAI</span>
            <span>&copy; {new Date().getFullYear()} Campus Psychological Support Architecture.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium">
              Student Sign In
            </Link>
            <span>&bull;</span>
            <Link to="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium">
              Staff Portal
            </Link>
            <span>&bull;</span>
            <span className="text-slate-400 dark:text-slate-500">MIT Open License</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
