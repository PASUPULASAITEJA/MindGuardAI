import React, { useRef, useEffect, useState, useCallback } from "react";
import { Brain, Sparkles, Zap, ShieldCheck } from "lucide-react";

export type BrainMood = "calm" | "focus";

interface NeuralParticleBrainProps {
  mood?: BrainMood;
  className?: string;
}

interface BrainNode {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  hemisphere: number;
  color: string;
  size: number;
  pulsePhase: number;
}

interface SynapseEdge {
  a: number;
  b: number;
  distSq: number;
}

interface PulseWave {
  x: number;
  y: number;
  z: number;
  radius: number;
  maxRadius: number;
  life: number;
}

export const NeuralParticleBrain: React.FC<NeuralParticleBrainProps> = ({
  mood = "calm",
  className = "w-full h-[400px] sm:h-[450px]",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeMood, setActiveMood] = useState<BrainMood>(mood);
  const [isHovered, setIsHovered] = useState(false);

  // Sync mood prop
  useEffect(() => {
    setActiveMood(mood);
  }, [mood]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio || 600);
    let height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio || 450);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * window.devicePixelRatio || 600;
      height = canvas.height = canvas.offsetHeight * window.devicePixelRatio || 450;
    };
    window.addEventListener("resize", handleResize);

    // Color palettes
    const palette = activeMood === "focus" 
      ? {
          primary: "#a855f7",
          secondary: "#6366f1",
          accent: "#ec4899",
          glow: "rgba(168, 85, 247, 0.4)",
          line: "rgba(168, 85, 247, 0.16)",
          pulse: "#f472b6"
        }
      : {
          primary: "#06b6d4",
          secondary: "#3b82f6",
          accent: "#10b981",
          glow: "rgba(6, 182, 212, 0.45)",
          line: "rgba(6, 182, 212, 0.18)",
          pulse: "#38bdf8"
        };

    // Generate Anatomical 3D Brain Points
    const NODE_COUNT = 750;
    const nodes: BrainNode[] = [];
    const brainRadius = Math.min(width, height) * 0.28;

    let generated = 0;
    while (generated < NODE_COUNT) {
      const hemisphere = Math.random() > 0.5 ? 1 : -1;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);

      // Anatomical lobe scaling (Length > Height > Width)
      const rx = brainRadius * 0.78;
      const ry = brainRadius * 0.88;
      const rz = brainRadius * 1.15;

      // Cortex folds (Gyri & Sulci sinusoidal modulation)
      const fold = 1 + 0.14 * Math.sin(theta * 6.5) * Math.cos(phi * 6.5);

      let x = Math.sin(phi) * Math.cos(theta) * rx * fold;
      let y = Math.cos(phi) * ry * fold;
      let z = Math.sin(phi) * Math.sin(theta) * rz * fold;

      // Hemispheric separation
      x = x * 0.72 + hemisphere * (brainRadius * 0.26);

      // Longitudinal fissure indent (clear gap in the middle)
      if (Math.abs(x) < brainRadius * 0.12) {
        continue;
      }

      // Temporal & Cerebellum contours
      if (y < -brainRadius * 0.25 && z < -brainRadius * 0.15) {
        x *= 0.82;
        z *= 0.88;
      }

      // Internal neural density volume
      const depth = 0.78 + Math.random() * 0.22;
      x *= depth;
      y *= depth;
      z *= depth;

      // Color gradation
      const colorMix = (z + rz) / (rz * 2);
      const nodeColor = colorMix > 0.6 ? palette.primary : colorMix > 0.3 ? palette.secondary : palette.accent;

      nodes.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
        hemisphere,
        color: nodeColor,
        size: (Math.random() * 1.8 + 1.2) * (window.devicePixelRatio || 1),
        pulsePhase: Math.random() * Math.PI * 2,
      });

      generated++;
    }

    // Precalculate Synaptic Connections between nearby nodes
    const edges: SynapseEdge[] = [];
    const maxDist = brainRadius * 0.32;
    const maxDistSq = maxDist * maxDist;

    for (let i = 0; i < nodes.length; i += 2) {
      let connections = 0;
      for (let j = i + 1; j < nodes.length && connections < 3; j++) {
        const dx = nodes[i].baseX - nodes[j].baseX;
        const dy = nodes[i].baseY - nodes[j].baseY;
        const dz = nodes[i].baseZ - nodes[j].baseZ;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < maxDistSq) {
          edges.push({ a: i, b: j, distSq });
          connections++;
        }
      }
    }

    // 3D Rotation angles & mouse tracking
    let rotY = 0;
    let rotX = 0.18;
    let targetRotY = 0;
    let targetRotX = 0.18;
    let mouseX = 0;
    let mouseY = 0;
    let isDragging = false;
    let lastDragX = 0;
    let lastDragY = 0;

    const pulses: PulseWave[] = [];

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      mouseX = normX;
      mouseY = normY;

      if (isDragging) {
        const deltaX = e.clientX - lastDragX;
        const deltaY = e.clientY - lastDragY;
        targetRotY += deltaX * 0.008;
        targetRotX += deltaY * 0.008;
        lastDragX = e.clientX;
        lastDragY = e.clientY;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      lastDragX = e.clientX;
      lastDragY = e.clientY;

      // Trigger neural shockwave on click
      pulses.push({
        x: (Math.random() - 0.5) * brainRadius * 0.8,
        y: (Math.random() - 0.5) * brainRadius * 0.8,
        z: (Math.random() - 0.5) * brainRadius * 0.8,
        radius: 0,
        maxRadius: brainRadius * 1.4,
        life: 1.0,
      });
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    // Animation Loop
    let time = 0;
    const render = () => {
      time += 0.016;

      // Continuous auto-rotation + smooth pointer inertia
      targetRotY += activeMood === "focus" ? 0.007 : 0.0045;
      targetRotX = 0.15 + mouseY * 0.25;

      rotY += (targetRotY + mouseX * 0.4 - rotY) * 0.06;
      rotX += (targetRotX - rotX) * 0.06;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      // Deep dark clear canvas
      ctx.fillStyle = "#070B19";
      ctx.fillRect(0, 0, width, height);

      // Central ambient glow
      const cx = width / 2;
      const cy = height / 2;
      const glowGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, brainRadius * 1.35);
      glowGrad.addColorStop(0, palette.glow);
      glowGrad.addColorStop(0.5, "rgba(7, 11, 25, 0.4)");
      glowGrad.addColorStop(1, "rgba(7, 11, 25, 0)");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      // Update and project nodes in 3D
      const projected: { x: number; y: number; z: number; scale: number; node: BrainNode }[] = [];
      const fov = 650;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Synaptic breathing pulse
        n.pulsePhase += 0.04;
        const breath = 1 + Math.sin(n.pulsePhase) * 0.04;

        let x = n.baseX * breath;
        let y = n.baseY * breath;
        let z = n.baseZ * breath;

        // Y-axis rotation
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;

        // X-axis rotation
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        // Perspective projection
        const scale = fov / (fov + z2 + brainRadius * 1.5);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        projected.push({ x: px, y: py, z: z2, scale, node: n });
      }

      // Sort by depth (back to front)
      projected.sort((a, b) => a.z - b.z);

      // Draw Synaptic Connection Edges
      ctx.lineWidth = 1 * (window.devicePixelRatio || 1);
      ctx.strokeStyle = palette.line;
      ctx.beginPath();

      for (let e = 0; e < edges.length; e++) {
        const p1 = projected[edges[e].a];
        const p2 = projected[edges[e].b];
        if (!p1 || !p2) continue;

        // Alpha modulation based on depth
        const depthAlpha = Math.max(0.04, Math.min(0.28, (p1.z + brainRadius) / (brainRadius * 2)));
        ctx.strokeStyle = palette.line;
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();

      // Draw Action Potential Pulses Traveling across Synapses
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        pulse.radius += brainRadius * 0.035;
        pulse.life -= 0.025;

        if (pulse.life <= 0) {
          pulses.splice(p, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, pulse.radius, 0, Math.PI * 2);
        ctx.strokeStyle = palette.pulse;
        ctx.globalAlpha = pulse.life * 0.45;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // Draw Neural Cortex Particles
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const alpha = Math.max(0.25, Math.min(1.0, 0.4 + (p.z + brainRadius) / (brainRadius * 2.2)));
        const r = Math.max(1, p.node.size * p.scale);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.node.color;
        ctx.shadowColor = p.node.color;
        ctx.shadowBlur = r * 3;

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [activeMood]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative ${className} select-none overflow-hidden rounded-3xl border border-white/10 bg-[#070B19] shadow-[0_20px_50px_rgba(0,0,0,0.6)] group`}
    >
      {/* Top Header HUD Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-md shadow-sm pointer-events-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span className="text-[11px] font-bold text-cyan-300 tracking-wider uppercase flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cognitive Synapse Engine</span>
          </span>
        </div>

        {/* Mood Mode Buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setActiveMood("calm")}
            className={`px-3 py-1 text-[11px] font-bold rounded-lg border transition-all ${
              activeMood === "calm"
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.35)]"
                : "bg-slate-900/60 text-muted-foreground border-white/10 hover:text-foreground"
            }`}
          >
            Calm
          </button>
          <button
            onClick={() => setActiveMood("focus")}
            className={`px-3 py-1 text-[11px] font-bold rounded-lg border transition-all ${
              activeMood === "focus"
                ? "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.35)]"
                : "bg-slate-900/60 text-muted-foreground border-white/10 hover:text-foreground"
            }`}
          >
            Focus
          </button>
        </div>
      </div>

      {/* HTML5 3D Projection Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />

      {/* Bottom Telemetry Ticker */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between text-[11px] px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 backdrop-blur-md pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="text-foreground font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>750 Synaptic Nodes</span>
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-cyan-400 font-medium">Real-time Biometrics</span>
        </div>
        <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>Click to fire impulses • Drag to rotate</span>
        </div>
      </div>
    </div>
  );
};

export default NeuralParticleBrain;
