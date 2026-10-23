import React from "react";
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
  Laptop,
  Building2,
  Lock,
  MessageSquare,
  Sparkles,
  PhoneCall,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "motion/react";
import { pageVariants, staggerContainer, cardEntrance, cardHoverMotion, buttonTapMotion } from "@/utils/motion";
import { WellnessOrb } from "@/components/3d/WellnessOrb";
import { AmbientParticles } from "@/components/3d/AmbientParticles";
import { BinaryOrbits } from "@/components/3d/BinaryOrbits";

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const faqs = [
    {
      q: "Can professors or college administrators read my private journal reflections?",
      a: "No. All journal reflections and chatbot interactions are strictly confidential to the student. Institutional administrators only have visibility into anonymized, aggregate campus wellness trends under k-anonymity compliance."
    },
    {
      q: "Does the MindGuard desktop telemetry agent capture keystrokes or screen content?",
      a: "Zero keystrokes, zero webcam streams, and zero screen content are captured. The background agent strictly monitors active application category metadata (e.g., Development/IDE vs Leisure) and idle timers to assist circadian rhythm and burnout detection."
    },
    {
      q: "How does the emergency support pathway operate?",
      a: "When a student indicates acute distress or clicks Crisis Support, immediate escalation pathways to campus counselling and 24/7 national hotlines (including Tele-MANAS 14416) are presented instantly."
    },
    {
      q: "What psychometric assessment screeners are utilized?",
      a: "MindGuard incorporates internationally validated instruments including the PHQ-9 (mood and depression screener) and GAD-7 (generalized anxiety screener) presented through a supportive step-by-step experience."
    }
  ];

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden">
      {/* Interactive 3D WebGL Binary Orbits Galaxy & Particle System (Reference Inspired) */}
      <div 
        className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" 
        style={{ width: "100vw", height: "100vh" }}
        aria-hidden="true"
      >
        <BinaryOrbits
          colors={theme === "dark" ? ["#2dd4bf", "#38bdf8"] : ["#0d9488", "#0284c7"]}
          backgroundColor={theme === "dark" ? "#0A0F1D" : "#F8FAFC"}
          stars={42000}
          starSize={1.6}
          sparkle={0.5}
          arms={3}
          twist={3.5}
          armStrength={0.5}
          dust={0.5}
          core={1}
          coreSize={0.07}
          thickness={0.02}
          tilt={58}
          roll={-8}
          scale={1}
          centerX={0.5}
          centerY={0.5}
          speed={1}
          twinkle={0.35}
          depth={0.4}
          glow={0.5}
          intensity={1.05}
          interactive={true}
          hoverWake={true}
          clickRipple={true}
          wakeStrength={1}
          rippleStrength={1}
          hoverBoost={0.5}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="MindGuardAI Logo"
              className="w-8 h-8 rounded-lg object-contain bg-white dark:bg-card border border-border p-0.5 shadow-xs"
            />
            <div>
              <span className="font-bold text-base tracking-tight text-foreground">
                MindGuard<span className="text-primary">AI</span>
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#features" className="hover:text-foreground transition-colors">Capabilities</a>
            <a href="#privacy" className="hover:text-foreground transition-colors">Privacy & Security</a>
            <a href="#helplines" className="hover:text-foreground transition-colors">Crisis Helplines</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            <Link
              to="/login"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section with Interactive 3D Wellness Orb */}
      <motion.section 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="pt-12 pb-16 md:pt-16 md:pb-24 border-b border-border overflow-hidden"
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold">
                <Shield className="w-3.5 h-3.5" />
                <span>Student Wellbeing & Early Support Platform</span>
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                A smarter, dignified way to support student wellbeing.
              </h1>

              <p className="max-w-2xl mx-auto lg:mx-0 text-sm sm:text-base text-muted-foreground leading-relaxed">
                Track personal wellbeing, identify meaningful emotional trends, and connect students with appropriate university care—while keeping privacy and human oversight at the core.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Student Portal</span>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold border border-border/80 bg-card text-foreground hover:bg-secondary transition-all shadow-xs"
                  >
                    <HeartHandshake className="w-4 h-4 text-primary" />
                    <span>Counsellor Portal</span>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold border border-border/80 bg-card text-foreground hover:bg-secondary transition-all shadow-xs"
                  >
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>University Overview</span>
                  </Link>
                </motion.div>
              </div>
            </div>

            {/* Right 3D Interactive Wellness Orb Column */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="w-full max-w-sm md:max-w-md h-80 relative flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <WellnessOrb className="w-full h-full" />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 -mt-2">
                <Sparkles className="w-3 h-3 text-primary" />
                <span>Interactive 3D Wellness Sphere • Move cursor to interact</span>
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 3. How It Works Section */}
      <section id="how-it-works" className="py-16 border-b border-border bg-secondary/30">
        <div className="max-w-5xl mx-auto px-4 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">How the Platform Works</h2>
            <p className="text-xs text-muted-foreground max-w-lg mx-auto">
              A comprehensive four-step continuum of care designed for university ecosystems.
            </p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              { num: "01", title: "Daily Check-in", desc: "Log momentary mood, sleep hours, and stress levels in under a minute without burden." },
              { num: "02", title: "Understand Trends", desc: "View longitudinal wellbeing trajectory and circadian balance calibrated to your baseline." },
              { num: "03", title: "Guided Care", desc: "Access structured breathing pacers, self-care resources, and conversational AI support." },
              { num: "04", title: "Counsellor Connect", desc: "Book confidential 1-on-1 consultations with campus psychologists whenever extra support is helpful." }
            ].map((step) => (
              <motion.div
                key={step.num}
                variants={cardEntrance}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Card className="p-5 space-y-2.5 h-full">
                  <span className="text-xs font-mono font-bold text-primary">{step.num}</span>
                  <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4. Platform Capabilities Grid */}
      <section id="features" className="py-16 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">Core Platform Capabilities</h2>
            <p className="text-xs text-muted-foreground max-w-lg mx-auto">
              Built on clinically informed decision support and ethical telemetry.
            </p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <motion.div variants={cardEntrance} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <Card className="p-5 space-y-3 h-full">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Multidimensional Wellbeing</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tracks emotional vitality, academic load, and sleep architecture over 7-day to 1-year horizons.
                </p>
              </Card>
            </motion.div>

            <motion.div variants={cardEntrance} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <Card className="p-5 space-y-3 h-full">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                <h3 className="text-sm font-semibold text-foreground">Explainable AI Attributions</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Provides transparent SHAP factors so both students and counsellors understand why scores shift.
                </p>
              </Card>
            </motion.div>

            <motion.div variants={cardEntrance} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <Card className="p-5 space-y-3 h-full">
                <Users className="h-5 w-5 text-blue-500" />
                <h3 className="text-sm font-semibold text-foreground">Case Management Console</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Equips campus counsellors with priority triage queues, appointment scheduling, and secure notes.
                </p>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 5. Privacy & Ethics Commitment */}
      <section id="privacy" className="py-16 border-b border-border bg-secondary/30">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">Privacy & Human Oversight</h2>
            <p className="text-xs text-muted-foreground max-w-lg mx-auto">
              We uphold student privacy as a fundamental prerequisite for psychological safety.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Zero Surveillance Telemetry</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                No keystrokes, no camera feeds, and no chat logs are ever accessed by university administrators.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Audited Consent Controls</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Students hold granular control to revoke or grant telemetry and escalation rights at any time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Crisis Helplines */}
      <section id="helplines" className="py-12 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <h3 className="text-sm font-semibold text-foreground">24/7 National Crisis & Mental Health Helplines</h3>
          <p className="text-xs text-muted-foreground">
            Confidential toll-free professional support is available around the clock.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="tel:14416"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-xs font-semibold hover:border-primary/50 transition"
            >
              <PhoneCall className="h-3.5 w-3.5 text-rose-500" />
              <span>Tele-MANAS: 14416 (Toll-Free 24/7)</span>
            </a>

            <a
              href="tel:18005990019"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-xs font-semibold hover:border-primary/50 transition"
            >
              <PhoneCall className="h-3.5 w-3.5 text-blue-500" />
              <span>KIRAN Mental Health: 1800-599-0019</span>
            </a>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="py-8 bg-card border-t border-border text-center text-xs text-muted-foreground">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="MindGuardAI Logo" className="h-6 w-6 rounded-md object-contain" />
            <span>© 2026 MindGuardAI • Student Wellbeing & Early Support Platform</span>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <Link to="/login" className="hover:text-foreground">Student Portal</Link>
            <Link to="/login" className="hover:text-foreground">Counsellor Portal</Link>
            <Link to="/login" className="hover:text-foreground">University Overview</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
