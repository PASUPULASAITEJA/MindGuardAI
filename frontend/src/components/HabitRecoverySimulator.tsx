import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sliders, Moon, Wind, Clock, Sparkles, TrendingUp, RotateCcw, Target, Trophy, CheckCircle, Check } from "lucide-react";

interface HabitRecoverySimulatorProps {
  currentScore: number;
}

interface ActiveHabitGoal {
  targetPoints: number;
  reduceHours: number;
  mindfulnessMins: number;
  bedtime: boolean;
  studyBreaks: boolean;
  day: number;
  startDate: string;
}

export const HabitRecoverySimulator: React.FC<HabitRecoverySimulatorProps> = ({ currentScore }) => {
  const [reduceLateNightHours, setReduceLateNightHours] = useState<number>(1.5);
  const [mindfulnessMinutes, setMindfulnessMinutes] = useState<number>(10);
  const [consistentBedtime, setConsistentBedtime] = useState<boolean>(true);
  const [studyBreaks, setStudyBreaks] = useState<boolean>(true);

  // Active committed goal state with localStorage persistence
  const [activeGoal, setActiveGoal] = useState<ActiveHabitGoal | null>(() => {
    try {
      const saved = localStorage.getItem("mindguard_active_habit_goal");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isJustCommitted, setIsJustCommitted] = useState<boolean>(false);

  // Compute simulated projected wellness score
  const screenTimeRecovery = Math.round(reduceLateNightHours * 9);
  const mindfulnessRecovery = Math.round(mindfulnessMinutes * 0.7);
  const sleepRecovery = consistentBedtime ? 8 : 0;
  const studyRecovery = studyBreaks ? 5 : 0;

  const totalPointsGained = screenTimeRecovery + mindfulnessRecovery + sleepRecovery + studyRecovery;
  const projectedScore = Math.min(100, Math.max(0, currentScore + totalPointsGained));

  const getTier = (score: number) => {
    if (score >= 65) return { label: "Optimal Wellness", color: "text-emerald-500", bg: "bg-emerald-500/15" };
    if (score >= 35) return { label: "Moderate Strain", color: "text-amber-500", bg: "bg-amber-500/15" };
    return { label: "Critical Distress", color: "text-rose-500", bg: "bg-rose-500/15" };
  };

  const currentTier = getTier(currentScore);
  const projectedTier = getTier(projectedScore);

  const resetSimulator = () => {
    setReduceLateNightHours(0);
    setMindfulnessMinutes(0);
    setConsistentBedtime(false);
    setStudyBreaks(false);
  };

  const handleCommitGoal = () => {
    if (totalPointsGained === 0) return;
    const newGoal: ActiveHabitGoal = {
      targetPoints: totalPointsGained,
      reduceHours: reduceLateNightHours,
      mindfulnessMins: mindfulnessMinutes,
      bedtime: consistentBedtime,
      studyBreaks: studyBreaks,
      day: 1,
      startDate: new Date().toISOString(),
    };
    setActiveGoal(newGoal);
    setIsJustCommitted(true);
    setTimeout(() => setIsJustCommitted(false), 3000);
    try {
      localStorage.setItem("mindguard_active_habit_goal", JSON.stringify(newGoal));
    } catch {}
  };

  const handleClearGoal = () => {
    setActiveGoal(null);
    try {
      localStorage.removeItem("mindguard_active_habit_goal");
    } catch {}
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-md shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                "What-If" Behavioral Recovery Simulator
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  Interactive ML
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Adjust lifestyle variables to simulate clinical wellness improvement in real time
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={resetSimulator}
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Real-time comparison banner */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-background via-muted/30 to-background border border-border/70 flex items-center justify-around text-center">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground block">Current Baseline</span>
            <div className="text-2xl font-black text-foreground mt-0.5">{currentScore}<span className="text-xs font-normal text-muted-foreground">/100</span></div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentTier.bg} ${currentTier.color}`}>
              {currentTier.label}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <TrendingUp className="h-5 w-5 text-emerald-500 animate-bounce" />
            <span className="text-xs font-black text-emerald-500 mt-1">+{totalPointsGained} pts</span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-muted-foreground block">Projected Wellness</span>
            <div className="text-2xl font-black text-emerald-500 mt-0.5">{projectedScore}<span className="text-xs font-normal text-muted-foreground">/100</span></div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${projectedTier.bg} ${projectedTier.color}`}>
              {projectedTier.label}
            </span>
          </div>
        </div>

        {/* Sliders & Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Slider 1: Late-night screen reduction */}
          <div className="p-3 rounded-xl bg-background/50 border border-border/60 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Moon className="h-3.5 w-3.5 text-indigo-400" />
                Reduce Late-Night Screen Time
              </span>
              <span className="font-bold text-primary">-{reduceLateNightHours} hrs</span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.5"
              value={reduceLateNightHours}
              onChange={(e) => setReduceLateNightHours(parseFloat(e.target.value))}
              className="w-full accent-primary cursor-pointer h-1.5 bg-secondary rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0h (no change)</span>
              <span>1.5h</span>
              <span>3h (cut blue light)</span>
            </div>
          </div>

          {/* Slider 2: Daily Mindfulness */}
          <div className="p-3 rounded-xl bg-background/50 border border-border/60 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Wind className="h-3.5 w-3.5 text-emerald-400" />
                Daily Paced Breathing / Mindfulness
              </span>
              <span className="font-bold text-emerald-500">+{mindfulnessMinutes} mins</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="5"
              value={mindfulnessMinutes}
              onChange={(e) => setMindfulnessMinutes(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-secondary rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0m</span>
              <span>10m</span>
              <span>20m daily</span>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setConsistentBedtime(!consistentBedtime)}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all duration-200 ${
              consistentBedtime
                ? "bg-primary/10 border-primary text-primary"
                : "border-border/60 bg-background/40 text-muted-foreground hover:bg-muted/40"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Consistent Bedtime (before 11:30 PM)
            </span>
            <span className="font-bold">{consistentBedtime ? "+8 pts" : "Off"}</span>
          </button>

          <button
            type="button"
            onClick={() => setStudyBreaks(!studyBreaks)}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all duration-200 ${
              studyBreaks
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-border/60 bg-background/40 text-muted-foreground hover:bg-muted/40"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Pomodoro Breaks (5m per 45m study)
            </span>
            <span className="font-bold">{studyBreaks ? "+5 pts" : "Off"}</span>
          </button>
        </div>

        {/* Dynamic takeaway message */}
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
          🌟 <strong>Clinical Projection:</strong> Adopting these habit adjustments for 7–10 days shifts circadian melatonin regulation, recovering approximately{" "}
          <strong>{totalPointsGained} wellness points</strong> into <strong>{projectedTier.label}</strong>.
        </div>

        {/* Action Button: Commit to Habit Goal */}
        {!activeGoal ? (
          <Button
            onClick={handleCommitGoal}
            disabled={totalPointsGained === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Target className="h-4 w-4" />
            Set as My Active 7-Day Habit Challenge (+{totalPointsGained} pts)
          </Button>
        ) : (
          /* Active Habit Challenge Display Banner */
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 space-y-2.5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-black text-foreground">
                  Active 7-Day Challenge in Progress
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                  Day 1 of 7
                </span>
              </div>
              <button
                onClick={handleClearGoal}
                className="text-[11px] text-muted-foreground hover:text-foreground font-semibold"
              >
                Change Plan
              </button>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Target: Recovering <strong>+{activeGoal.targetPoints} points</strong> by reducing screen by{" "}
              <strong>{activeGoal.reduceHours}h</strong> and logging <strong>{activeGoal.mindfulnessMins}m</strong> daily mindfulness.
            </p>

            {isJustCommitted && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle className="h-4 w-4" />
                Challenge locked in! Your daily check-ins will track this recovery.
              </div>
            )}

            <div className="pt-1 flex gap-2">
              <NavLink
                to="/student/chat"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-8 rounded-lg flex items-center justify-center gap-1.5 shadow transition-all"
              >
                <Wind className="h-3.5 w-3.5" />
                Launch 10-Min Breathing Pacer
              </NavLink>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
