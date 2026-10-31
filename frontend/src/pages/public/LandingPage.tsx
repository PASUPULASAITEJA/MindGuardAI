import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Brain,
  ArrowRight,
  Sun,
  Moon,
  Shield,
  Activity,
  HeartHandshake,
  CheckCircle2,
  PhoneCall,
  Lock,
  BarChart3,
  Flame,
  FileCheck2,
  Smile,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Zap,
  TrendingUp,
  Clock,
  Compass,
  MessageSquare,
  Award,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useCountUp } from "@/hooks/useCountUp";
import { ShinyText } from "@/components/ui/ShinyText";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { LottieIllustration } from "@/components/ui/LottieIllustration";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { motion, AnimatePresence } from "motion/react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How does MindGuardAI protect student privacy and data?",
    answer:
      "MindGuardAI strictly enforces zero-keystroke logging and k-anonymity (k ≥ 10). Personal mood logs, journal reflections, and clinical surveys are encrypted with tenant isolation. Campus administrators never see individual records — only anonymous cohort aggregates.",
  },
  {
    question: "What AI models are used for emotion and risk analysis?",
    answer:
      "We utilize fine-tuned DistilBERT models to classify affective sentiment across 6 distinct states. Risk stratification combines longitudinal sleep regularity, mood velocity, and validated psychometric screeners (PHQ-9 / GAD-7) into calibrated risk tiers.",
  },
  {
    question: "Is MindGuardAI a replacement for human psychologists?",
    answer:
      "No. MindGuardAI serves as an early-detection clinical safety net. It identifies subtle distress cues weeks before breakdown, equipping students with evidence-based CBT exercises while connecting them directly to campus counseling centers.",
  },
  {
    question: "What happens when a student enters the High Risk tier?",
    answer:
      "When acute distress indicators emerge, the platform initiates emergency protocols: offering immediate one-click connections to 24/7 crisis lines (Tele-MANAS & KIRAN) and triaging prioritized appointment availability with campus mental health staff.",
  },
  {
    question: "Can students delete their telemetry and opt out?",
    answer:
      "Yes. Students retain full sovereignty over their wellness profile. Through the Student Privacy & Consent portal, students can view what is tracked, modify preferences, or permanently purge all recorded telemetry at any time.",
  },
];

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Scroll reveal section refs
  const howRef = useScrollReveal();
  const featRef = useScrollReveal();
  const privRef = useScrollReveal();
  const faqRef = useScrollReveal();

  // Count-up stats
  const s1 = useCountUp(99);
  const s2 = useCountUp(2400);
  const s3 = useCountUp(6);
  const s4 = useCountUp(3);

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary/20 selection:text-primary transition-colors duration-200">
      {/* ── TOP STICKY NAVBAR ── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur-xl transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-white shadow-md shadow-primary/20 transition-transform group-hover:scale-105">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-foreground flex items-center gap-1.5">
                MindGuard<span className="text-primary font-black">AI</span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest">
                  Enterprise
                </span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="hover:text-primary transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-primary transition-colors"
            >
              Capabilities
            </button>
            <button
              onClick={() => scrollToSection("privacy")}
              className="hover:text-primary transition-colors"
            >
              Privacy & k-Anonymity
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="hover:text-primary transition-colors"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection("helplines")}
              className="hover:text-rose-500 transition-colors flex items-center gap-1"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>SOS (14416)</span>
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border transition-colors"
              title="Toggle theme"
              aria-label="Toggle dark/light theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            <Link to="/login" className="hidden sm:inline-block">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs sm:text-sm font-semibold rounded-xl hover:text-primary"
              >
                Sign In
              </Button>
            </Link>

            <Link to="/login" className="hidden sm:inline-block">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:shadow-primary/25 transition-all">
                Student Portal
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="p-2 md:hidden rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileNavOpen ? <X className="w-5 h-5 text-primary" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl px-4 py-4 space-y-3 shadow-xl overflow-hidden"
            >
              <div className="flex flex-col space-y-1.5 text-sm font-medium">
                <button
                  onClick={() => {
                    scrollToSection("how-it-works");
                    setIsMobileNavOpen(false);
                  }}
                  className="text-left px-3 py-2 rounded-lg hover:bg-secondary text-foreground transition-colors"
                >
                  How It Works
                </button>
                <button
                  onClick={() => {
                    scrollToSection("features");
                    setIsMobileNavOpen(false);
                  }}
                  className="text-left px-3 py-2 rounded-lg hover:bg-secondary text-foreground transition-colors"
                >
                  Capabilities
                </button>
                <button
                  onClick={() => {
                    scrollToSection("privacy");
                    setIsMobileNavOpen(false);
                  }}
                  className="text-left px-3 py-2 rounded-lg hover:bg-secondary text-foreground transition-colors"
                >
                  Privacy
                </button>
                <button
                  onClick={() => {
                    scrollToSection("faq");
                    setIsMobileNavOpen(false);
                  }}
                  className="text-left px-3 py-2 rounded-lg hover:bg-secondary text-foreground transition-colors"
                >
                  FAQ
                </button>
                <button
                  onClick={() => {
                    scrollToSection("helplines");
                    setIsMobileNavOpen(false);
                  }}
                  className="text-left px-3 py-2 rounded-lg hover:bg-secondary text-rose-500 font-semibold transition-colors"
                >
                  Crisis Lines (14416)
                </button>
              </div>
              <div className="pt-2 border-t border-border/60 flex flex-col gap-2">
                <Link to="/login" onClick={() => setIsMobileNavOpen(false)}>
                  <Button className="w-full bg-primary text-primary-foreground font-semibold rounded-xl text-sm shadow-xs">
                    Student Portal
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO SECTION WITH REACT BITS AURORA BACKGROUND ── */}
      <AuroraBackground className="min-h-[92vh] border-b border-border px-4 sm:px-6 py-12 lg:py-20 relative">
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Value Prop & CTAs (7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary shadow-xs">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <ShinyText text="✨ AI-Powered Student Mental Health Platform" className="text-xs font-semibold text-primary" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.12]">
              Detect Burnout{" "}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-teal-400">
                <ShinyText text="Before It Becomes" speed={4} />
              </span>
              a Student Crisis.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
              MindGuardAI combines multimodal affective analysis, circadian sleep rhythms, and validated clinical screeners (PHQ-9 / GAD-7) to provide anonymous early intervention weeks before breakdown.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 py-6 rounded-2xl shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all text-base"
                >
                  Open Student Portal
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={() => scrollToSection("features")}
                className="w-full sm:w-auto font-semibold text-foreground px-6 py-6 rounded-2xl border-border bg-card/60 backdrop-blur hover:bg-card/90"
              >
                Explore Capabilities ↓
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-border/60 max-w-lg">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <span>PHQ-9 Validated</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <span>k ≥ 10 Privacy</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span>SHAP Explainable</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Floating Interactive Glass Telemetry HUD (5 cols) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-purple-500/20 to-teal-500/20 rounded-3xl blur-2xl opacity-50 pointer-events-none" />

            <div className="relative rounded-3xl bg-card/85 backdrop-blur-xl border border-border shadow-2xl p-5 sm:p-6 space-y-4">
              
              {/* HUD Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden border border-primary/20">
                    <LottieIllustration variant="companion" className="w-12 h-12" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <span>MindGuard Companion</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </h3>
                    <p className="text-[11px] text-muted-foreground">Autonomous Neural Telemetry</p>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  Active
                </div>
              </div>

              {/* Main Wellness Metric Preview */}
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Student Wellness Index
                  </span>
                  <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-baseline gap-2">
                    <span>88</span>
                    <span className="text-sm font-semibold text-muted-foreground">/ 100</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3.5 h-3.5" /> +4.2% healthy stability
                  </span>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center font-bold text-xs text-foreground bg-card">
                  Optimal
                </div>
              </div>

              {/* Live Multimodal Signal Indicators */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-background/80 border border-border/60 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                    <span>Sentiment</span>
                    <Smile className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <p className="font-bold text-foreground text-sm">Calm & Focused</p>
                  <p className="text-[10px] text-muted-foreground">DistilBERT 6-Class</p>
                </div>

                <div className="p-3 rounded-xl bg-background/80 border border-border/60 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                    <span>Circadian</span>
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <p className="font-bold text-foreground text-sm">7.4 hrs Sleep</p>
                  <p className="text-[10px] text-muted-foreground">Regular Rhythm</p>
                </div>
              </div>

              {/* Emergency SOS Quick-Connect Bar */}
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    Tele-MANAS Emergency Net
                  </span>
                </div>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-500/10">
                  14416
                </span>
              </div>

            </div>
          </motion.div>

        </div>
      </AuroraBackground>

      {/* ── HOW IT WORKS: INTERACTIVE WORKFLOW ── */}
      <section id="how-it-works" ref={howRef} className="py-20 sm:py-28 border-b border-border bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-primary tracking-widest uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              Clinical Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              How MindGuardAI Operates
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              A 4-stage safety net engineered with university psychologists to identify distress weeks before exam failure or clinical breakdown.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <SpotlightCard className="p-6 space-y-4" spotlightColor="rgba(59, 130, 246, 0.15)">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black text-lg">
                01
              </div>
              <h3 className="text-lg font-bold text-foreground">Passive & Active Pulse</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Students complete 60-second micro check-ins via text, audio, or standardized mood scales, while screen-time regularity tracks circadian shift.
              </p>
              <div className="text-[11px] font-semibold text-blue-500 flex items-center gap-1 pt-2">
                <span>Zero Keystroke Logging</span>
              </div>
            </SpotlightCard>

            {/* Step 2 */}
            <SpotlightCard className="p-6 space-y-4" spotlightColor="rgba(168, 85, 247, 0.15)">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-lg">
                02
              </div>
              <h3 className="text-lg font-bold text-foreground">Multi-Signal AI Fusion</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fine-tuned NLP models evaluate sentiment polarity and emotional markers while longitudinal ML models benchmark baseline mood stability.
              </p>
              <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 pt-2">
                <span>DistilBERT 6-Class Emotion</span>
              </div>
            </SpotlightCard>

            {/* Step 3 */}
            <SpotlightCard className="p-6 space-y-4" spotlightColor="rgba(245, 158, 11, 0.15)">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-lg">
                03
              </div>
              <h3 className="text-lg font-bold text-foreground">Risk Stratification</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cross-references mood drift with academic exam dates and sleep deficit to calibrate risk tiers (Low, Moderate, High) with SHAP factor explainability.
              </p>
              <div className="text-[11px] font-semibold text-amber-500 flex items-center gap-1 pt-2">
                <span>SHAP Feature Attribution</span>
              </div>
            </SpotlightCard>

            {/* Step 4 */}
            <SpotlightCard className="p-6 space-y-4" spotlightColor="rgba(16, 185, 129, 0.15)">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-lg">
                04
              </div>
              <h3 className="text-lg font-bold text-foreground">Intervention & Care</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Mild stress triggers guided 4-7-8 breathing and CBT self-care exercises; elevated distress prioritizes confidential counseling appointments.
              </p>
              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-2">
                <span>24/7 Human Safety Net</span>
              </div>
            </SpotlightCard>

          </div>
        </div>
      </section>

      {/* ── BENTO GRID CAPABILITIES SECTION ── */}
      <section id="features" ref={featRef} className="py-20 sm:py-28 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-primary tracking-widest uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              Modern Bento Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Clinical Science Capabilities
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Built with evidence-based psychology protocols, explainable AI pipelines, and strict campus privacy isolation.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Item 1: Large 2-Col Hero Card */}
            <SpotlightCard
              className="md:col-span-2 p-8 space-y-5"
              spotlightColor="rgba(59, 130, 246, 0.2)"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Brain className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                  DistilBERT NLP
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">
                  Multimodal Affective NLP Engine
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                  Evaluates textual reflections, voice sentiment, and behavioral frequency to identify 6 emotional states (Joy, Sadness, Anger, Fear, Love, Surprise) with longitudinal drift monitoring.
                </p>
              </div>

              {/* Mini visual preview */}
              <div className="pt-4 grid sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Polarity Accuracy</span>
                  <span className="text-lg font-black text-foreground">94.8%</span>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Inference Speed</span>
                  <span className="text-lg font-black text-foreground">&lt; 85ms</span>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Telemetry Encryption</span>
                  <span className="text-lg font-black text-foreground">AES-256</span>
                </div>
              </div>
            </SpotlightCard>

            {/* Bento Item 2: SHAP Explainability */}
            <SpotlightCard
              className="p-8 space-y-5"
              spotlightColor="rgba(168, 85, 247, 0.2)"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">SHAP Explainable AI</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Zero "black box" decisions. Counselors view exact attribution percentages explaining why a student's risk level changed.
                </p>
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                  <span>Sleep Deficit</span>
                  <span className="text-foreground">+38%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="w-[38%] h-full bg-purple-500 rounded-full" />
                </div>
                <div className="flex justify-between text-[11px] font-semibold text-muted-foreground pt-1">
                  <span>Exam Proximity</span>
                  <span className="text-foreground">+27%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="w-[27%] h-full bg-indigo-500 rounded-full" />
                </div>
              </div>
            </SpotlightCard>

            {/* Bento Item 3: Circadian Telemetry */}
            <SpotlightCard
              className="p-8 space-y-5"
              spotlightColor="rgba(99, 102, 241, 0.2)"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Moon className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Circadian Sleep Analytics</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Self-reported logs and kernel-power screen regularity analyze sleep debt and late-night fragmentation without recording keystrokes.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 border border-border text-xs flex items-center justify-between">
                <span className="text-muted-foreground">Ideal Window:</span>
                <span className="font-bold text-foreground">11:00 PM – 7:00 AM</span>
              </div>
            </SpotlightCard>

            {/* Bento Item 4: Counselor Triage */}
            <SpotlightCard
              className="p-8 space-y-5"
              spotlightColor="rgba(245, 158, 11, 0.2)"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Counselor Triage Queue</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Priority workspace equips university psychologists to triage high-risk cases, review psychometric trajectories, and log SOAP notes.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Real-Time Support Triage</span>
              </div>
            </SpotlightCard>

            {/* Bento Item 5: Emergency SOS Safety Net */}
            <SpotlightCard
              className="p-8 space-y-5"
              spotlightColor="rgba(244, 63, 94, 0.2)"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">24/7 Crisis Escalation</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Direct one-click connection to Tele-MANAS (14416) and KIRAN (1800-599-0019) helplines with zero queuing for critical situations.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-mono font-bold text-rose-600 dark:text-rose-400 flex justify-between">
                <span>Tele-MANAS Hotline</span>
                <span>14416</span>
              </div>
            </SpotlightCard>

          </div>
        </div>
      </section>

      {/* ── LIVE METRICS COUNTER ── */}
      <section className="py-16 bg-gradient-to-r from-primary via-indigo-600 to-primary text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-4xl sm:text-5xl font-black font-mono">
              <AnimatedCounter value={s1.value} />%
            </p>
            <p className="text-xs uppercase tracking-widest font-bold mt-1 text-white/80">
              Risk Calibration
            </p>
          </div>
          <div>
            <p className="text-4xl sm:text-5xl font-black font-mono">
              <AnimatedCounter value={s2.value} />+
            </p>
            <p className="text-xs uppercase tracking-widest font-bold mt-1 text-white/80">
              Active Students
            </p>
          </div>
          <div>
            <p className="text-4xl sm:text-5xl font-black font-mono">
              <AnimatedCounter value={s3.value} />
            </p>
            <p className="text-xs uppercase tracking-widest font-bold mt-1 text-white/80">
              Affective Modalities
            </p>
          </div>
          <div>
            <p className="text-4xl sm:text-5xl font-black font-mono">
              <AnimatedCounter value={s4.value} />
            </p>
            <p className="text-xs uppercase tracking-widest font-bold mt-1 text-white/80">
              Calibrated Tiers
            </p>
          </div>
        </div>
      </section>

      {/* ── PRIVACY & COMPLIANCE SECTION ── */}
      <section id="privacy" ref={privRef} className="py-20 sm:py-28 border-b border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="p-8 sm:p-12 rounded-3xl bg-card border border-border shadow-xl space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Zero-Surveillance Privacy Standard
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Enforcing k-Anonymity (k ≥ 10) & Institutional Tenant Isolation
                  </p>
                </div>
              </div>
              <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                GDPR & HIPAA Aligned
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 text-xs text-muted-foreground leading-relaxed">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Zero Keystroke Snooping</span>
                </h4>
                <p>
                  MindGuardAI never records text keystrokes, active browser tabs, or private communications. Data collection is strictly limited to intentional check-ins.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Administrative Isolation</span>
                </h4>
                <p>
                  University deans and professors cannot inspect individual student psychological profiles. Admins only see aggregated cohort cohorts (k ≥ 10).
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Total Data Sovereignty</span>
                </h4>
                <p>
                  Students can view all logged telemetry, toggle passive tracking modules, or permanently delete their entire wellness profile with one click.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION (ACCORDION) ── */}
      <section id="faq" ref={faqRef} className="py-20 sm:py-28 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-primary tracking-widest uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              Knowledge Base
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Everything you need to know about MindGuardAI's algorithms, clinical validation, and data safety.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-border bg-card overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-foreground hover:bg-secondary/40 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
                        isOpen ? "transform rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CRISIS ESCALATION HELPLINES ── */}
      <section id="helplines" className="py-16 bg-rose-500/5 border-b border-rose-500/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>24/7 Immediate Emergency Helplines</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            In Crisis? You Are Never Alone.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            If you or a fellow student are experiencing severe distress or thoughts of self-harm, confidential trained professionals are available 24/7 free of charge.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-2">
            <a
              href="tel:14416"
              className="p-5 rounded-2xl bg-card border border-rose-500/30 shadow-md hover:border-rose-500 hover:shadow-rose-500/10 transition-all flex items-center justify-between group"
            >
              <div className="text-left">
                <span className="text-xs font-bold text-muted-foreground uppercase block">Tele-MANAS Hotline</span>
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">14416</span>
              </div>
              <Button size="sm" variant="destructive" className="rounded-xl text-xs font-bold group-hover:scale-105 transition-transform">
                Call Free
              </Button>
            </a>

            <a
              href="tel:18005990019"
              className="p-5 rounded-2xl bg-card border border-rose-500/30 shadow-md hover:border-rose-500 hover:shadow-rose-500/10 transition-all flex items-center justify-between group"
            >
              <div className="text-left">
                <span className="text-xs font-bold text-muted-foreground uppercase block">KIRAN Mental Health</span>
                <span className="text-xl font-black text-foreground font-mono">1800-599-0019</span>
              </div>
              <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold group-hover:scale-105 transition-transform">
                Call Toll-Free
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 bg-card border-t border-border text-muted-foreground text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-foreground">MindGuardAI</span>
            <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} All Rights Reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold">
            <button onClick={() => scrollToSection("how-it-works")} className="hover:text-foreground">Workflow</button>
            <button onClick={() => scrollToSection("features")} className="hover:text-foreground">Capabilities</button>
            <button onClick={() => scrollToSection("privacy")} className="hover:text-foreground">Privacy</button>
            <button onClick={() => scrollToSection("faq")} className="hover:text-foreground">FAQ</button>
            <Link to="/login" className="hover:text-primary">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
