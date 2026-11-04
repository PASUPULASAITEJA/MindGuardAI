import React, { useEffect, useRef, useState, useCallback } from "react";
import { Sparkles, Zap } from "lucide-react";
import { cn } from "@/utils/cn";

export interface CognitiveSynapseEngineProps {
  className?: string;
  nodeCount?: number;
}

interface SynapseNode3D {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  hemisphere: "left" | "right";
  charge: number; // 0 to 1
  size: number;
  neighbors: number[];
}

interface Impulse {
  originX: number;
  originY: number;
  originZ: number;
  radius: number;
  maxRadius: number;
  speed: number;
  alpha: number;
  color: string;
}

export const CognitiveSynapseEngine: React.FC<CognitiveSynapseEngineProps> = ({
  className,
  nodeCount = 750,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<"calm" | "focus">("calm");
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const rotVelRef = useRef({ x: 0.003, y: 0.002 });
  const rotAnglesRef = useRef({ x: 0.2, y: 0.5 });
  const impulsesRef = useRef<Impulse[]>([]);

  // Generate 750 3D nodes distributed in an organic neural sphere/ellipsoid
  const nodesRef = useRef<SynapseNode3D[]>([]);

  useEffect(() => {
    const nodes: SynapseNode3D[] = [];
    const radius = 135;

    // Fibonacci sphere distribution for uniform spherical coverage with organic brain jitter
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    for (let i = 0; i < nodeCount; i++) {
      const y = 1 - (i / (nodeCount - 1)) * 2; // -1 to 1
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;

      // Hemispheric separation: slight indent along x=0 to create brain-like dual hemispheres
      let x = Math.cos(theta) * radiusAtY;
      let z = Math.sin(theta) * radiusAtY;

      // Brain ellipsoid shape scaling: slightly elongated along z (front-back) and wider along x
      const hemisphere = x < 0 ? "left" : "right";
      const hemiOffset = hemisphere === "left" ? -6 : 6;

      // Add slight organic radial fluctuation
      const organicScale = 0.85 + Math.random() * 0.3;
      const px = (x * radius + hemiOffset) * organicScale;
      const py = y * (radius * 0.88) * organicScale;
      const pz = z * (radius * 1.05) * organicScale;

      nodes.push({
        x: px,
        y: py,
        z: pz,
        baseX: px,
        baseY: py,
        baseZ: pz,
        hemisphere,
        charge: Math.random() * 0.3,
        size: 1.5 + Math.random() * 1.6,
        neighbors: [],
      });
    }

    // Connect nearest neighbors (synaptic axon links)
    const maxLinkDist = 36;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = a.z - b.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < maxLinkDist && a.neighbors.length < 5 && b.neighbors.length < 5) {
          a.neighbors.push(j);
        }
      }
    }

    nodesRef.current = nodes;
  }, [nodeCount]);

  // Click handler to trigger synaptic impulses
  const fireImpulse = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = clientX - rect.left - rect.width / 2;
      const clickY = clientY - rect.top - rect.height / 2;

      // Find node closest to 2D click projection
      let closestNode: SynapseNode3D | null = null;
      let closestDist = Infinity;

      nodesRef.current.forEach((n) => {
        // Compute projected distance
        const dx = n.x - clickX;
        const dy = n.y - clickY;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < closestDist) {
          closestDist = d;
          closestNode = n;
        }
      });

      const originX = closestNode ? (closestNode as SynapseNode3D).x : 0;
      const originY = closestNode ? (closestNode as SynapseNode3D).y : 0;
      const originZ = closestNode ? (closestNode as SynapseNode3D).z : 0;

      const isCyan = mode === "calm";
      impulsesRef.current.push({
        originX,
        originY,
        originZ,
        radius: 0,
        maxRadius: 260,
        speed: mode === "focus" ? 6.5 : 4.5,
        alpha: 1.0,
        color: isCyan ? "rgba(56, 189, 248, " : "rgba(52, 211, 153, ",
      });
    },
    [mode]
  );

  // Mouse & Touch interaction for 3D rotation
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;

    rotVelRef.current.y = dx * 0.005;
    rotVelRef.current.x = -dy * 0.005;

    rotAnglesRef.current.y += rotVelRef.current.y;
    rotAnglesRef.current.x += rotVelRef.current.x;

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture release fails
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    fireImpulse(e.clientX, e.clientY);
  };

  // Main 3D render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      if (!canvas || !containerRef.current) return;
      const dpr = window.devicePixelRatio || 1;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Continuous 3D animation
    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Auto rotation dampening & drift
      if (!isDraggingRef.current) {
        const baseSpeed = mode === "focus" ? 0.006 : 0.003;
        rotAnglesRef.current.y += baseSpeed;
        rotVelRef.current.x *= 0.94;
        rotVelRef.current.y *= 0.94;
        rotAnglesRef.current.x += rotVelRef.current.x;
      }

      // Constrain vertical rotation pitch
      rotAnglesRef.current.x = Math.max(-1.1, Math.min(1.1, rotAnglesRef.current.x));

      const cosX = Math.cos(rotAnglesRef.current.x);
      const sinX = Math.sin(rotAnglesRef.current.x);
      const cosY = Math.cos(rotAnglesRef.current.y);
      const sinY = Math.sin(rotAnglesRef.current.y);

      // Camera FOV parameters
      const fov = 340;

      // Update impulses
      for (let i = impulsesRef.current.length - 1; i >= 0; i--) {
        const imp = impulsesRef.current[i];
        imp.radius += imp.speed;
        imp.alpha = Math.max(0, 1 - imp.radius / imp.maxRadius);
        if (imp.radius >= imp.maxRadius || imp.alpha <= 0.01) {
          impulsesRef.current.splice(i, 1);
        }
      }

      const nodes = nodesRef.current;
      const projectedNodes: {
        px: number;
        py: number;
        pz: number;
        scale: number;
        node: SynapseNode3D;
      }[] = [];

      // Rotate and project all nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // 3D Rotation Y
        let x1 = n.baseX * cosY - n.baseZ * sinY;
        let z1 = n.baseZ * cosY + n.baseX * sinY;

        // 3D Rotation X
        let y2 = n.baseY * cosX - z1 * sinX;
        let z2 = z1 * cosX + n.baseY * sinX;

        n.x = x1;
        n.y = y2;
        n.z = z2;

        // Check distance to any active impulses
        for (let k = 0; k < impulsesRef.current.length; k++) {
          const imp = impulsesRef.current[k];
          const distToOrigin = Math.sqrt(
            Math.pow(n.baseX - imp.originX, 2) +
              Math.pow(n.baseY - imp.originY, 2) +
              Math.pow(n.baseZ - imp.originZ, 2)
          );
          if (Math.abs(distToOrigin - imp.radius) < 24) {
            n.charge = Math.min(1.0, n.charge + 0.45 * imp.alpha);
          }
        }

        // Dissipate charge
        n.charge = Math.max(0.05, n.charge * 0.965);

        // Perspective projection
        const depth = fov / (fov + z2);
        const px = cx + x1 * depth;
        const py = cy + y2 * depth;

        projectedNodes.push({
          px,
          py,
          pz: z2,
          scale: depth,
          node: n,
        });
      }

      // Sort by depth (painter's algorithm)
      projectedNodes.sort((a, b) => b.pz - a.pz);

      // Render Synaptic Axon Links (connections)
      ctx.lineWidth = 0.75;
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        const projA = projectedNodes.find((p) => p.node === nodeA);
        if (!projA || projA.scale < 0.3) continue;

        for (let j = 0; j < nodeA.neighbors.length; j++) {
          const neighborIdx = nodeA.neighbors[j];
          const nodeB = nodes[neighborIdx];
          const projB = projectedNodes.find((p) => p.node === nodeB);
          if (!projB) continue;

          // Compute average depth and charge
          const avgScale = (projA.scale + projB.scale) / 2;
          const avgCharge = (nodeA.charge + nodeB.charge) / 2;
          const isLeft = nodeA.hemisphere === "left";

          let baseAlpha = 0.12 * avgScale;
          if (avgCharge > 0.3) {
            baseAlpha += avgCharge * 0.45;
          }

          ctx.beginPath();
          ctx.moveTo(projA.px, projA.py);
          ctx.lineTo(projB.px, projB.py);

          if (isLeft) {
            ctx.strokeStyle = `rgba(34, 211, 238, ${Math.min(0.85, baseAlpha)})`; // Cyan
          } else {
            ctx.strokeStyle = `rgba(52, 211, 153, ${Math.min(0.85, baseAlpha)})`; // Emerald
          }
          ctx.stroke();
        }
      }

      // Render 3D Synaptic Nodes (particles)
      for (let i = 0; i < projectedNodes.length; i++) {
        const p = projectedNodes[i];
        const n = p.node;
        const radius = Math.max(0.7, n.size * p.scale * (1 + n.charge * 0.8));
        const isLeft = n.hemisphere === "left";

        const baseAlpha = Math.max(0.25, Math.min(0.95, (p.scale - 0.4) * 1.5));
        const glowAlpha = Math.min(1.0, baseAlpha + n.charge * 0.6);

        // Core dot color: Left is Cyan/Blue, Right is Emerald/Green
        let coreColor = isLeft
          ? `rgba(56, 189, 248, ${glowAlpha})`
          : `rgba(52, 211, 153, ${glowAlpha})`;

        if (n.charge > 0.4) {
          // When excited by an impulse, shine brighter white-cyan/emerald
          coreColor = isLeft
            ? `rgba(224, 242, 254, ${glowAlpha})`
            : `rgba(209, 250, 229, ${glowAlpha})`;
        }

        ctx.beginPath();
        ctx.arc(p.px, p.py, radius, 0, Math.PI * 2);
        ctx.fillStyle = coreColor;
        ctx.fill();

        // High-charge or foreground halo glow
        if (p.scale > 0.85 || n.charge > 0.3) {
          ctx.beginPath();
          ctx.arc(p.px, p.py, radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = isLeft
            ? `rgba(6, 182, 212, ${0.18 * glowAlpha})`
            : `rgba(16, 185, 129, ${0.18 * glowAlpha})`;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [mode]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative rounded-3xl cinematic-glass p-5 sm:p-6 overflow-hidden flex flex-col items-center justify-between shadow-2xl border border-white/[0.08] bg-[#070D1B]/90 backdrop-blur-2xl transition-all duration-300",
        className
      )}
    >
      {/* ── CARD HEADER: TITLE + CALM/FOCUS MODE TOGGLES ── */}
      <div className="w-full flex items-center justify-between z-10 mb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase text-cyan-400">
            <svg
              className="w-3.5 h-3.5 text-cyan-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="2" x2="12" y2="22" />
            </svg>
            <span>Cognitive Synapse Engine</span>
          </div>
        </div>

        {/* Calm / Focus Toggles */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-full border border-white/10">
          <button
            type="button"
            onClick={() => setMode("calm")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200",
              mode === "calm"
                ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            Calm
          </button>
          <button
            type="button"
            onClick={() => setMode("focus")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200",
              mode === "focus"
                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            Focus
          </button>
        </div>
      </div>

      {/* ── 3D CANVAS VIEWPORT ── */}
      <div className="relative w-full h-[280px] sm:h-[320px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none">
        {/* Soft radial glow behind sphere */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-56 h-56 rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-3xl" />
          <div className="w-48 h-48 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-3xl ml-20" />
        </div>

        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={handleCanvasClick}
          className="w-full h-full touch-none"
        />
      </div>

      {/* ── INNER METADATA FOOTER STRIP ── */}
      <div className="w-full z-10 mt-1 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>750 Synaptic Nodes</span>
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Real-time Biometrics</span>
        </div>

        <div className="flex items-center gap-1.5 text-cyan-400 font-medium hidden sm:flex">
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
          <span>Click to fire impulses • Drag to rotate</span>
        </div>
      </div>
    </div>
  );
};

export default CognitiveSynapseEngine;
