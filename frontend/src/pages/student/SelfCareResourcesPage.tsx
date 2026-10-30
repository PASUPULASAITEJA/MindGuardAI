import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Wind, 
  Eye, 
  Moon, 
  PhoneCall, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  Heart,
  BookOpen
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HabitRecoverySimulator } from "../../components/HabitRecoverySimulator";
import { PersonalizedRecommendations } from "../../components/PersonalizedRecommendations";
import { motion } from "motion/react";
import { pageVariants, staggerContainer, cardEntrance } from "@/utils/motion";
import { BreathingSphere } from "@/components/3d/BreathingSphere";
import { ShinyText } from "@/components/ui/ShinyText";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { DotGridBackground } from "@/components/ui/DotGridBackground";

export const SelfCareResourcesPage: React.FC = () => {
  const navigate = useNavigate();

  // Box Breathing Interactive State
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);
  const [breathingPhase, setBreathingPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Hold After Exhale">("Inhale");
  const [breathingSeconds, setBreathingSeconds] = useState<number>(4);
  const [cyclesCompleted, setCyclesCompleted] = useState<number>(0);

  // 5-4-3-2-1 Grounding checklist state
  const [groundingChecks, setGroundingChecks] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let interval: any = null;
    if (isBreathingActive) {
      interval = setInterval(() => {
        setBreathingSeconds((prev) => {
          if (prev <= 1) {
            setBreathingPhase((curPhase) => {
              if (curPhase === "Inhale") return "Hold";
              if (curPhase === "Hold") return "Exhale";
              if (curPhase === "Exhale") return "Hold After Exhale";
              setCyclesCompleted((c) => c + 1);
              return "Inhale";
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBreathingActive]);

  const toggleGrounding = (idx: number) => {
    setGroundingChecks((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const groundingCount = Object.values(groundingChecks).filter(Boolean).length;

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="relative max-w-4xl mx-auto space-y-8 pb-12"
    >
      <DotGridBackground />

      {/* Top Protocol Badge */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold tracking-wide">
          <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500/20" />
          Clinical Calming & Self-Care Protocols
        </span>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
          <ShinyText text="Mental Recovery & Calming Toolkit" />
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Clinically backed relaxation protocols to ground your autonomic nervous system, reduce cognitive fatigue, and restore mental focus.
        </p>
      </div>

      {/* AI Personalized Recommendation Engine */}
      <PersonalizedRecommendations />

      {/* Grid of tools */}
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* 1. Breathing Sphere Interactive Widget */}
        <motion.div variants={cardEntrance} whileHover={{ y: -3 }}>
          <SpotlightCard spotlightColor="rgba(99, 102, 241, 0.15)" className="p-5 flex flex-col justify-between h-full">
            <div className="pb-3 border-b border-border/40 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Wind className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    MindBridge Breath Pacer
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Vagus nerve calming protocols to ease acute anxiety & restore focus
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-2">
              <BreathingSphere showPresets={true} showControls={true} />
            </div>
          </SpotlightCard>
        </motion.div>

        {/* 2. 5-4-3-2-1 Sensory Grounding Tool */}
        <motion.div variants={cardEntrance} whileHover={{ y: -3 }}>
          <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.15)" className="p-5 flex flex-col justify-between h-full">
            <div className="pb-3 border-b border-border/40 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Eye className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    5-4-3-2-1 Sensory Grounding
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Reconnect with your physical senses when thoughts are racing
                  </p>
                </div>
              </div>
              <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border transition-all ${
                groundingCount === 5 
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40" 
                  : "bg-muted text-muted-foreground border-border/60"
              }`}>
                {groundingCount === 5 ? "All Grounded ✨" : `${groundingCount}/5 Grounded`}
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                { id: 1, count: "5", title: "Things you can SEE", desc: "Look around you: notice a pen, shadow, or texture." },
                { id: 2, count: "4", title: "Things you can TOUCH", desc: "Feel the desk, your clothing, or the floor under your feet." },
                { id: 3, count: "3", title: "Things you can HEAR", desc: "Listen for the AC hum, distant footsteps, or your breath." },
                { id: 4, count: "2", title: "Things you can SMELL", desc: "Notice coffee, fresh paper, or crisp air." },
                { id: 5, count: "1", title: "Thing you can TASTE", desc: "Sip water or notice the lingering taste in your mouth." },
              ].map((step) => {
                const checked = Boolean(groundingChecks[step.id]);
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => toggleGrounding(step.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      checked 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-xs" 
                        : "bg-background/60 border-border/70 hover:bg-muted/40 text-foreground"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`h-6 w-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 transition-colors ${
                        checked ? "bg-emerald-500 text-white" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {step.count}
                      </span>
                      <div>
                        <div className={`text-xs font-bold ${checked ? "line-through opacity-75" : ""}`}>
                          {step.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {step.desc}
                        </div>
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      checked ? "bg-emerald-500 border-emerald-500 text-white" : "border-border/80 bg-background/50"
                    }`}>
                      {checked && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </SpotlightCard>
        </motion.div>
      </motion.div>

      {/* Habit Recovery Interactive Simulator */}
      <HabitRecoverySimulator currentScore={78} />

      {/* Sleep & Exam Stress Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SpotlightCard spotlightColor="rgba(139, 92, 246, 0.15)" className="p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500">
              <Moon className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Circadian Sleep Recovery Guidelines</h3>
          </div>
          <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-violet-500 font-bold">•</span>
              <span><strong>Screens Off 45m Before Sleep:</strong> Blue light suppresses melatonin release by up to 67%, delaying restorative REM cycles.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-500 font-bold">•</span>
              <span><strong>Morning Sunlight Exposure:</strong> Get 10-15 mins of natural outdoor sunlight within 30 minutes of waking up to set your master clock.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-500 font-bold">•</span>
              <span><strong>Consistent Bedtime Window:</strong> Going to sleep within a 30-minute window every day improves memory retention for exams.</span>
            </li>
          </ul>
        </SpotlightCard>

        {/* Emergency Helplines Card */}
        <SpotlightCard spotlightColor="rgba(244, 63, 94, 0.18)" className="border-rose-500/30 bg-rose-500/5 p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-rose-500">
            <div className="p-1.5 rounded-lg bg-rose-500/10">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold">24/7 Crisis & Immediate Support</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            If you or a friend are experiencing severe emotional distress, panic, or thoughts of self-harm, confidential help is free and available right now:
          </p>
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/80 border border-border text-xs">
              <span className="font-semibold text-foreground">Tele-MANAS (Govt. of India)</span>
              <a href="tel:14416" className="font-black text-rose-500 hover:underline">Call 14416 (Toll-Free)</a>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/80 border border-border text-xs">
              <span className="font-semibold text-foreground">KIRAN Mental Health Helpline</span>
              <a href="tel:18005990019" className="font-black text-rose-500 hover:underline">1800-599-0019</a>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/80 border border-border text-xs">
              <span className="font-semibold text-foreground">Campus Counseling Center</span>
              <a href="tel:02242355555" className="font-black text-primary hover:underline">+91 22 4235 5555</a>
            </div>
          </div>
        </SpotlightCard>
      </div>
    </motion.div>
  );
};

export default SelfCareResourcesPage;
