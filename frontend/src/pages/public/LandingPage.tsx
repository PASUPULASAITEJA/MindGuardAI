import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Brain,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  Shield,
  Activity,
  HeartHandshake,
  CheckCircle2,
  PhoneCall,
  Clock,
  Lock,
  MoonStar,
  Users,
  Compass,
  Zap,
  BarChart3,
  Flame,
  FileCheck2,
  Stethoscope,
  Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Pure React count-up hook using IntersectionObserver
function useCountUp(targetNumber: number, duration: number = 1800) {
  const [count, setCount] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let startTime: number | null = null;
    let frameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Number((eased * targetNumber).toFixed(targetNumber % 1 === 0 ? 0 : 1)));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isVisible, targetNumber, duration]);

  return { count, elementRef };
}

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Stats counter hooks
  const stat1 = useCountUp(99.2, 1500);
  const stat2 = useCountUp(100, 1200);
  const stat4 = useCountUp(3, 1000);

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary/20 selection:text-primary transition-colors duration-200">
      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/85 border-b border-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/25 transition-transform group-hover:scale-105">
              <Brain className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg tracking-tight text-foreground">
                MindGuard<span className="text-primary">AI</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium -mt-1">
                University Wellness
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="hover:text-foreground transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-foreground transition-colors"
            >
              Capabilities
            </button>
            <button
              onClick={() => scrollToSection("privacy")}
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </button>
            <button
              onClick={() => scrollToSection("helplines")}
              className="hover:text-foreground transition-colors"
            >
              Crisis Lines
            </button>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Toggle theme"
              aria-label="Toggle dark/light theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link to="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs sm:text-sm font-semibold rounded-lg hover:text-primary"
              >
                Sign In
              </Button>
            </Link>

            <Link to="/login">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs sm:text-sm font-semibold shadow-xs">
                Student Portal
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* TASK 1: HERO SECTION */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-background via-primary/5 to-background px-4 sm:px-6 py-12 md:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center animate-fade-in-up">
          {/* Left Column: Headline and CTAs */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
              <span role="img" aria-label="brain">🧠</span>
              <span>Student Mental Wellness Platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
              Detect Burnout Before It Becomes a Crisis
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed">
              MindGuardAI continuously monitors student wellbeing signals — emotion 
              analysis, sleep patterns, and clinical screeners — to surface early 
              warnings weeks before students reach breaking point.
            </p>

            {/* Two CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto pt-2">
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-7 rounded-lg shadow-md shadow-primary/20">
                  Student Portal →
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => scrollToSection("how-it-works")}
                className="w-full sm:w-auto font-semibold text-muted-foreground hover:text-foreground px-6 rounded-lg"
              >
                How It Works ↓
              </Button>
            </div>
          </div>

          {/* Right Column: Floating Stats Card Mockup (Styled like real StudentDashboard) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-xl p-5 space-y-5 animate-float transition-all">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    <Smile className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Student Wellness Overview</h3>
                    <p className="text-[11px] text-muted-foreground">Semester Telemetry • Active</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Stable
                </span>
              </div>

              {/* Main Wellness Score Metric */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                    Composite Wellness Index
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-4xl font-extrabold text-emerald-500">78</span>
                    <span className="text-xs text-muted-foreground font-semibold">/ 100</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 inline-flex items-center gap-1">
                    ↑ +4% recovery from last check-in
                  </span>
                </div>

                {/* SVG Radial Gauge */}
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-border"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-500 transition-all duration-1000 ease-out"
                      strokeDasharray="78, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-[11px] font-bold text-foreground">78%</span>
                </div>
              </div>

              {/* Fake Mood Chart Line (SVG Sparkline) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">14-Day Trajectory</span>
                  <span className="text-muted-foreground text-[10px]">Circadian Aligned</span>
                </div>
                <div className="h-16 w-full rounded-lg bg-secondary/30 border border-border/80 p-2 flex items-end">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,32 Q15,35 30,22 T60,18 T85,10 T100,8 L100,40 L0,40 Z"
                      fill="url(#chartGradient)"
                    />
                    <path
                      d="M0,32 Q15,35 30,22 T60,18 T85,10 T100,8"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {/* Data point dots */}
                    <circle cx="30" cy="22" r="2.5" fill="hsl(var(--primary))" />
                    <circle cx="60" cy="18" r="2.5" fill="hsl(var(--primary))" />
                    <circle cx="100" cy="8" r="3" fill="#10B981" />
                  </svg>
                </div>
              </div>

              {/* 3 Stat Badges */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="p-2 rounded-lg bg-secondary/40 border border-border text-center">
                  <span className="text-[10px] text-muted-foreground block font-medium">Risk Status</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">LOW</span>
                </div>
                <div className="p-2 rounded-lg bg-secondary/40 border border-border text-center">
                  <span className="text-[10px] text-muted-foreground block font-medium">Sleep Avg</span>
                  <span className="text-xs font-bold text-foreground">7.4h</span>
                </div>
                <div className="p-2 rounded-lg bg-secondary/40 border border-border text-center">
                  <span className="text-[10px] text-muted-foreground block font-medium">Streak</span>
                  <span className="text-xs font-bold text-primary flex items-center justify-center gap-0.5">
                    <Flame className="w-3 h-3 text-amber-500 fill-amber-500" /> 14 Days
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR (below hero, border-y border-border bg-secondary/50) */}
      <section className="border-y border-border bg-secondary/50 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <span className="font-semibold text-muted-foreground tracking-wide uppercase text-[11px]">
            Backed by validated clinical instruments
          </span>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-primary" />
              <span>PHQ-9 Depression Screener</span>
            </div>
            <div className="hidden sm:block text-border">•</div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-primary" />
              <span>GAD-7 Anxiety Screener</span>
            </div>
            <div className="hidden sm:block text-border">•</div>
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span>SHAP Explainable AI</span>
            </div>
            <div className="hidden sm:block text-border">•</div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span>Zero-Keystroke Privacy</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (id="how-it-works") */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Workflow</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            How MindGuardAI Protects Students
          </h2>
          <p className="text-sm text-muted-foreground">
            A continuous, non-intrusive clinical safety net that bridges daily campus living with proactive mental healthcare.
          </p>
        </div>

        {/* 4 numbered steps in a horizontal grid (2x2 on mobile, 4-col on desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <Card className="relative bg-card border border-border rounded-lg shadow-xs hover:border-primary/40 transition-all">
            <CardContent className="p-6 space-y-4">
              <span className="text-2xl font-mono font-extrabold text-muted-foreground/30 block">
                01
              </span>
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Smile className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Daily Check-in</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Students log 30-second mood pulse, sleep hours, and journal notes. Frictionless reflection cultivates personal self-awareness.
              </p>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card className="relative bg-card border border-border rounded-lg shadow-xs hover:border-primary/40 transition-all">
            <CardContent className="p-6 space-y-4">
              <span className="text-2xl font-mono font-extrabold text-muted-foreground/30 block">
                02
              </span>
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">AI Emotion Analysis</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fine-tuned DistilBERT models classify affective sentiment across 6 distinct states, detecting subtle linguistic distress cues.
              </p>
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card className="relative bg-card border border-border rounded-lg shadow-xs hover:border-primary/40 transition-all">
            <CardContent className="p-6 space-y-4">
              <span className="text-2xl font-mono font-extrabold text-muted-foreground/30 block">
                03
              </span>
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Risk Stratification</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Machine learning models synthesize mood trajectories, sleep deficits, and academic load into calibrated Low, Moderate, or High tiers.
              </p>
            </CardContent>
          </Card>

          {/* Step 4 */}
          <Card className="relative bg-card border border-border rounded-lg shadow-xs hover:border-primary/40 transition-all">
            <CardContent className="p-6 space-y-4">
              <span className="text-2xl font-mono font-extrabold text-muted-foreground/30 block">
                04
              </span>
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Guided Care Pathway</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tailored self-care exercises, CBT tools, and instant counselor triage trigger automatically to arrest distress before crisis.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CAPABILITIES (id="features") */}
      <section id="features" className="py-20 px-4 sm:px-6 bg-secondary/30 border-y border-border">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Core Architecture</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Built on Clinical Science
            </h2>
            <p className="text-sm text-muted-foreground">
              Every algorithm, data pipeline, and triage policy was engineered in accordance with psychiatric validation standards.
            </p>
          </div>

          {/* 6-card bento grid (3-col desktop, 2-col tablet, 1-col mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <Card className="bg-card border border-border rounded-lg shadow-xs hover:border-primary/40 transition-all">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="text-xl" role="img" aria-label="brain">🧠</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">Emotion NLP</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  DistilBERT 6-class classifier accurately detects joy, sadness, anxiety, anger, fear, and surprise from journal submissions with high precision.
                </p>
              </CardContent>
            </Card>

            {/* Card 2 */}
            <Card className="bg-card border border-border rounded-lg shadow-xs hover:border-primary/40 transition-all">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="text-xl" role="img" aria-label="bar chart">📊</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">SHAP Explainability</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Every score explained, not a black box. Students and clinical counselors see the precise biometric and survey factors driving every prediction.
                </p>
              </CardContent>
            </Card>

            {/* Card 3 */}
            <Card className="bg-card border border-border rounded-lg shadow-xs hover:border-primary/40 transition-all">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <span className="text-xl" role="img" aria-label="emergency siren">🚨</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">Emergency SOS</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  24/7 crisis escalation with Tele-MANAS (14416) & KIRAN helplines. One-click emergency protocols bypass queues to reach immediate human responders.
                </p>
              </CardContent>
            </Card>

            {/* Card 4 */}
            <Card className="bg-card border border-border rounded-lg shadow-xs hover:border-primary/40 transition-all">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="text-xl" role="img" aria-label="sleeping face">😴</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">Sleep & Circadian</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Kernel-power Windows telemetry and self-reported sleep records analyze sleep debt and late-night fragmentation without capturing keystrokes.
                </p>
              </CardContent>
            </Card>

            {/* Card 5 */}
            <Card className="bg-card border border-border rounded-lg shadow-xs hover:border-primary/40 transition-all">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="text-xl" role="img" aria-label="stethoscope">🩺</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">Counselor Triage</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Priority queue with 5-tab case workspace enables university psychologists to review psychometric trends, log SOAP notes, and initiate outreach.
                </p>
              </CardContent>
            </Card>

            {/* Card 6 */}
            <Card className="bg-card border border-border rounded-lg shadow-xs hover:border-primary/40 transition-all">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <span className="text-xl" role="img" aria-label="lock">🔒</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">k-Anonymity Privacy</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Admins see cohort data only, k ≥ 10. Student records are encrypted and decoupled from university academic standing or administrative viewing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* IMPACT STATS */}
      <section className="py-20 px-4 sm:px-6 bg-foreground text-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
            {/* Stat 1 */}
            <div ref={stat1.elementRef} className="space-y-2">
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                {stat1.count.toFixed(1)}%
              </div>
              <p className="text-xs sm:text-sm font-medium opacity-80 max-w-[200px] mx-auto">
                Model Evaluation Accuracy on Psychometric Benchmarks
              </p>
            </div>

            {/* Stat 2 */}
            <div ref={stat2.elementRef} className="space-y-2">
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                &lt; {stat2.count}ms
              </div>
              <p className="text-xs sm:text-sm font-medium opacity-80 max-w-[200px] mx-auto">
                Real-Time Inference Latency for Distress Triage
              </p>
            </div>

            {/* Stat 3 */}
            <div className="space-y-2">
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                24/7
              </div>
              <p className="text-xs sm:text-sm font-medium opacity-80 max-w-[200px] mx-auto">
                Continuous Autonomous Early Warning & Safety Net
              </p>
            </div>

            {/* Stat 4 */}
            <div ref={stat4.elementRef} className="space-y-2">
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                {stat4.count} Tiers
              </div>
              <p className="text-xs sm:text-sm font-medium opacity-80 max-w-[200px] mx-auto">
                Calibrated Clinical Risk Stratification Levels
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRIVACY COMMITMENT (id="privacy") */}
      <section id="privacy" className="py-20 px-4 sm:px-6 bg-secondary/30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Institutional Privacy Safeguard</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Zero-Keystroke Privacy by Design
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We firmly believe mental healthcare cannot function under surveillance. MindGuardAI collects no keystroke logs, no screen captures, and no private message contents. Telemetry is limited to kernel sleep cycles and consented mood journals.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              University administrators only receive k-anonymized aggregate cohort reports (k ≥ 10), ensuring no single student can ever be singled out.
            </p>
          </div>

          {/* Right Column: 4 checklist items with CheckCircle2 icon in emerald */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">Zero Keystroke Logging</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No text typed in external applications is ever monitored, logged, or sent to server memory.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">AES-256-GCM End-to-End Encryption</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All clinical journals and screening records are secured with cryptographic tenant isolation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">Differential Privacy & k-Anonymity</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Campus-wide dashboards suppress small group data to mathematically prevent re-identification.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">Student Consent & Data Revocation</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Students retain full ownership to download, modify, or permanently purge their data at any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CRISIS HELPLINES (id="helplines") */}
      <section id="helplines" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="p-6 sm:p-8 rounded-lg bg-rose-500/5 border border-rose-500/20 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Emergency Crisis Escalation</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1">
              If you or someone on campus is in immediate distress or having thoughts of self-harm, confidential free help is available right now.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href="tel:14416"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-rose-500 text-white font-bold text-sm shadow-sm hover:bg-rose-600 transition-colors"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Tele-MANAS Helpline: 14416</span>
            </a>
            <a
              href="tel:18005990019"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-secondary border border-border text-foreground font-semibold text-sm hover:bg-secondary/80 transition-colors"
            >
              <PhoneCall className="w-4 h-4 text-rose-500" />
              <span>KIRAN Mental Health: 1800-599-0019</span>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo + tagline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <Brain className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-foreground">MindGuardAI</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              AI-driven student mental wellness detection and early intervention platform for higher education.
            </p>
          </div>

          {/* Link Group 1: Portal */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Portal</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>
                <Link to="/login" className="hover:text-primary transition-colors">
                  Student Portal
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary transition-colors">
                  Counselor Portal
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary transition-colors">
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Link Group 2: Support */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Support</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>
                <button
                  onClick={() => scrollToSection("helplines")}
                  className="hover:text-primary transition-colors"
                >
                  Crisis Lines
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("privacy")}
                  className="hover:text-primary transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <Link to="/privacy-consent" className="hover:text-primary transition-colors">
                  Consent Framework
                </Link>
              </li>
            </ul>
          </div>

          {/* Link Group 3: About */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">About</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>
                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="hover:text-primary transition-colors"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("features")}
                  className="hover:text-primary transition-colors"
                >
                  Capabilities
                </button>
              </li>
              <li>
                <span className="text-muted-foreground/80">Clinical Instruments</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
          <span>© {new Date().getFullYear()} MindGuardAI. All rights reserved.</span>
          <span>Built for Student Wellbeing</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
