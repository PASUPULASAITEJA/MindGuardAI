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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useCountUp } from "@/hooks/useCountUp";
import { GlowOrb } from "@/components/ui/GlowOrb";
import { BioNeuralSynapseMesh } from "@/components/ui/BioNeuralSynapseMesh";

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
      {/* ── PERSISTENT FULL-PAGE NEURAL SYNAPSE BACKGROUND (TOP TO BOTTOM) ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <BioNeuralSynapseMesh className="w-full h-full" />
      </div>

      {/* ── TOP NAVBAR ── */}
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
              onClick={() => scrollToSection("faq")}
              className="hover:text-foreground transition-colors"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection("helplines")}
              className="hover:text-foreground transition-colors"
            >
              Crisis Lines
            </button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Toggle theme"
              aria-label="Toggle dark/light theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link to="/login" className="hidden sm:inline-block">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs sm:text-sm font-semibold rounded-lg hover:text-primary"
              >
                Sign In
              </Button>
            </Link>

            <Link to="/login" className="hidden sm:inline-block">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs sm:text-sm font-semibold shadow-xs">
                Student Portal
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="p-2 md:hidden rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileNavOpen ? <X className="w-5 h-5 text-primary" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileNavOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl px-4 py-4 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
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
                <Button className="w-full bg-primary text-primary-foreground font-semibold rounded-lg text-sm shadow-xs">
                  Student Portal
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ── */}
      <section className="hero-gradient relative min-h-screen flex items-center border-b border-border overflow-hidden py-12 sm:py-20 lg:py-0">
        {/* Glow orbs — decorative depth */}
        <GlowOrb
          size={500}
          variant="primary"
          className="top-[-100px] right-[-100px] opacity-40 pointer-events-none"
        />
        <GlowOrb
          size={300}
          variant="purple"
          className="bottom-[-50px] left-[-50px] opacity-25 pointer-events-none"
        />

        {/* Content — relative z-10 so it sits above canvas */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 w-full grid lg:grid-cols-2 gap-8 lg:gap-12 items-center py-12 sm:py-16 lg:py-24">
          {/* Left: text */}
          <div>
            <div className="fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-4 sm:mb-6 max-w-full">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="truncate">Autonomous Neural Synapse Architecture</span>
            </div>

            <h1 className="fade-up-1 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Detect Burnout
              <span className="gradient-text block">Before It Becomes</span>
              a Crisis.
            </h1>

            <p className="fade-up-2 text-sm sm:text-base lg:text-lg text-muted-foreground max-w-lg mt-4 sm:mt-6 leading-relaxed">
              MindGuardAI continuously monitors student wellbeing signals — emotion analysis,
              sleep patterns, and clinical screeners — to surface early warnings weeks before students reach breaking point.
            </p>

            <div className="fade-up-3 flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8">
              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-7 rounded-xl shadow-md shadow-primary/20"
                >
                  Enter Student Portal
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={() => scrollToSection("how-it-works")}
                className="w-full sm:w-auto font-semibold text-muted-foreground hover:text-foreground px-6 rounded-xl border-border"
              >
                Explore Capabilities ↓
              </Button>
            </div>

            {/* Trust badges */}
            <div className="fade-up-4 flex flex-wrap items-center gap-4 sm:gap-6 mt-8 sm:mt-10 pt-6 border-t border-border/80 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-primary shrink-0" />
                <span>PHQ-9 & GAD-7 Validated</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-primary shrink-0" />
                <span>SHAP Explainable AI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Zero-Keystroke Privacy</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — Responsive Glassmorphic Telemetry HUD on Phone and Desktop */}
          <div className="flex flex-col justify-center relative fade-up-2 mt-4 lg:mt-0">
            <div className="relative rounded-2xl bg-card/50 backdrop-blur-md border border-border/80 shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-border/60">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-foreground">Live Telemetry Synchrony</h3>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground">Autonomous Neural Signal Mesh</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] sm:text-xs font-semibold shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Synchronized</span>
                </div>
              </div>

              {/* Multimodal Telemetry Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="p-2.5 sm:p-3.5 rounded-xl bg-background/60 border border-border/60 space-y-1">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground tracking-wider block truncate">
                    Cognitive Sentiment
                  </span>
                  <p className="text-base sm:text-xl font-extrabold text-foreground">Positive (88%)</p>
                  <p className="text-[10px] sm:text-[11px] text-primary flex items-center gap-1">
                    <span>NLP DistilBERT 6-Class</span>
                  </p>
                </div>

                <div className="p-2.5 sm:p-3.5 rounded-xl bg-background/60 border border-border/60 space-y-1">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground tracking-wider block truncate">
                    Circadian Rhythm
                  </span>
                  <p className="text-base sm:text-xl font-extrabold text-blue-500">7.4h Regular</p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">Fragmentation 0.12</p>
                </div>

                <div className="p-2.5 sm:p-3.5 rounded-xl bg-background/60 border border-border/60 space-y-1">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground tracking-wider block truncate">
                    Screen Time
                  </span>
                  <p className="text-base sm:text-xl font-extrabold text-emerald-500">Balanced</p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">Zero-keystroke</p>
                </div>

                <div className="p-2.5 sm:p-3.5 rounded-xl bg-background/60 border border-border/60 space-y-1">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground tracking-wider block truncate">
                    Risk Tier
                  </span>
                  <p className="text-base sm:text-xl font-extrabold text-emerald-500">Low (0.14)</p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">PHQ-9 Validated</p>
                </div>
              </div>

              {/* Status footer with action potentials notice */}
              <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-border/60 text-[11px] sm:text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  Active Synaptic Axon Links
                </span>
                <span className="font-mono text-[11px] text-foreground font-semibold">120+ Nodes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS SECTION ── */}
      <section
        id="how-it-works"
        ref={howRef as React.RefObject<HTMLElement>}
        className="relative z-10 py-24 px-4 sm:px-6 max-w-7xl mx-auto"
      >
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="reveal text-xs font-bold uppercase tracking-wider text-primary block">
            Proactive Architecture
          </span>
          <h2 className="reveal text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            How MindGuardAI Protects Students
          </h2>
          <p className="reveal text-sm text-muted-foreground">
            A continuous, non-intrusive clinical safety net that bridges daily campus living with proactive mental healthcare.
          </p>
        </div>

        <div className="reveal-group grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 01 */}
          <Card className="reveal card-hover relative bg-card border border-border rounded-2xl shadow-xs transition-all">
            <CardContent className="p-6 space-y-4">
              <span className="text-2xl font-mono font-extrabold text-muted-foreground/30 block">
                01
              </span>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Smile className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Daily Check-in</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Students log 30-second mood pulse, sleep hours, and journal notes. Frictionless reflection cultivates personal self-awareness.
              </p>
            </CardContent>
          </Card>

          {/* Step 02 */}
          <Card className="reveal card-hover relative bg-card border border-border rounded-2xl shadow-xs transition-all">
            <CardContent className="p-6 space-y-4">
              <span className="text-2xl font-mono font-extrabold text-muted-foreground/30 block">
                02
              </span>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">AI Emotion Analysis</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fine-tuned DistilBERT models classify affective sentiment across 6 distinct states, detecting subtle linguistic distress cues.
              </p>
            </CardContent>
          </Card>

          {/* Step 03 */}
          <Card className="reveal card-hover relative bg-card border border-border rounded-2xl shadow-xs transition-all">
            <CardContent className="p-6 space-y-4">
              <span className="text-2xl font-mono font-extrabold text-muted-foreground/30 block">
                03
              </span>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Risk Stratification</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Machine learning models synthesize mood trajectories, sleep deficits, and academic load into calibrated Low, Moderate, or High tiers.
              </p>
            </CardContent>
          </Card>

          {/* Step 04 */}
          <Card className="reveal card-hover relative bg-card border border-border rounded-2xl shadow-xs transition-all">
            <CardContent className="p-6 space-y-4">
              <span className="text-2xl font-mono font-extrabold text-muted-foreground/30 block">
                04
              </span>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
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

      {/* ── CAPABILITIES SECTION ── */}
      <section
        id="features"
        ref={featRef as React.RefObject<HTMLElement>}
        className="relative z-10 py-24 px-4 sm:px-6 bg-secondary/35 backdrop-blur-xs border-y border-border"
      >
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="reveal text-xs font-bold uppercase tracking-wider text-primary block">
              Core Architecture
            </span>
            <h2 className="reveal text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Clinical Science & Explainable Intelligence
            </h2>
            <p className="reveal text-sm text-muted-foreground">
              Every algorithm, data pipeline, and triage policy was engineered in accordance with psychiatric validation standards.
            </p>
          </div>

          {/* 6 feature cards each with reveal card-hover */}
          <div className="reveal-group grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="reveal card-hover bg-card border border-border rounded-2xl shadow-xs transition-all">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="text-xl" role="img" aria-label="brain">🧠</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">Emotion NLP</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  DistilBERT 6-class classifier accurately detects joy, sadness, anxiety, anger, fear, and surprise from journal submissions with high precision.
                </p>
              </CardContent>
            </Card>

            <Card className="reveal card-hover bg-card border border-border rounded-2xl shadow-xs transition-all">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="text-xl" role="img" aria-label="bar chart">📊</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">SHAP Explainability</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Every score explained, not a black box. Students and clinical counselors see the precise biometric and survey factors driving every prediction.
                </p>
              </CardContent>
            </Card>

            <Card className="reveal card-hover bg-card border border-border rounded-2xl shadow-xs transition-all">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <span className="text-xl" role="img" aria-label="emergency siren">🚨</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">Emergency SOS</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  24/7 crisis escalation with Tele-MANAS (14416) & KIRAN helplines. One-click emergency protocols bypass queues to reach immediate human responders.
                </p>
              </CardContent>
            </Card>

            <Card className="reveal card-hover bg-card border border-border rounded-2xl shadow-xs transition-all">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="text-xl" role="img" aria-label="sleeping face">😴</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">Sleep & Circadian</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Kernel-power Windows telemetry and self-reported sleep records analyze sleep debt and late-night fragmentation without capturing keystrokes.
                </p>
              </CardContent>
            </Card>

            <Card className="reveal card-hover bg-card border border-border rounded-2xl shadow-xs transition-all">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="text-xl" role="img" aria-label="stethoscope">🩺</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">Counselor Triage</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Priority queue with 5-tab case workspace enables university psychologists to review psychometric trends, log SOAP notes, and initiate outreach.
                </p>
              </CardContent>
            </Card>

            <Card className="reveal card-hover bg-card border border-border rounded-2xl shadow-xs transition-all">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
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

      {/* ── STATS SECTION ── */}
      <section
        ref={s1.ref as React.RefObject<HTMLElement>}
        className="stats-gradient relative z-10 py-20 overflow-hidden"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center max-w-4xl mx-auto px-6 relative z-10">
          <div>
            <p className="text-5xl font-black text-white">
              {s1.value}%
            </p>
            <p className="text-xs text-white/60 uppercase tracking-wider font-semibold mt-1">
              Risk Accuracy
            </p>
          </div>
          <div>
            <p className="text-5xl font-black text-white">
              {s2.value.toLocaleString()}+
            </p>
            <p className="text-xs text-white/60 uppercase tracking-wider font-semibold mt-1">
              Students Monitored
            </p>
          </div>
          <div>
            <p className="text-5xl font-black text-white">
              {s3.value}
            </p>
            <p className="text-xs text-white/60 uppercase tracking-wider font-semibold mt-1">
              Emotion Classes
            </p>
          </div>
          <div>
            <p className="text-5xl font-black text-white">
              {s4.value}
            </p>
            <p className="text-xs text-white/60 uppercase tracking-wider font-semibold mt-1">
              Risk Tiers
            </p>
          </div>
        </div>
      </section>

      {/* ── PRIVACY SECTION ── */}
      <section
        id="privacy"
        ref={privRef as React.RefObject<HTMLElement>}
        className="relative z-10 py-24 px-4 sm:px-6 bg-secondary/35 backdrop-blur-xs"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="reveal inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Institutional Privacy Safeguard</span>
            </div>
            <h2 className="reveal text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Zero-Keystroke Privacy by Design
            </h2>
            <p className="reveal text-sm text-muted-foreground leading-relaxed">
              We firmly believe mental healthcare cannot function under surveillance. MindGuardAI collects no keystroke logs, no screen captures, and no private message contents. Telemetry is limited to kernel sleep cycles and consented mood journals.
            </p>
            <p className="reveal text-sm text-muted-foreground leading-relaxed">
              University administrators only receive k-anonymized aggregate cohort reports (k ≥ 10), ensuring no single student can ever be singled out.
            </p>
          </div>

          {/* Right Column: 4 checklist items */}
          <div className="reveal-group lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="reveal card-hover flex items-start gap-3 p-5 rounded-2xl bg-card border border-border shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">Zero Keystroke Logging</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  No text typed in external applications is ever monitored, logged, or sent to server memory.
                </p>
              </div>
            </div>

            <div className="reveal card-hover flex items-start gap-3 p-5 rounded-2xl bg-card border border-border shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">AES-256-GCM Encryption</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  All clinical journals and screening records are secured with cryptographic tenant isolation.
                </p>
              </div>
            </div>

            <div className="reveal card-hover flex items-start gap-3 p-5 rounded-2xl bg-card border border-border shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">Differential Privacy & k ≥ 10</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Campus-wide dashboards suppress small group data to mathematically prevent re-identification.
                </p>
              </div>
            </div>

            <div className="reveal card-hover flex items-start gap-3 p-5 rounded-2xl bg-card border border-border shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">Data Revocation & Purge</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Students retain full ownership to download, modify, or permanently purge their data at any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section
        id="faq"
        ref={faqRef as React.RefObject<HTMLElement>}
        className="relative z-10 py-24 px-4 sm:px-6 max-w-4xl mx-auto space-y-10"
      >
        <div className="text-center space-y-3">
          <span className="reveal text-xs font-bold uppercase tracking-wider text-primary block">
            Questions & Answers
          </span>
          <h2 className="reveal text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="reveal text-sm text-muted-foreground">
            Clear, transparent answers about student privacy, clinical ethics, and AI governance.
          </p>
        </div>

        <div className="reveal-group space-y-4">
          {faqs.map((f, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={i}
                className="reveal card-hover bg-card border border-border rounded-2xl p-6 transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full text-left flex items-center justify-between gap-4 font-semibold text-foreground text-sm sm:text-base focus:outline-hidden"
                >
                  <span>{f.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed pt-2 border-t border-border/60">
                    {f.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CRISIS HELPLINES ── */}
      <section id="helplines" className="relative z-10 py-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="p-6 sm:p-8 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
            <PhoneCall className="w-6 h-6 pulse-soft" />
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
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-500 text-white font-bold text-sm shadow-sm hover:bg-rose-600 transition-colors"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Tele-MANAS Helpline: 14416</span>
            </a>
            <a
              href="tel:18005990019"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-secondary border border-border text-foreground font-semibold text-sm hover:bg-secondary/80 transition-colors"
            >
              <PhoneCall className="w-4 h-4 text-rose-500" />
              <span>KIRAN Mental Health: 1800-599-0019</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-border bg-card/85 backdrop-blur-md py-12 px-4 sm:px-6">
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
                <Link to="/student/privacy" className="hover:text-primary transition-colors">
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
                <button
                  onClick={() => scrollToSection("faq")}
                  className="hover:text-primary transition-colors"
                >
                  FAQ
                </button>
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
