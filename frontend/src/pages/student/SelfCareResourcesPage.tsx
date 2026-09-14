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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { HabitRecoverySimulator } from "../../components/HabitRecoverySimulator";

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

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/student/dashboard")}
          className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Hub</span>
        </Button>
        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5 text-rose-500" />
          Clinical Calming & Self-Care Tools
        </span>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
          Mental Recovery & Calming Toolkit
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Clinically backed relaxation protocols to ground your autonomic nervous system, reduce cognitive fatigue, and restore mental focus.
        </p>
      </div>

      {/* Grid of tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Box Breathing Interactive Widget */}
        <Card className="border-border/60 shadow-sm overflow-hidden flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Wind className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Box Breathing Protocol (4-4-4-4)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Navy SEAL technique to reset acute anxiety in under 2 minutes
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col items-center justify-center py-8 space-y-6">
            {/* Animated breathing visual circle */}
            <div className="relative flex items-center justify-center">
              <div 
                className={`w-44 h-44 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-1000 ${
                  breathingPhase === "Inhale" 
                    ? "scale-110 border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20" 
                    : breathingPhase === "Exhale" 
                    ? "scale-90 border-emerald-500 bg-emerald-500/10" 
                    : "scale-100 border-amber-500 bg-amber-500/10"
                }`}
              >
                <span className="text-xs uppercase tracking-widest font-extrabold text-muted-foreground">
                  {breathingPhase}
                </span>
                <span className="text-4xl font-black text-foreground mt-1">
                  {breathingSeconds}s
                </span>
                <span className="text-[10px] text-muted-foreground mt-1 font-semibold">
                  {cyclesCompleted} Cycles Done
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsBreathingActive(!isBreathingActive)}
                className={`rounded-xl font-bold gap-2 px-5 ${
                  isBreathingActive 
                    ? "bg-amber-500 hover:bg-amber-600 text-white" 
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                }`}
              >
                {isBreathingActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isBreathingActive ? "Pause Exercise" : "Begin Breathing"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setIsBreathingActive(false);
                  setBreathingPhase("Inhale");
                  setBreathingSeconds(4);
                  setCyclesCompleted(0);
                }}
                className="rounded-xl"
                title="Reset"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 2. 5-4-3-2-1 Sensory Grounding Tool */}
        <Card className="border-border/60 shadow-sm overflow-hidden flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Eye className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  5-4-3-2-1 Sensory Grounding
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Reconnect with your physical senses when thoughts are racing
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
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
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300" 
                      : "bg-background/60 border-border/70 hover:bg-muted/40 text-foreground"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                      {step.count}
                    </span>
                    <div>
                      <div className={`text-xs font-bold ${checked ? "line-through opacity-70" : ""}`}>
                        {step.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {step.desc}
                      </div>
                    </div>
                  </div>
                  <div className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                    checked ? "bg-emerald-500 border-emerald-500 text-white" : "border-border"
                  }`}>
                    {checked && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Habit Recovery Interactive Simulator */}
      <HabitRecoverySimulator currentScore={78} />

      {/* Sleep & Exam Stress Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/60 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <Moon className="h-5 w-5 text-violet-500" />
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
        </Card>

        {/* Emergency Helplines Card */}
        <Card className="border-rose-500/30 bg-rose-500/5 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-rose-500">
            <ShieldAlert className="h-5 w-5" />
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
        </Card>
      </div>
    </div>
  );
};

export default SelfCareResourcesPage;
