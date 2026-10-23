import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Shield,
  Activity,
  HeartHandshake,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  Users,
  Compass,
  Zap,
  GraduationCap,
  ChevronRight,
  BarChart3,
  Lock,
  MessageSquare,
  Sparkles,
  PhoneCall,
  Clock,
  Brain,
  MoonStar,
  Check,
  Building2,
  HelpCircle,
  Eye,
  Sliders,
  Layers,
  Laptop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NeuralBrain3D } from "@/components/3d/NeuralBrain3D";

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [heroTab, setHeroTab] = useState<"dashboard" | "brain">("dashboard");

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Subtle Ambient Background Gradient */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/15 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-500/15 dark:bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-[32rem] h-[32rem] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-indigo-600 dark:from-white dark:to-indigo-400 bg-clip-text text-transparent">
                MindGuard<span className="text-indigo-600 dark:text-indigo-400">AI</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold -mt-1">
                Student Wellbeing
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("impact")}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Impact
            </button>
            <button
              onClick={() => scrollToSection("testimonials")}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Testimonials
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Tiers
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link to="/login">
              <Button
                variant="ghost"
                className="hidden sm:inline-flex text-sm font-semibold rounded-xl hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                Sign In
              </Button>
            </Link>

            <Link to="/register">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 text-sm font-semibold transition-transform hover:scale-105">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-6 shadow-xs animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Next-Generation Campus Mental Health Telemetry</span>
          <span className="w-1 h-1 rounded-full bg-indigo-400" />
          <span className="text-slate-500 dark:text-slate-400 font-normal">v2.4 Active</span>
        </div>

        {/* Hero Headline & Subhead */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white max-w-4xl leading-[1.12]">
          Your Campus. Your Wellbeing.{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">
            Detected Early.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          MindGuardAI continuously monitors student mental wellness signals and surfaces early
          warnings — before burnout becomes a crisis.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Button
            size="lg"
            onClick={() => navigate("/register")}
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/25 transition-all hover:scale-105"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => scrollToSection("how-it-works")}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl border-slate-300 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all"
          >
            See How It Works
          </Button>
        </div>

        {/* View Mode Switcher */}
        <div className="mt-12 inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium">
          <button
            onClick={() => setHeroTab("dashboard")}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              heroTab === "dashboard"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Laptop className="w-3.5 h-3.5 text-indigo-500" />
            <span>Interactive Platform Preview</span>
          </button>
          <button
            onClick={() => setHeroTab("brain")}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              heroTab === "brain"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-indigo-500" />
            <span>3D Neural Particle Visualizer</span>
          </button>
        </div>

        {/* HERO VISUAL: Floating Dashboard Mockup or 3D Neural Brain */}
        <div className="mt-6 w-full max-w-5xl rounded-2xl p-2 bg-gradient-to-b from-slate-200/60 to-slate-300/40 dark:from-slate-800/60 dark:to-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-indigo-500/10 transition-all">
          {heroTab === "dashboard" ? (
            <div className="w-full bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 text-left">
              {/* Browser chrome header */}
              <div className="h-10 px-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1 bg-white dark:bg-slate-900 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-800">
                  <Lock className="w-3 h-3 text-emerald-500 inline" />
                  <span>mindguard.campus.edu/student/dashboard</span>
                </div>
                <div className="text-xs text-slate-400 font-medium">Live Telemetry</div>
              </div>

              {/* Mockup Dashboard Content */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Stat 1: Wellness Ring */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Wellness Index</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">84 / 100</p>
                    <span className="inline-flex items-center text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                      +4.2% stable baseline
                    </span>
                  </div>
                  <div className="w-14 h-14 rounded-full border-4 border-indigo-500 border-t-purple-400 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400">
                    84%
                  </div>
                </div>

                {/* Stat 2: Circadian Sleep */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500">Sleep Health</p>
                    <MoonStar className="w-4 h-4 text-indigo-500" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">7.4 hrs</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Optimal REM restoration</p>
                </div>

                {/* Stat 3: Risk Stratification */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500">Risk Matrix</p>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      LOW RISK
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">PHQ-9: 3</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Sub-clinical mild anxiety</p>
                </div>

                {/* Chart Preview & AI Chat prompt */}
                <div className="md:col-span-2 p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        30-Day Longitudinal Mood Trajectory
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">SHAP Explainable</span>
                  </div>
                  <div className="h-28 flex items-end gap-2 pt-4">
                    {[65, 70, 68, 74, 80, 78, 82, 85, 79, 84, 88, 84].map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-md transition-all hover:opacity-80"
                          style={{ height: `${val}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Companion Micro-Card */}
                <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <p className="text-xs font-bold uppercase tracking-wider text-indigo-100">AI Companion</p>
                    </div>
                    <p className="text-sm font-semibold mt-2">"You've kept consistent sleep for 4 nights. Ready for exam week?"</p>
                  </div>
                  <Link to="/student" className="mt-4">
                    <Button size="sm" className="w-full bg-white text-indigo-700 hover:bg-slate-100 font-semibold text-xs rounded-lg">
                      Open Student Chat
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-[460px] bg-slate-950 rounded-xl overflow-hidden relative flex items-center justify-center">
              <NeuralBrain3D className="w-full h-full" interactive={true} autoRotate={true} />
            </div>
          )}
        </div>
      </section>

      {/* 2. SOCIAL PROOF BAR */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Trusted by students & counselors across
            </p>
            <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              3+ Leading Educational Institutions
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 text-slate-600 dark:text-slate-400 font-bold text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <span>NMIMS University</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-500" />
              <span>Campus Wellness Labs</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-base">2,400+</span>
              <span>Students Monitored</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Seamless Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mt-2">
            How MindGuardAI Protects Students
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            A three-step clinical and behavioral pipeline engineered for early detection without intrusive surveillance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="relative p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg mb-6">
              1
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Daily Check-In</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-3 leading-relaxed">
              30-second mood micro check-ins, sleep tracking, and optional non-invasive PC study telemetry logs.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg mb-6">
              2
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI Analysis & SHAP</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-3 leading-relaxed">
              Fine-tuned DistilBERT and Random Forest models evaluate risk trajectory with transparent factor attribution.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg mb-6">
              3
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Guided Support</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-3 leading-relaxed">
              Instant CBT coping exercises, 24/7 AI companion dialogue, or confidential escalation to campus counselors.
            </p>
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION (6-Card Bento Grid) */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Comprehensive Suite
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mt-2">
            Built for Modern Campus Mental Health
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            Clinical-grade psychometrics, transparent explainability, and enterprise-grade privacy protection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Companion & CBT Chatbot</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              Always-on empathetic conversational partner providing evidence-based cognitive reframing and de-escalation.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">SHAP Explainability</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              Transparent feature attribution showing exact drivers of wellness shifts instead of opaque black-box scores.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Emergency SOS Gateway</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              Zero-latency access to 24/7 crisis hotlines (Tele-MANAS, Vandrevala Foundation) and campus counselor dispatch.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <MoonStar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Circadian Sleep Tracking</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              Longitudinal sleep deficit modeling connected with academic deadlines to flag burnout before exam cycles.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Counselor Triage Portal</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              Prioritized caseload dashboards with confidential clinical case notes and intervention scheduling.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Privacy-First Architecture</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              Granular consent management, zero keystroke logging, and k-anonymity aggregation for campus leadership.
            </p>
          </div>
        </div>
      </section>

      {/* 5. STATS / IMPACT SECTION (Full-Width Dark Background) */}
      <section id="impact" className="py-20 bg-slate-900 text-white border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl sm:text-5xl font-extrabold text-indigo-400">99.2%</p>
              <p className="text-sm text-slate-300 font-medium mt-2">Risk Stratification Accuracy</p>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-extrabold text-purple-400">&lt; 100ms</p>
              <p className="text-sm text-slate-300 font-medium mt-2">API Inference Latency</p>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-extrabold text-emerald-400">24/7</p>
              <p className="text-sm text-slate-300 font-medium mt-2">Instant SOS Lifeline Routing</p>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-extrabold text-amber-400">0</p>
              <p className="text-sm text-slate-300 font-medium mt-2">Keystrokes or Screens Logged</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS SECTION */}
      <section id="testimonials" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Real Stories
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mt-2">
            Trusted by the Campus Community
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            Hear how MindGuardAI has made proactive mental healthcare accessible and confidential.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Testimonial 1 */}
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed italic">
              "During midterms I was barely sleeping and didn't realize how anxious I had become. MindGuard flagged my
              sleep deficit early and the box breathing exercises helped me regain control."
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center text-sm">
                AK
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Aarav K.</p>
                <p className="text-xs text-slate-500">Computer Science Student</p>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed italic">
              "The triage matrix allows our campus counseling center to reach students who need help most before they
              reach critical distress. It has completely transformed our workflow."
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 font-bold flex items-center justify-center text-sm">
                DR
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Dr. Radhika M.</p>
                <p className="text-xs text-slate-500">Lead Campus Counselor</p>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed italic">
              "As an administrator, student privacy was non-negotiable. MindGuard gives us campus-wide health trends under
              strict k-anonymity without ever compromising individual trust."
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold flex items-center justify-center text-sm">
                VS
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Prof. Vikram S.</p>
                <p className="text-xs text-slate-500">Dean of Student Welfare</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRICING / TIERS SECTION */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Flexible Deployment
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mt-2">
            Tailored for Campuses of Every Scale
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            Transparent access designed for individual students and enterprise university systems.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Tier 1: Student Free */}
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Student</h3>
              <p className="text-xs text-slate-500 mt-1">For individual learners</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">Free</span>
                <span className="text-xs text-slate-500">/ forever</span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Daily mood check-ins & journaling</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>24/7 AI Companion & CBT tools</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Instant Emergency SOS gateway</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Self-guided sleep tracker</span>
                </li>
              </ul>
            </div>
            <Link to="/register" className="mt-8">
              <Button variant="outline" className="w-full rounded-xl font-semibold">
                Start Free
              </Button>
            </Link>
          </div>

          {/* Tier 2: Institution (Featured) */}
          <div className="p-8 rounded-2xl bg-gradient-to-b from-indigo-50/50 to-purple-50/40 dark:from-slate-900 dark:to-indigo-950/40 border-2 border-indigo-500 shadow-lg relative flex flex-col justify-between">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
              Most Popular
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Institution</h3>
              <p className="text-xs text-slate-500 mt-1">For university counseling teams</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">Contact Us</span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-500" />
                  <span>Everything in Student tier</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-500" />
                  <span>Counselor triage dashboard & case files</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-500" />
                  <span>SHAP explainable risk attribution</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-500" />
                  <span>k-Anonymity campus aggregate analytics</span>
                </li>
              </ul>
            </div>
            <Link to="/login" className="mt-8">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-600/20">
                Contact Campus Team
              </Button>
            </Link>
          </div>

          {/* Tier 3: Enterprise */}
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Enterprise</h3>
              <p className="text-xs text-slate-500 mt-1">For multi-campus state university systems</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">Custom</span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Multi-campus tenant partitioning</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Dedicated on-premise / private cloud deploy</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Custom SIS (Banner/Canvas) integrations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>24/7 dedicated clinical SLA</span>
                </li>
              </ul>
            </div>
            <Link to="/login" className="mt-8">
              <Button variant="outline" className="w-full rounded-xl font-semibold">
                Schedule Consultation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FINAL CTA SECTION */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Ready to protect your campus?</h2>
            <p className="mt-4 text-indigo-200 text-base">
              Join forward-thinking universities adopting proactive, student-first mental health intelligence today.
            </p>
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/register")}
                className="px-8 py-3.5 bg-white text-indigo-900 hover:bg-slate-100 rounded-xl font-bold shadow-lg transition-transform hover:scale-105"
              >
                Request a Demo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white">
                <Brain className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-slate-900 dark:text-white">MindGuardAI</span>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Predictive, privacy-first mental health intelligence platform for higher education. Bridging student distress
              with compassionate clinical care.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Product</p>
            <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button onClick={() => scrollToSection("features")} className="hover:text-indigo-600">
                  AI Companion
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection("features")} className="hover:text-indigo-600">
                  SHAP Explainability
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection("features")} className="hover:text-indigo-600">
                  Counselor Triage
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection("features")} className="hover:text-indigo-600">
                  Emergency SOS
                </button>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Resources</p>
            <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/student" className="hover:text-indigo-600">
                  Self-Care Tools
                </Link>
              </li>
              <li>
                <a href="/docs/ML.md" className="hover:text-indigo-600">
                  Clinical Validation
                </a>
              </li>
              <li>
                <a href="/docs/API.md" className="hover:text-indigo-600">
                  API Documentation
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Legal & Privacy</p>
            <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/privacy-consent" className="hover:text-indigo-600">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/privacy-consent" className="hover:text-indigo-600">
                  Consent Settings
                </Link>
              </li>
              <li>
                <a href="/docs/DATA_RETENTION_POLICY.md" className="hover:text-indigo-600">
                  Data Retention
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} MindGuardAI Inc. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Built with care for campus mental health • Confidential & Secure</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
