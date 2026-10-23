import React, { useRef, useEffect, useState, useCallback } from "react";
import { Brain, Zap, Sparkles } from "lucide-react";

export interface NeuralBrain3DProps {
  className?: string;
  interactive?: boolean;
  autoRotate?: boolean;
  pulseSpeed?: number;
  showStatusBadge?: boolean;
}

interface SynapticNode {
  id: number;
  x: number; // 0 to 1 percentage
  y: number; // 0 to 1 percentage
  baseRadius: number;
  color: string;
  flashColor: string;
  lobe: string;
}

interface ActionSignal {
  fromNode: number;
  toNode: number;
  progress: number; // 0 to 1
  speed: number;
  color: string;
  size: number;
}

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  phase: number;
}

// 24 Anatomically placed synaptic nodes across the cerebral cortex, cerebellum & brainstem
const ANATOMICAL_NODES: SynapticNode[] = [
  // Frontal Lobe (Executive function, cognition)
  { id: 0, x: 0.28, y: 0.38, baseRadius: 4.5, color: "#38BDF8", flashColor: "#FBBF24", lobe: "Frontal Pole" },
  { id: 1, x: 0.35, y: 0.28, baseRadius: 5.0, color: "#22D3EE", flashColor: "#FFFFFF", lobe: "Prefrontal Cortex" },
  { id: 2, x: 0.44, y: 0.22, baseRadius: 4.0, color: "#38BDF8", flashColor: "#F59E0B", lobe: "Superior Frontal" },
  { id: 3, x: 0.24, y: 0.48, baseRadius: 3.5, color: "#2DD4BF", flashColor: "#38BDF8", lobe: "Orbitofrontal" },

  // Motor & Somatosensory Strip
  { id: 4, x: 0.48, y: 0.32, baseRadius: 5.5, color: "#818CF8", flashColor: "#FBBF24", lobe: "Motor Cortex" },
  { id: 5, x: 0.54, y: 0.26, baseRadius: 4.5, color: "#C084FC", flashColor: "#FFFFFF", lobe: "Somatosensory" },
  { id: 6, x: 0.42, y: 0.42, baseRadius: 4.0, color: "#38BDF8", flashColor: "#22D3EE", lobe: "Broca Area" },

  // Parietal Lobe (Sensory integration)
  { id: 7, x: 0.62, y: 0.24, baseRadius: 4.0, color: "#C084FC", flashColor: "#FBBF24", lobe: "Superior Parietal" },
  { id: 8, x: 0.70, y: 0.30, baseRadius: 4.5, color: "#E879F9", flashColor: "#FFFFFF", lobe: "Inferior Parietal" },
  { id: 9, x: 0.60, y: 0.38, baseRadius: 4.0, color: "#A855F7", flashColor: "#38BDF8", lobe: "Precuneus" },

  // Occipital Lobe (Visual cortex)
  { id: 10, x: 0.78, y: 0.42, baseRadius: 5.0, color: "#C084FC", flashColor: "#FBBF24", lobe: "Visual Cortex" },
  { id: 11, x: 0.83, y: 0.52, baseRadius: 4.5, color: "#E879F9", flashColor: "#FFFFFF", lobe: "Occipital Pole" },
  { id: 12, x: 0.75, y: 0.58, baseRadius: 3.8, color: "#818CF8", flashColor: "#22D3EE", lobe: "Lateral Occipital" },

  // Temporal Lobe (Memory, emotional regulation, auditory)
  { id: 13, x: 0.36, y: 0.56, baseRadius: 4.5, color: "#2DD4BF", flashColor: "#FBBF24", lobe: "Temporal Pole" },
  { id: 14, x: 0.46, y: 0.58, baseRadius: 5.0, color: "#38BDF8", flashColor: "#FFFFFF", lobe: "Hippocampus Lobe" },
  { id: 15, x: 0.58, y: 0.54, baseRadius: 4.5, color: "#818CF8", flashColor: "#F59E0B", lobe: "Wernicke Area" },
  { id: 16, x: 0.50, y: 0.48, baseRadius: 4.0, color: "#22D3EE", flashColor: "#FBBF24", lobe: "Insular Cortex" },

  // Cerebellum (Coordination, balance, fine tuning)
  { id: 17, x: 0.68, y: 0.68, baseRadius: 5.0, color: "#38BDF8", flashColor: "#FFFFFF", lobe: "Cerebellar Folia" },
  { id: 18, x: 0.76, y: 0.72, baseRadius: 4.5, color: "#2DD4BF", flashColor: "#FBBF24", lobe: "Posterior Lobe" },
  { id: 19, x: 0.62, y: 0.76, baseRadius: 4.0, color: "#22D3EE", flashColor: "#FFFFFF", lobe: "Flocculonodular" },

  // Brainstem (Autonomic equilibrium, circadian rhythms)
  { id: 20, x: 0.53, y: 0.70, baseRadius: 4.5, color: "#2DD4BF", flashColor: "#FBBF24", lobe: "Midbrain" },
  { id: 21, x: 0.55, y: 0.78, baseRadius: 4.8, color: "#38BDF8", flashColor: "#FFFFFF", lobe: "Pons" },
  { id: 22, x: 0.57, y: 0.86, baseRadius: 4.0, color: "#22D3EE", flashColor: "#F59E0B", lobe: "Medulla" },
  { id: 23, x: 0.60, y: 0.94, baseRadius: 3.5, color: "#2DD4BF", flashColor: "#FBBF24", lobe: "Spinal Cord Root" },
];

