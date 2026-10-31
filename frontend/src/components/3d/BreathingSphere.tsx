import React, { useState, useEffect, useMemo } from "react";
import { Play, Pause, RotateCcw, Wind, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export type BreathingPhase = "Inhale" | "Hold" | "Exhale" | "Hold After";

export interface BreathingTimingConfig {
  inhale: number;
  hold: number;
  exhale: number;
  holdAfter?: number;
}

export const PRESET_CADENCES: Record<string, { label: string; desc: string; config: BreathingTimingConfig }> = {
  relax426: {
    label: "4-2-6 Parasympathetic Calm",
    desc: "Longer exhalation activates vagal tone and lowers heart rate",
    config: { inhale: 4, hold: 2, exhale: 6, holdAfter: 0 },
  },
  box4444: {
    label: "4-4-4-4 Box Breathing",
    desc: "Tactical box cadence used to restore balance under acute stress",
    config: { inhale: 4, hold: 4, exhale: 4, holdAfter: 4 },
  },
  deep478: {
    label: "4-7-8 Restorative Rest",
    desc: "Extended hold & exhale for cognitive release and sleep onset",
    config: { inhale: 4, hold: 7, exhale: 8, holdAfter: 0 },
  },
};

export interface BreathingSphereProps {
  initialConfig?: BreathingTimingConfig;
  showControls?: boolean;
  showPresets?: boolean;
  className?: string;
  onPhaseChange?: (phase: BreathingPhase, remainingSeconds: number) => void;
}

export const BreathingSphere: React.FC<BreathingSphereProps> = ({
  initialConfig = PRESET_CADENCES.relax426.config,
  showControls = true,
  showPresets = true,
  className = "w-full max-w-lg mx-auto",
  onPhaseChange,
}) => {
  const [config, setConfig] = useState<BreathingTimingConfig>(initialConfig);
  const [activePreset, setActivePreset] = useState<string>("relax426");
  const [phase, setPhase] = useState<BreathingPhase>("Inhale");
  const [secondsLeft, setSecondsLeft] = useState<number>(initialConfig.inhale);
  const [status, setStatus] = useState<"idle" | "running" | "paused">("running");

  // Timer loop with 1-second cadence
  useEffect(() => {
    if (status !== "running") return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Determine next phase
          let nextPhase: BreathingPhase = "Inhale";
          if (phase === "Inhale") {
            nextPhase = config.hold > 0 ? "Hold" : "Exhale";
          } else if (phase === "Hold") {
            nextPhase = "Exhale";
          } else if (phase === "Exhale") {
            nextPhase = config.holdAfter && config.holdAfter > 0 ? "Hold After" : "Inhale";
          } else {
            nextPhase = "Inhale";
          }

          const nextDuration =
            nextPhase === "Inhale"
              ? config.inhale
              : nextPhase === "Hold"
              ? config.hold
              : nextPhase === "Exhale"
              ? config.exhale
              : config.holdAfter || 0;

          setPhase(nextPhase);
          onPhaseChange?.(nextPhase, nextDuration);
          return nextDuration;
        }

        const updated = prev - 1;
        onPhaseChange?.(phase, updated);
        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, phase, config, onPhaseChange]);

  const handleStart = () => setStatus("running");
  const handlePause = () => setStatus("paused");
  const handleResume = () => setStatus("running");
  const handleStop = () => {
    setStatus("idle");
    setPhase("Inhale");
    setSecondsLeft(config.inhale);
  };

  const handleSelectPreset = (key: string) => {
    const selected = PRESET_CADENCES[key];
    if (!selected) return;
    setActivePreset(key);
    setConfig(selected.config);
    setPhase("Inhale");
    setSecondsLeft(selected.config.inhale);
  };

  const phaseInstruction = useMemo(() => {
    if (status === "idle") return "Press Start to begin your guided breathing cycle.";
    if (status === "paused") return "Pacing paused. Take natural, comfortable breaths.";
    switch (phase) {
      case "Inhale":
        return "Breathe in deeply through your nose, expanding your lower abdomen...";
      case "Hold":
        return "Hold your breath calmly. Keep your jaw loose and shoulders relaxed...";
      case "Exhale":
        return "Slowly release your breath through your mouth, letting tension dissolve...";
      case "Hold After":
        return "Rest in still pause before welcoming your next breath...";
    }
  }, [phase, status]);

  // Phase color theme tokens
  const phaseColors = useMemo(() => {
    switch (phase) {
      case "Inhale":
        return {
          stroke: "#0ea5e9", // Sky blue
          bg: "bg-sky-500/10",
          border: "border-sky-500/30",
          ring: "ring-sky-500/20",
          badge: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
          circleBg: "bg-gradient-to-br from-sky-400/15 via-blue-500/10 to-indigo-500/10",
        };
      case "Hold":
      case "Hold After":
        return {
          stroke: "#f59e0b", // Amber
          bg: "bg-amber-500/10",
          border: "border-amber-500/30",
          ring: "ring-amber-500/20",
          badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
          circleBg: "bg-gradient-to-br from-amber-400/15 via-orange-500/10 to-yellow-500/10",
        };
      case "Exhale":
        return {
          stroke: "#10b981", // Emerald
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/30",
          ring: "ring-emerald-500/20",
          badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          circleBg: "bg-gradient-to-br from-emerald-400/15 via-teal-500/10 to-green-500/10",
        };
    }
  }, [phase]);

  // Total seconds in current phase
  const currentPhaseTotal = useMemo(() => {
    switch (phase) {
      case "Inhale":
        return config.inhale;
      case "Hold":
        return config.hold;
      case "Exhale":
        return config.exhale;
      case "Hold After":
        return config.holdAfter || 1;
    }
  }, [phase, config]);

  // SVG circular progress calculation
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.max(0, Math.min(1, (currentPhaseTotal - secondsLeft) / currentPhaseTotal));
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div className={`flex flex-col items-center space-y-3.5 ${className}`}>
      {/* Preset Cadence Switcher */}
      {showPresets && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/60">
          {Object.entries(PRESET_CADENCES).map(([key, item]) => (
            <button
              key={key}
              onClick={() => handleSelectPreset(key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                activePreset === key
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Clean, Normal 2D Breath Pacer Circle */}
      <div className="relative flex items-center justify-center w-44 h-44 sm:w-48 sm:h-48">
        {/* Outer subtle guide ring */}
        <div className="absolute inset-0 rounded-full border border-border/40 bg-card/40 backdrop-blur-xs" />

        {/* Dynamic expanding/contracting breathing halo */}
        <div
          className={`absolute rounded-full border ${phaseColors.border} ${phaseColors.circleBg} transition-all duration-1000 ease-in-out ${
            phase === "Inhale"
              ? "w-36 h-36 sm:w-40 sm:h-40 scale-100 shadow-lg shadow-sky-500/10"
              : phase === "Hold"
              ? "w-36 h-36 sm:w-40 sm:h-40 scale-100 shadow-lg shadow-amber-500/10"
              : phase === "Exhale"
              ? "w-28 h-28 sm:w-32 sm:h-32 scale-95 shadow-md shadow-emerald-500/10"
              : "w-28 h-28 sm:w-32 sm:h-32 scale-95 shadow-xs"
          }`}
        />

        {/* SVG Circular Progress Track */}
        <svg className="absolute w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 160 160">
          {/* Base Track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-border/40"
          />
          {/* Active Phase Stroke */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={phaseColors.stroke}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>

        {/* Center Countdown & Phase Typography */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center select-none">
          <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-foreground">
            {secondsLeft}s
          </span>
          <span
            className={`mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs ${phaseColors.badge}`}
          >
            {status === "paused" ? "Paused" : phase}
          </span>
        </div>
      </div>

      {/* Synchronized Verbal Guidance */}
      <div className="text-center min-h-[28px] px-2 max-w-sm">
        <p className="text-xs font-medium text-foreground leading-snug">
          {phaseInstruction}
        </p>
      </div>

      {/* Controls: Start, Pause, Resume, Reset */}
      {showControls && (
        <div className="flex items-center gap-2">
          {status === "idle" ? (
            <Button
              onClick={handleStart}
              className="gap-1.5 rounded-xl bg-primary text-primary-foreground font-semibold px-4 h-8 text-xs shadow-xs"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Start Exercise</span>
            </Button>
          ) : status === "running" ? (
            <Button
              onClick={handlePause}
              variant="outline"
              className="gap-1.5 rounded-xl border-border font-semibold px-4 h-8 text-xs"
            >
              <Pause className="h-3.5 w-3.5" />
              <span>Pause</span>
            </Button>
          ) : (
            <Button
              onClick={handleResume}
              className="gap-2 rounded-xl bg-primary text-primary-foreground font-semibold px-5 h-10 shadow-xs"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Resume</span>
            </Button>
          )}

          <Button
            onClick={handleStop}
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground h-10 px-3"
            disabled={status === "idle"}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </Button>
        </div>
      )}

      {/* Clinical Care Disclaimer */}
      <div className="flex items-start gap-2 pt-2 text-[11px] text-muted-foreground max-w-sm text-center border-t border-border/40">
        <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
        <span>
          Self-guided breath pacing is a supportive mindfulness tool and does not replace emergency or professional psychological care.
        </span>
      </div>
    </div>
  );
};

export default BreathingSphere;
