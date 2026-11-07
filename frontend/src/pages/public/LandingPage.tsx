import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ArrowRight,
  Sun,
  Moon,
  ShieldCheck,
  Activity,
  HeartHandshake,
  CheckCircle2,
  PhoneCall,
  Lock,
  BarChart3,
  FileCheck2,
  Smile,
  ChevronDown,
  Menu,
  X,
  MessageSquare,
  Sparkles,
  Laptop,
  Compass,
  Clock,
  CalendarDays,
  ExternalLink,
  Shield,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How does MindBridge AI protect student privacy and data?",
    answer:
      "MindBridge AI operates under strict student data minimization principles. We enforce zero keystroke or screenshot logging, tenant database isolation, and explicit opt-in for search query analysis. Campus counselors and administrators cannot view private mood journals or unconsented records.",
  },
  {
    question: "Does the AI assistant provide a medical or clinical diagnosis?",
    answer:
      "No. MindBridge AI is an early-intervention wellness companion and clinical support bridge. It does not provide medical diagnoses or replace human therapy. It helps students reflect, offers validated self-care tools, and escalates to human university counselors when acute distress is flagged.",
  },
  {
    question: "How are the PHQ-9 and GAD-7 assessments evaluated?",
    answer:
      "Assessments follow standard clinical scoring logic published by the APA. Item 9 on the PHQ-9 triggers an immediate, compassionate safety escalation with 24/7 crisis hotlines and priority counselor review, without leaving the student without support.",
  },
  {
    question: "How does screen-time and circadian analysis work?",
    answer:
      "Using lightweight, privacy-preserving desktop and browser telemetry, MindBridge tracks foreground application active time with hardware idle filtering. Late-night computer usage past midnight is contextualized against academic deadlines to eliminate false alarms.",
  },
  {
    question: "Can students purge their records and opt out?",
    answer:
      "Yes. Students retain full sovereignty over their wellness profile. Through the Privacy & Consent Center, students can customize data retention windows (from 7 to 365 days) or permanently purge all recorded telemetry at any time.",
  },
];

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<"overview" | "chat" | "circadian">("overview");

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Scroll reveal section hooks
  const howRef = useScrollReveal();
  const featRef = useScrollReveal();
  const aiRef = useScrollReveal();
  const counselorRef = useScrollReveal();
  const privRef = useScrollReveal();
  const faqRef = useScrollReveal();

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans antialiased selection:bg-brand-orchid/20 selection:text-brand-ink transition-colors duration-200">
      
      {/* ── TOP EDITORIAL NAVIGATION ── */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/90 border-b border-border/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-card border border-border p-1 flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg tracking-tight text-foreground">
                MindBridge<span className="text-primary font-serif italic text-lg ml-0.5">AI</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium -mt-1">
                Calm Intelligence
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-muted-foreground tracking-wide">
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
              Wellness Hub
            </button>
            <button
              onClick={() => scrollToSection("ai-assistant")}
              className="hover:text-foreground transition-colors"
            >
              AI Sanctuary
            </button>
            <button
              onClick={() => scrollToSection("counselor")}
              className="hover:text-foreground transition-colors"
            >
              Counselor Care
            </button>
            <button
              onClick={() => scrollToSection("privacy")}
              className="hover:text-foreground transition-colors"
            >
              Privacy & Consent
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="hover:text-foreground transition-colors"
            >
              FAQ
            </button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors border border-transparent hover:border-border"
              title="Toggle color theme"
              aria-label="Toggle dark/light theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-primary" />}
            </button>

            <Link to="/login" className="hidden sm:inline-block">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-semibold rounded-xl hover:text-foreground"
              >
                Sign In
              </Button>
            </Link>

            <Link to="/register" className="hidden sm:inline-block">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs font-semibold shadow-xs">
                Start your journey
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="p-2 md:hidden rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileNavOpen ? <X className="w-5 h-5 text-primary" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileNavOpen && (
          <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-2xl px-4 py-4 space-y-3 shadow-xl">
            <div className="flex flex-col space-y-1 text-sm font-medium">
              <button
                onClick={() => {
                  scrollToSection("how-it-works");
                  setIsMobileNavOpen(false);
                }}
                className="text-left px-3 py-2 rounded-lg hover:bg-muted text-foreground transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => {
                  scrollToSection("features");
                  setIsMobileNavOpen(false);
                }}
                className="text-left px-3 py-2 rounded-lg hover:bg-muted text-foreground transition-colors"
              >
                Wellness Hub
              </button>
              <button
                onClick={() => {
                  scrollToSection("ai-assistant");
                  setIsMobileNavOpen(false);
                }}
                className="text-left px-3 py-2 rounded-lg hover:bg-muted text-foreground transition-colors"
              >
                AI Sanctuary
              </button>
              <button
                onClick={() => {
                  scrollToSection("privacy");
                  setIsMobileNavOpen(false);
                }}
                className="text-left px-3 py-2 rounded-lg hover:bg-muted text-foreground transition-colors"
              >
                Privacy & Ethics
              </button>
              <button
                onClick={() => {
                  scrollToSection("faq");
                  setIsMobileNavOpen(false);
                }}
                className="text-left px-3 py-2 rounded-lg hover:bg-muted text-foreground transition-colors"
              >
                FAQ
              </button>
            </div>
            <div className="pt-2 border-t border-border flex flex-col gap-2">
              <Link to="/login" onClick={() => setIsMobileNavOpen(false)}>
                <Button variant="outline" className="w-full text-xs font-semibold rounded-xl">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" onClick={() => setIsMobileNavOpen(false)}>
                <Button className="w-full bg-primary text-primary-foreground font-semibold rounded-xl text-xs">
                  Start your journey
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── 1. HERO SECTION ── */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-28 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/80 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>Editorial Wellness &bull; Calm Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.08]">
              A better connection to{" "}
              <span className="font-serif italic font-normal text-primary">your wellbeing.</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              MindBridge AI helps students understand their wellbeing, discover helpful resources and connect with the right support.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-8 rounded-xl font-semibold text-sm shadow-sm">
                  Start your journey
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={() => scrollToSection("preview")}
                className="w-full sm:w-auto rounded-xl border-border hover:bg-muted/60 text-foreground font-semibold text-sm"
              >
                Explore MindBridge
              </Button>
            </div>

            {/* Reassurance pills */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-primary" /> PHQ-9 & GAD-7 Validated
              </span>
              <span className="text-border">&bull;</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-secondary" /> Zero Keystrokes Logged
              </span>
              <span className="text-border">&bull;</span>
              <span className="flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-accent" /> Human-Led Triage Safety
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. REALISTIC PRODUCT DASHBOARD PREVIEW ── */}
      <section id="preview" className="relative py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-primary block">
            Interface Preview
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Designed for calm reflection, built for clinical trust.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Zero distracting gradients or cluttered dashboards. Every view prioritizes clarity and student agency.
          </p>
        </div>

        {/* Tab switch for preview */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            onClick={() => setPreviewTab("overview")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              previewTab === "overview"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Student Wellness Hub
          </button>
          <button
            onClick={() => setPreviewTab("chat")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              previewTab === "chat"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            AI Sanctuary Companion
          </button>
          <button
            onClick={() => setPreviewTab("circadian")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              previewTab === "circadian"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Circadian Rhythm Telemetry
          </button>
        </div>

        {/* Mockup Frame */}
        <div className="rounded-3xl border border-border bg-card shadow-lg p-4 sm:p-6 md:p-8 overflow-hidden transition-all">
          {previewTab === "overview" && (
            <div className="space-y-6">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-border gap-3">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Good afternoon, Ananya</h3>
                  <p className="text-xs text-muted-foreground">Friday, November 7 &bull; Your wellness trajectory is stable.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary/20 text-foreground border border-secondary/30">
                    ● Stable Routine
                  </span>
                </div>
              </div>

              {/* 3 Zones Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Daily Check-in */}
                <div className="p-4 rounded-2xl border border-border bg-background space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Daily Pulse</span>
                    <Smile className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-xl font-bold text-foreground">Peaceful &amp; Focused</span>
                    <p className="text-xs text-muted-foreground mt-1">Logged at 9:30 AM after morning study block.</p>
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary">Calm</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-secondary/20 text-foreground">Restorative</span>
                  </div>
                </div>

                {/* Sleep & Circadian */}
                <div className="p-4 rounded-2xl border border-border bg-background space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rest Rhythm</span>
                    <Clock className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <span className="text-xl font-bold text-foreground">7h 45m Rest</span>
                    <p className="text-xs text-muted-foreground mt-1">Sleep onset: 11:15 PM &bull; Wake: 7:00 AM</p>
                  </div>
                  <div className="text-[11px] text-accent font-medium">
                    &bull; Zero late-night circadian disruption
                  </div>
                </div>

                {/* Self-Care Pathway */}
                <div className="p-4 rounded-2xl border border-border bg-background space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Suggested Practice</span>
                    <Compass className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-base font-bold text-foreground">Box Breathing (4-4-4-4)</span>
                    <p className="text-xs text-muted-foreground mt-1">3-minute autonomic regulation reset.</p>
                  </div>
                  <Button size="sm" variant="outline" className="w-full text-xs font-semibold rounded-xl h-8">
                    Start Session
                  </Button>
                </div>
              </div>
            </div>
          )}

          {previewTab === "chat" && (
            <div className="space-y-4 max-w-2xl mx-auto py-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-background border border-border">
                <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">MindBridge AI Companion</h4>
                  <p className="text-[10px] text-muted-foreground">Confidential reflection space &bull; Non-diagnostic</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground text-xs p-3.5 rounded-2xl rounded-tr-xs max-w-md shadow-xs">
                    I’ve been feeling a bit overwhelmed by thesis deadlines this week, but yesterday I finished chapter 2.
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-background border border-border text-foreground text-xs p-3.5 rounded-2xl rounded-tl-xs max-w-md shadow-xs space-y-2">
                    <p>
                      Finishing Chapter 2 is a significant milestone! It sounds like the pressure is still lingering, but taking that step is tangible progress.
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      Would you like to try a short grounding exercise to unwind your mind before continuing?
                    </p>
                    <div className="pt-1 flex gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-secondary/20 text-foreground border border-secondary/30">
                        Box Breathing (3m)
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-muted text-foreground">
                        Reflect on progress
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {previewTab === "circadian" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h4 className="text-sm font-bold text-foreground">Cross-Platform Activity &amp; Screen Phenotyping</h4>
                  <p className="text-xs text-muted-foreground">Authentic physical idle-filtered telemetry &bull; Zero synthetic estimates</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                  ● Telemetry Synchronized
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-border bg-background">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Focus Time</span>
                  <div className="text-2xl font-bold text-foreground mt-1">4h 12m</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">82% Academic &amp; Research tools</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-background">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Physical Idle Duration</span>
                  <div className="text-2xl font-bold text-foreground mt-1">1h 45m</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Natural desk breaks detected</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-background">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Midnight Disruption</span>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">0 mins</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Screen off before 11:30 PM</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 3. HOW IT WORKS ── */}
      <section id="how-it-works" ref={howRef as React.RefObject<HTMLElement>} className="py-24 border-t border-border bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary block">
              Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              A gentle bridge from daily habits to clinical support.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              MindBridge AI continuously supports your self-reflection without intrusive surveillance or overwhelming notifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <span className="font-serif italic text-3xl text-primary font-normal block">01</span>
              <h3 className="text-lg font-bold text-foreground">Frictionless Daily Pulse</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Log quick emotional pulses, sleep rhythm, or journal thoughts. The interface adapts to how much or how little you wish to share.
              </p>
            </Card>

            <Card className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <span className="font-serif italic text-3xl text-primary font-normal block">02</span>
              <h3 className="text-lg font-bold text-foreground">Intelligent Explainability</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Understand the factors shaping your stress. Our explainable models correlate academic crunch, screen time, and sleep irregularity without black-box scores.
              </p>
            </Card>

            <Card className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <span className="font-serif italic text-3xl text-primary font-normal block">03</span>
              <h3 className="text-lg font-bold text-foreground">Human-Led Connection</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If distress indicators accumulate, MindBridge gently connects you with university counselors, scheduling private appointments with consent-aware context.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ── 4. STUDENT WELLNESS FEATURES ── */}
      <section id="features" ref={featRef as React.RefObject<HTMLElement>} className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-primary block">
            Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Comprehensive tools for daily balance.
          </h2>
          <p className="text-sm text-muted-foreground">
            Everything you need to observe patterns, restore calm, and thrive academically.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Validated Screeners</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Take gold-standard PHQ-9 (depression) and GAD-7 (anxiety) assessments with longitudinal progression tracking.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 text-foreground flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Circadian Balance</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Detect late-night study strain and sleep deficit using authentic physical device power &amp; awake telemetry.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Guided Regulation</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Instant access to diaphragmatic breathing, 5-4-3-2-1 grounding, and progressive muscle relaxation exercises.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Consent Controls</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Granular toggles to enable or disable app, web, or search telemetry with complete student audit rights.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. AI ASSISTANT SANCTUARY ── */}
      <section id="ai-assistant" ref={aiRef as React.RefObject<HTMLElement>} className="py-24 border-t border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-[11px] font-semibold text-primary uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Wellness Companion</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
              A safe, confidential space to <span className="font-serif italic text-primary">reflect at any hour.</span>
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Available 24/7 for emotional processing, stress reframing, and guided micro-practices. Grounded in clinical boundaries, the assistant never pretends to diagnose mental illness or replace human connection.
            </p>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Strict privacy &bull; Conversations never shared with third parties or advertisers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Immediate crisis-line escalation if self-harm or suicidal intent is indicated</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Supportive markdown formatting with one-click coping exercises</span>
              </div>
            </div>
            <div>
              <Link to="/register">
                <Button className="rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs">
                  Experience the AI Assistant
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">MindBridge Reflection</h4>
                  <p className="text-[10px] text-muted-foreground">Active Session</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded-md bg-muted">
                Non-diagnostic AI
              </span>
            </div>
            <div className="space-y-3">
              <div className="bg-muted/50 p-3 rounded-2xl rounded-tl-xs text-xs text-foreground leading-relaxed">
                "Hello! How are you holding up today? We can talk through what's on your mind, or do a quick 2-minute breathing exercise together."
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button className="text-[11px] px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted font-medium transition-colors">
                  I'm feeling anxious about finals
                </button>
                <button className="text-[11px] px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted font-medium transition-colors">
                  Guide me through box breathing
                </button>
                <button className="text-[11px] px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted font-medium transition-colors">
                  Reflect on my sleep trends
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. COUNSELOR SUPPORT ── */}
      <section id="counselor" ref={counselorRef as React.RefObject<HTMLElement>} className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-primary block">
            Clinical Care
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Proactive triage for university staff.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Eliminate long waitlists and passive discovery. University counseling staff receive organized, consent-verified queues to prioritize students facing acute distress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Priority Warning Queue</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Automated escalation flags students who score high on PHQ-9 Item 9 or show severe circadian disintegration, prioritizing outreach.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Consent-Aware Dossiers</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Counselors only view longitudinal trends that the student explicitly agreed to share. Private notes remain restricted and audited.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Streamlined Appointments</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Book confidential 30 or 50-minute clinical sessions directly through the portal with automated reminders and follow-up plans.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7. PRIVACY AND SECURITY ── */}
      <section id="privacy" ref={privRef as React.RefObject<HTMLElement>} className="py-24 border-t border-border bg-card/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary block">
              Ethical Guardrails
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Your mind is your own.
            </h2>
            <p className="text-sm text-muted-foreground">
              Designed from the ground up to respect student autonomy, dignity, and legal rights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
              <div className="flex items-center gap-2.5 font-bold text-foreground text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Zero Keystroke &amp; Screenshot Logging</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                MindBridge never records individual keystrokes, personal messages, or screen captures. Foreground time is tracked at the window title category level only.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
              <div className="flex items-center gap-2.5 font-bold text-foreground text-sm">
                <Lock className="w-4 h-4 text-emerald-500" />
                <span>Institutional K-Anonymity (k &ge; 10)</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Administrators view aggregated campus stress indices only when at least 10 student responses are pooled. Individual student identity cannot be reverse-engineered.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
              <div className="flex items-center gap-2.5 font-bold text-foreground text-sm">
                <Compass className="w-4 h-4 text-emerald-500" />
                <span>Student Retention Sovereignty</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose your data retention window from 7 to 365 days. Purge your search history or completely delete your telemetry at the click of a button.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
              <div className="flex items-center gap-2.5 font-bold text-foreground text-sm">
                <FileCheck2 className="w-4 h-4 text-emerald-500" />
                <span>FERPA, HIPAA &amp; GDPR Aligned</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Encrypted in transit (TLS 1.3) and at rest (AES-256) with role-based access control and immutable audit trails for clinical safety events.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. FREQUENTLY ASKED QUESTIONS ── */}
      <section id="faq" ref={faqRef as React.RefObject<HTMLElement>} className="py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-primary block">
            Questions &amp; Answers
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-muted-foreground">
            Transparent answers on privacy, safety boundaries, and counselor care.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-border bg-card overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-foreground hover:bg-muted/40 transition-colors"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                    openFaq === idx ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="p-5 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border/50">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 9. CRISIS SUPPORT HELPLINES BANNER ── */}
      <section id="helplines" className="py-12 border-t border-border bg-rose-500/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
              <PhoneCall className="w-4 h-4" />
              <span>Immediate 24/7 Crisis Support Resources</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              If you or someone you know is in acute distress or having thoughts of self-harm, confidential free help is available right now:
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <a
              href="tel:988"
              className="px-4 py-2 rounded-xl bg-card border border-rose-500/30 text-foreground font-semibold text-xs hover:border-rose-500 transition-all shadow-xs"
            >
              988 Suicide &amp; Crisis Lifeline (US/CAN)
            </a>
            <a
              href="tel:14416"
              className="px-4 py-2 rounded-xl bg-card border border-rose-500/30 text-foreground font-semibold text-xs hover:border-rose-500 transition-all shadow-xs"
            >
              Tele-MANAS: 14416 (India)
            </a>
            <a
              href="tel:18005990019"
              className="px-4 py-2 rounded-xl bg-card border border-rose-500/30 text-foreground font-semibold text-xs hover:border-rose-500 transition-all shadow-xs"
            >
              KIRAN: 1800-599-0019
            </a>
          </div>
        </div>
      </section>

      {/* ── 10. FOOTER ── */}
      <footer className="border-t border-border bg-card py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-card border border-border p-1 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground">
                MindBridge<span className="text-primary font-serif italic text-base ml-0.5">AI</span>
              </span>
              <p className="text-[11px] text-muted-foreground">&copy; 2026 MindBridge AI. Calm Intelligence for Student Wellbeing.</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-muted-foreground font-medium">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link to="/login" className="hover:text-foreground transition-colors">
              Student Sign In
            </Link>
            <Link to="/register" className="hover:text-foreground transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