// Synaptic circuits linking nodes together
const SYNAPTIC_CIRCUITS: [number, number][] = [
  // Frontal circuits
  [0, 1], [1, 2], [0, 3], [1, 4], [3, 13], [1, 6],
  // Motor-Sensory & Parietal pathways
  [4, 5], [4, 6], [5, 7], [7, 8], [7, 9], [5, 9],
  // Parieto-Occipital pathways
  [8, 10], [9, 10], [10, 11], [11, 12], [9, 15],
  // Temporal & Limbic pathways
  [13, 14], [14, 15], [14, 16], [6, 16], [16, 15], [15, 12],
  // Cerebellar & Brainstem pathways
  [12, 17], [15, 17], [17, 18], [17, 19], [19, 20],
  [16, 20], [20, 21], [21, 22], [22, 23],
];

export const NeuralBrain3D: React.FC<NeuralBrain3DProps> = ({
  className = "",
  interactive = true,
  autoRotate = true,
  pulseSpeed = 1.0,
  showStatusBadge = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFiringBurst, setIsFiringBurst] = useState(false);
  const [activeLobe, setActiveLobe] = useState<string>("Bilateral Neural Network");

  // 3D Parallax Tilt state
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, scale: 1 });
  const mousePos = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, isHovered: false });

  // Reduced motion preference
  const isReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Trigger action potential burst
  const triggerBurst = useCallback(() => {
    setIsFiringBurst(true);
    setTimeout(() => setIsFiringBurst(false), 900);
  }, []);

  // Mouse Parallax handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || isReducedMotion) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    mousePos.current.targetX = nx;
    mousePos.current.targetY = ny;
    mousePos.current.isHovered = true;
  };

  const handleMouseEnter = () => {
    mousePos.current.isHovered = true;
  };

  const handleMouseLeave = () => {
    mousePos.current.isHovered = false;
    mousePos.current.targetX = 0;
    mousePos.current.targetY = 0;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    triggerBurst();
  };

  // Canvas Animation: Synaptic Signals, Action Potentials & Cosmic Sparks
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1));
    let height = (canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1));

    const resize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      height = canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    };

    window.addEventListener("resize", resize);

    // Initialize Active Action Signals
    const signals: ActionSignal[] = [];
    const signalColors = ["#38BDF8", "#FBBF24", "#22D3EE", "#E879F9", "#FFFFFF"];

    const spawnSignal = () => {
      const circuit = SYNAPTIC_CIRCUITS[Math.floor(Math.random() * SYNAPTIC_CIRCUITS.length)];
      const [from, to] = Math.random() < 0.5 ? [circuit[0], circuit[1]] : [circuit[1], circuit[0]];
      signals.push({
        fromNode: from,
        toNode: to,
        progress: 0,
        speed: (0.012 + Math.random() * 0.018) * pulseSpeed,
        color: signalColors[Math.floor(Math.random() * signalColors.length)],
        size: 3.0 + Math.random() * 2.5,
      });
    };

    // Pre-populate initial signals
    for (let i = 0; i < 8; i++) spawnSignal();

    // Initialize Cosmic Ambient Sparks
    const sparks: AmbientParticle[] = [];
    const sparkPalette = ["#38BDF8", "#FBBF24", "#2DD4BF", "#C084FC"];
    for (let i = 0; i < 48; i++) {
      sparks.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: 1.2 + Math.random() * 2.2,
        color: sparkPalette[Math.floor(Math.random() * sparkPalette.length)],
        alpha: 0.2 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let lastTime = performance.now();
    let shockwaveRadius = 0;

    const render = (time: number) => {
      animId = requestAnimationFrame(render);
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse parallax lerp
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.08;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.08;

      setTilt({
        rotateX: -mousePos.current.y * 18,
        rotateY: mousePos.current.x * 22,
        scale: mousePos.current.isHovered ? 1.03 : 1.0,
      });

      // 1. Render Ambient Cosmic Dust Sparks
      for (const spark of sparks) {
        spark.x += spark.vx;
        spark.y += spark.vy;
        if (spark.x < 0) spark.x = width;
        if (spark.x > width) spark.x = 0;
        if (spark.y < 0) spark.y = height;
        if (spark.y > height) spark.y = 0;

        const pulse = Math.sin(time * 0.003 + spark.phase) * 0.25;
        const currentAlpha = Math.max(0.1, spark.alpha + pulse);

        ctx.save();
        ctx.fillStyle = spark.color;
        ctx.globalAlpha = currentAlpha;
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2. Render Synaptic Circuit Pathways
      ctx.save();
      for (const [fromIdx, toIdx] of SYNAPTIC_CIRCUITS) {
        const from = ANATOMICAL_NODES[fromIdx];
        const to = ANATOMICAL_NODES[toIdx];

        const x1 = from.x * width;
        const y1 = from.y * height;
        const x2 = to.x * width;
        const y2 = to.y * height;

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, from.color + "33"); // 20% opacity
        grad.addColorStop(0.5, "#38BDF866");     // 40% opacity
        grad.addColorStop(1, to.color + "33");

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4 * (window.devicePixelRatio || 1);
        ctx.beginPath();
        // Subtle curved synaptic arc
        const mx = (x1 + x2) / 2 + (Math.sin(fromIdx) * 12);
        const my = (y1 + y2) / 2 + (Math.cos(toIdx) * 12);
        ctx.quadraticCurveTo(mx, my, x2, y2);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Update & Render Traveling Action Potential Signal Pulses
      if (Math.random() < 0.12 && signals.length < 24) {
        spawnSignal();
      }

      for (let i = signals.length - 1; i >= 0; i--) {
        const sig = signals[i];
        sig.progress += sig.speed;

        if (sig.progress >= 1.0) {
          signals.splice(i, 1);
          continue;
        }

        const from = ANATOMICAL_NODES[sig.fromNode];
        const to = ANATOMICAL_NODES[sig.toNode];

        const x1 = from.x * width;
        const y1 = from.y * height;
        const x2 = to.x * width;
        const y2 = to.y * height;

        // Signal position along path
        const px = x1 + (x2 - x1) * sig.progress;
        const py = y1 + (y2 - y1) * sig.progress;

        ctx.save();
        ctx.shadowColor = sig.color;
        ctx.shadowBlur = 12 * (window.devicePixelRatio || 1);

        // Core light pulse
        ctx.fillStyle = sig.color;
        ctx.beginPath();
        ctx.arc(px, py, sig.size * (window.devicePixelRatio || 1), 0, Math.PI * 2);
        ctx.fill();

        // Inner hot white nucleus
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(px, py, sig.size * 0.45 * (window.devicePixelRatio || 1), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. Render Synaptic Junction Nodes
      for (const node of ANATOMICAL_NODES) {
        const nx = node.x * width;
        const ny = node.y * height;

        // Periodic synaptic firing rhythm
        const firingPhase = Math.sin(time * 0.0035 + node.id * 1.3);
        const isFlashing = firingPhase > 0.85 || isFiringBurst;
        const currentRadius = (node.baseRadius + (isFlashing ? 3.5 : 0)) * (window.devicePixelRatio || 1);

        ctx.save();
        // Radiant outer glow halo
        const haloGrad = ctx.createRadialGradient(nx, ny, 1, nx, ny, currentRadius * 3.2);
        haloGrad.addColorStop(0, (isFlashing ? node.flashColor : node.color) + "CC");
        haloGrad.addColorStop(1, (isFlashing ? node.flashColor : node.color) + "00");

        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(nx, ny, currentRadius * 3.2, 0, Math.PI * 2);
        ctx.fill();

        // Core synaptic node
        ctx.fillStyle = isFlashing ? node.flashColor : node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 10 * (window.devicePixelRatio || 1);
        ctx.beginPath();
        ctx.arc(nx, ny, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        // White hot center
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(nx, ny, currentRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 5. Render Electric Shockwave on Click
      if (isFiringBurst) {
        shockwaveRadius += dt * 480 * (window.devicePixelRatio || 1);
        ctx.save();
        ctx.strokeStyle = "#38BDF8";
        ctx.lineWidth = 3.0 * (window.devicePixelRatio || 1);
        ctx.shadowColor = "#FBBF24";
        ctx.shadowBlur = 18 * (window.devicePixelRatio || 1);
        ctx.globalAlpha = Math.max(0, 1.0 - shockwaveRadius / (width * 0.65));

        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.5, shockwaveRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        shockwaveRadius = 0;
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [pulseSpeed, isFiringBurst]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`relative flex items-center justify-center select-none cursor-pointer ${className}`}
      style={{
        perspective: "1200px",
        minHeight: "380px",
        minWidth: "320px",
      }}
      title="Interactive Holographic Neural Brain • Move cursor to tilt, click to fire action potentials"
    >
      {/* 1. Deep Atmospheric Cyan/Violet Radial Bloom Backing */}
      <div
        className="absolute inset-0 pointer-events-none rounded-full blur-3xl transition-transform duration-700 ease-out"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.22) 0%, rgba(192, 132, 252, 0.16) 45%, rgba(6, 182, 212, 0.08) 70%, transparent 85%)",
          transform: `scale(${isFiringBurst ? 1.25 : 1.0})`,
        }}
        aria-hidden="true"
      />

      {/* 2. Rotating Holographic Outer Aura Ring */}
      <div
        className="absolute w-[92%] h-[92%] pointer-events-none rounded-full border border-cyan-500/20 blur-[1px] animate-[spin_24s_linear_infinite]"
        style={{
          borderTopColor: "rgba(56, 189, 248, 0.6)",
          borderRightColor: "rgba(192, 132, 252, 0.4)",
          borderBottomColor: "rgba(45, 212, 191, 0.5)",
          borderLeftColor: "rgba(251, 191, 36, 0.3)",
        }}
        aria-hidden="true"
      />

      {/* 3. 3D Tilt Wrapper with Floating Elevation Bob */}
      <div
        className="relative w-full h-full max-w-[480px] max-h-[480px] flex items-center justify-center transition-transform duration-150 ease-out"
        style={{
          transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(${tilt.scale}, ${tilt.scale}, ${tilt.scale})`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Floating Animation Layer */}
        <div className="relative w-full h-full flex items-center justify-center animate-[float_6s_ease-in-out_infinite]">
          {/* Exact Holographic Brain Asset (Matching User Reference Image 2) */}
          <img
            src="/images/holographic-neural-brain.jpg"
            alt="MindGuardAI Holographic Neural Brain"
            className="w-full h-full object-contain rounded-2xl drop-shadow-[0_0_35px_rgba(56,189,248,0.45)] select-none pointer-events-none"
            style={{
              mixBlendMode: "screen",
              filter: isFiringBurst
                ? "brightness(1.35) contrast(1.15) saturate(1.2)"
                : "brightness(1.05) contrast(1.08)",
              transition: "filter 0.25s ease-out",
            }}
          />

          {/* Holographic Diagnostic Shimmer Light Sweep */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
            style={{ mixBlendMode: "color-dodge" }}
            aria-hidden="true"
          >
            <div className="w-[45%] h-full bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent skew-x-[-25deg] animate-[shimmer_5s_ease-in-out_infinite]" />
          </div>

          {/* Interactive HTML5 Canvas: Synaptic Axons, Action Signals & Golden Spark Nodes */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ mixBlendMode: "screen" }}
          />
        </div>
      </div>

      {/* 4. Floating Scientific Status HUD */}
      {showStatusBadge && (
        <div className="absolute -bottom-2 flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-card/85 backdrop-blur-md border border-border/80 text-[11px] font-medium text-muted-foreground shadow-md pointer-events-none transition-all">
          <Brain
            className={`w-3.5 h-3.5 transition-colors ${
              isFiringBurst ? "text-amber-400 animate-pulse" : "text-primary"
            }`}
          />
          <span className="flex items-center gap-1.5">
            <span className="text-foreground font-semibold">Holographic Neural Brain</span>
            <span className="inline-block w-1 h-1 rounded-full bg-border" />
            <span className={isFiringBurst ? "text-amber-400 font-bold" : "text-primary flex items-center gap-1"}>
              <Zap className="w-3 h-3 inline" />
              {isFiringBurst ? "Action Potential Fired!" : "Synaptic Pathways Active"}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

export default NeuralBrain3D;
