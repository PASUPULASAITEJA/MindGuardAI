import React, { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { Play, Pause, RotateCcw, Wind, ShieldAlert, Sparkles as SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThreeErrorBoundary } from "./LazyCanvasWrapper";

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

interface InnerSphereMeshProps {
  phase: BreathingPhase;
  phaseProgress: number; // 0 to 1 within the current phase
  isActive: boolean;
  reducedMotion: boolean;
}

function InnerBreathingSphereMesh({
  phase,
  phaseProgress,
  isActive,
  reducedMotion,
}: InnerSphereMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const targetScale = useRef(1.0);

  // Compute smooth scale target based on current phase and progress
  let calculatedScale = 1.0;
  if (!isActive) {
    calculatedScale = 1.0;
  } else if (phase === "Inhale") {
    // Smooth ease-out expansion from 0.82 to 1.45
    const eased = Math.sin((phaseProgress * Math.PI) / 2);
    calculatedScale = 0.82 + eased * (1.45 - 0.82);
  } else if (phase === "Hold") {
    // Gentle floating expansion around 1.45
    calculatedScale = 1.45;
  } else if (phase === "Exhale") {
    // Smooth ease-in contraction from 1.45 down to 0.82
    const eased = Math.cos((phaseProgress * Math.PI) / 2);
    calculatedScale = 0.82 + eased * (1.45 - 0.82);
  } else {
    // Hold After
    calculatedScale = 0.82;
  }

  targetScale.current = calculatedScale;

  // Phase color themes
  const colorTheme = useMemo(() => {
    switch (phase) {
      case "Inhale":
        return {
          main: new THREE.Color("#38BDF8"), // Cyan
          emissive: "#0284C7",
          core: "#818CF8",
          sparkle: "#38BDF8",
        };
      case "Hold":
      case "Hold After":
        return {
          main: new THREE.Color("#F59E0B"), // Calming Amber
          emissive: "#B45309",
          core: "#FDE68A",
          sparkle: "#FBBF24",
        };
      case "Exhale":
        return {
          main: new THREE.Color("#10B981"), // Emerald Release
          emissive: "#047857",
          core: "#34D399",
          sparkle: "#6EE7B7",
        };
      default:
        return {
          main: new THREE.Color("#38BDF8"),
          emissive: "#0284C7",
          core: "#818CF8",
          sparkle: "#38BDF8",
        };
    }
  }, [phase]);

  useFrame((state, delta) => {
    if (reducedMotion) return;

    if (meshRef.current) {
      // Direct smooth interpolation toward calculated target
      meshRef.current.scale.setScalar(
        THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale.current, delta * 3.5)
      );
      // Gentle meditation rotation
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.rotation.x += delta * 0.08;
    }

    if (coreRef.current && meshRef.current) {
      coreRef.current.scale.setScalar(meshRef.current.scale.x * 0.62);
    }
  });

  return (
    <group>
      {/* Outer breathing respiratory mesh */}
      <mesh ref={meshRef} scale={1.0}>
        <icosahedronGeometry args={[1, 32]} />
        <MeshDistortMaterial
          color={colorTheme.main}
          emissive={colorTheme.emissive}
          emissiveIntensity={0.65}
          roughness={0.2}
          metalness={0.2}
          distort={reducedMotion ? 0 : 0.26}
          speed={phase === "Inhale" ? 2.2 : 1.2}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Inner luminous nucleus */}
      <mesh ref={coreRef} scale={0.62}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive={colorTheme.core}
          emissiveIntensity={0.85}
          roughness={0.12}
          metalness={0.2}
        />
      </mesh>

      {!reducedMotion && isActive && (
        <Sparkles
          count={32}
          scale={3.2}
          size={2.2}
          speed={phase === "Inhale" ? 0.7 : 0.3}
          color={colorTheme.sparkle}
          opacity={0.55}
        />
      )}
    </group>
  );
}

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
  const [phaseProgress, setPhaseProgress] = useState<number>(0);
  const [status, setStatus] = useState<"idle" | "running" | "paused">("running");

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Timer loop with sub-second accuracy for smooth expansion
  useEffect(() => {
    if (status !== "running") return;

    const intervalMs = 50; // 20 updates per second for silky 3D expansion
    const currentPhaseDuration =
      phase === "Inhale"
        ? config.inhale
        : phase === "Hold"
        ? config.hold
        : phase === "Exhale"
        ? config.exhale
        : (config.holdAfter || 0);

    const startTime = Date.now();
    let accumulatedElapsed = (currentPhaseDuration - secondsLeft) * 1000;

    const interval = setInterval(() => {
      accumulatedElapsed += intervalMs;
      const totalSec = accumulatedElapsed / 1000;
      const remainingSec = Math.max(0, currentPhaseDuration - totalSec);
      const progress = Math.min(1, Math.max(0, totalSec / currentPhaseDuration));

      setSecondsLeft(Math.ceil(remainingSec));
      setPhaseProgress(progress);

      if (remainingSec <= 0.05) {
        // Transition to next phase in sequence
        setPhase((current) => {
          let nextPhase: BreathingPhase = "Inhale";
          if (current === "Inhale") {
            nextPhase = config.hold > 0 ? "Hold" : "Exhale";
          } else if (current === "Hold") {
            nextPhase = "Exhale";
          } else if (current === "Exhale") {
            nextPhase = (config.holdAfter && config.holdAfter > 0) ? "Hold After" : "Inhale";
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
              : (config.holdAfter || 0);

          setSecondsLeft(nextDuration);
          setPhaseProgress(0);
          onPhaseChange?.(nextPhase, nextDuration);
          return nextPhase;
        });
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [status, phase, config, onPhaseChange]);

  const handleStart = () => setStatus("running");
  const handlePause = () => setStatus("paused");
  const handleResume = () => setStatus("running");
  const handleStop = () => {
    setStatus("idle");
    setPhase("Inhale");
    setSecondsLeft(config.inhale);
    setPhaseProgress(0);
  };

  const handleSelectPreset = (key: string) => {
    const selected = PRESET_CADENCES[key];
    if (!selected) return;
    setActivePreset(key);
    setConfig(selected.config);
    setPhase("Inhale");
    setSecondsLeft(selected.config.inhale);
    setPhaseProgress(0);
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

  const phaseBadgeClass = useMemo(() => {
    switch (phase) {
      case "Inhale":
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20";
      case "Hold":
      case "Hold After":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "Exhale":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    }
  }, [phase]);

  const staticFallback = (
    <div className="flex h-56 w-56 items-center justify-center rounded-full bg-primary/10 border border-primary/20 animate-pulse">
      <div className="text-center">
        <span className="text-3xl font-black text-foreground">{secondsLeft}s</span>
        <p className="text-xs font-semibold text-muted-foreground uppercase">{phase}</p>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col items-center space-y-5 ${className}`}>
      {/* Preset Cadence Switcher */}
      {showPresets && (
        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-muted/60 border border-border/60">
          {Object.entries(PRESET_CADENCES).map(([key, item]) => (
            <button
              key={key}
              onClick={() => handleSelectPreset(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
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

      {/* 3D Breathing Sphere Display with Synchronized Overlay */}
      <div className="relative h-60 w-60 sm:h-64 sm:w-64 flex items-center justify-center">
        <ThreeErrorBoundary fallback={staticFallback}>
          <Canvas
            camera={{ position: [0, 0, 3.6], fov: 45 }}
            dpr={[1, 1.5]}
            gl={{ powerPreference: "high-performance", alpha: true, antialias: true }}
          >
            <ambientLight intensity={1.3} />
            <directionalLight position={[3, 4, 3]} intensity={2.2} />
            <pointLight position={[-3, -3, -2]} intensity={1.4} color="#818CF8" />

            <Suspense fallback={null}>
              <InnerBreathingSphereMesh
                phase={phase}
                phaseProgress={phaseProgress}
                isActive={status === "running"}
                reducedMotion={prefersReducedMotion}
              />
            </Suspense>
          </Canvas>
        </ThreeErrorBoundary>

        {/* Center Countdown & Phase Overlay */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none drop-shadow-md"
          aria-live="polite"
        >
          <span className="text-4xl sm:text-5xl font-black text-white mix-blend-difference tracking-tight">
            {secondsLeft}s
          </span>
          <span
            className={`mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${phaseBadgeClass} mix-blend-normal bg-card/90 backdrop-blur-sm border shadow-xs`}
          >
            {status === "paused" ? "Paused" : phase}
          </span>
        </div>
      </div>

      {/* Synchronized Verbal Guidance */}
      <div className="text-center min-h-[38px] px-4 max-w-md">
        <p className="text-xs sm:text-sm font-medium text-foreground transition-all">
          {phaseInstruction}
        </p>
      </div>

      {/* Interactive Controls: Start, Pause, Resume, Stop */}
      {showControls && (
        <div className="flex items-center gap-3">
          {status === "idle" ? (
            <Button
              onClick={handleStart}
              className="gap-2 rounded-xl bg-primary text-primary-foreground font-semibold px-5 h-10 shadow-sm"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Start Exercise</span>
            </Button>
          ) : status === "running" ? (
            <Button
              onClick={handlePause}
              variant="outline"
              className="gap-2 rounded-xl border-border font-semibold px-5 h-10"
            >
              <Pause className="h-4 w-4" />
              <span>Pause</span>
            </Button>
          ) : (
            <Button
              onClick={handleResume}
              className="gap-2 rounded-xl bg-primary text-primary-foreground font-semibold px-5 h-10 shadow-sm"
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
