import React, { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";

export interface BrainAnimationProps {
  className?: string;
  size?: number; // override default size
}

interface Point3D {
  x: number;
  y: number;
  z: number;
  neighbors: number[];
}

interface ProjectedPoint {
  screenX: number;
  screenY: number;
  rz: number;
  scale: number;
  nodeSize: number;
  nodeAlpha: number;
  visible: boolean;
}

interface FiringNeuron {
  index: number;
  frame: number;
  maxFrames: 20;
}

export function BrainAnimation({ className, size }: BrainAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let rotY = 0;
    let frameCount = 0;
    const firingNeurons: FiringNeuron[] = [];

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 1. Generate Brain Coordinates (~180 neurons across left and right lobes)
    const points: Point3D[] = [];

    // Left Lobe (90 points)
    for (let i = 0; i < 90; i++) {
      const t = (i / 90) * Math.PI * 2;
      let x = -0.35 + 0.38 * Math.cos(t) + 0.08 * Math.cos(2 * t);
      let y = -0.05 + 0.30 * Math.sin(t) - 0.05 * Math.sin(2 * t);
      let z = 0.25 * Math.sin(t) * Math.cos(t / 2);

      x += (Math.random() - 0.5) * 0.12;
      y += (Math.random() - 0.5) * 0.12;
      z += (Math.random() - 0.5) * 0.15;

      points.push({ x, y, z, neighbors: [] });
    }

    // Right Lobe (90 points)
    for (let i = 0; i < 90; i++) {
      const t = (i / 90) * Math.PI * 2;
      let x = 0.35 + 0.38 * Math.cos(t) - 0.08 * Math.cos(2 * t);
      let y = -0.05 + 0.30 * Math.sin(t) - 0.05 * Math.sin(2 * t);
      let z = 0.25 * Math.sin(t) * Math.cos(t / 2);

      x += (Math.random() - 0.5) * 0.12;
      y += (Math.random() - 0.5) * 0.12;
      z += (Math.random() - 0.5) * 0.15;

      points.push({ x, y, z, neighbors: [] });
    }

    // 2. Precompute 3 nearest neighbors in 3D for each neuron
    for (let i = 0; i < points.length; i++) {
      const distances: { index: number; dist: number }[] = [];
      for (let j = 0; j < points.length; j++) {
        if (i === j) continue;
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dz = points[i].z - points[j].z;
        distances.push({ index: j, dist: dx * dx + dy * dy + dz * dz });
      }
      distances.sort((a, b) => a.dist - b.dist);
      points[i].neighbors = distances.slice(0, 3).map((d) => d.index);
    }

    // 3. Canvas sizing with DPR
    let currentLogicalSize = size || (window.innerWidth < 768 ? 300 : 480);

    const setupCanvas = () => {
      currentLogicalSize = size || (window.innerWidth < 768 ? 300 : 480);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = currentLogicalSize * dpr;
      canvas.height = currentLogicalSize * dpr;
      canvas.style.width = `${currentLogicalSize}px`;
      canvas.style.height = `${currentLogicalSize}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    setupCanvas();

    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setupCanvas();
        if (prefersReducedMotion) {
          renderFrame();
        }
      }, 200);
    };

    window.addEventListener("resize", handleResize);

    // 4. Main Render Loop
    const renderFrame = () => {
      const isDark = document.documentElement.classList.contains("dark");
      const width = currentLogicalSize;
      const height = currentLogicalSize;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Ambient radial glow behind the brain
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.36);
      glow.addColorStop(0, isDark ? "rgba(59, 130, 246, 0.12)" : "rgba(37, 99, 235, 0.07)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Handle neuron firing triggers (every 45 frames, max 6 simultaneous)
      if (!prefersReducedMotion) {
        frameCount++;
        if (frameCount % 45 === 0 && firingNeurons.length < 6) {
          const availableIndices = Array.from({ length: points.length }, (_, i) => i).filter(
            (idx) => !firingNeurons.some((fn) => fn.index === idx)
          );
          for (let k = 0; k < 3 && availableIndices.length > 0; k++) {
            const randIdx = Math.floor(Math.random() * availableIndices.length);
            firingNeurons.push({
              index: availableIndices[randIdx],
              frame: 0,
              maxFrames: 20,
            });
            availableIndices.splice(randIdx, 1);
          }
        }
      }

      // Map active firing states
      const firingMap = new Map<number, { progress: number; frame: number }>();
      for (let i = firingNeurons.length - 1; i >= 0; i--) {
        const fn = firingNeurons[i];
        fn.frame++;
        if (fn.frame >= fn.maxFrames) {
          firingNeurons.splice(i, 1);
        } else {
          firingMap.set(fn.index, { progress: fn.frame / fn.maxFrames, frame: fn.frame });
        }
      }

      // 3D Rotation & Perspective Projection
      const cosR = Math.cos(rotY);
      const sinR = Math.sin(rotY);
      const perspective = 2.5;

      const projected: ProjectedPoint[] = points.map((p) => {
        const rx = p.x * cosR - p.z * sinR;
        const rz = p.x * sinR + p.z * cosR;
        const ry = p.y;

        // Skip fully occluded back points
        if (rz < -0.8) {
          return {
            screenX: 0,
            screenY: 0,
            rz,
            scale: 0,
            nodeSize: 0,
            nodeAlpha: 0,
            visible: false,
          };
        }

        const scale = perspective / (perspective + rz);
        const screenX = cx + rx * width * 0.38 * scale;
        const screenY = cy + ry * height * 0.55 * scale;
        const nodeSize = Math.max(1, (2.5 + rz * 1.5) * scale);
        const nodeAlpha = Math.max(0.12, Math.min(1, 0.3 + (rz + 0.5) * 0.5));

        return {
          screenX,
          screenY,
          rz,
          scale,
          nodeSize,
          nodeAlpha,
          visible: true,
        };
      });

      // 5. Draw Synapse Connections
      // Draw lines between connected neurons if both are on front side (rz > -0.3)
      for (let i = 0; i < points.length; i++) {
        const p1 = projected[i];
        if (!p1.visible || p1.rz <= -0.3) continue;

        const isP1Firing = firingMap.has(i);

        for (const neighborIdx of points[i].neighbors) {
          // Avoid duplicate lines by ordering index
          if (i > neighborIdx) continue;

          const p2 = projected[neighborIdx];
          if (!p2.visible || p2.rz <= -0.3) continue;

          const isP2Firing = firingMap.has(neighborIdx);
          const isLineActive = isP1Firing || isP2Firing;

          ctx.beginPath();
          ctx.moveTo(p1.screenX, p1.screenY);
          ctx.lineTo(p2.screenX, p2.screenY);

          if (isLineActive) {
            // Firing connection: bright blue/white, higher alpha
            ctx.strokeStyle = isDark
              ? "rgba(147, 197, 253, 0.7)"
              : "rgba(37, 99, 235, 0.65)";
            ctx.lineWidth = 1.4;
          } else {
            // Normal connection
            const lineAlpha = isDark
              ? Math.min(0.22, Math.max(0.12, 0.12 + (p1.rz + 0.3) * 0.12))
              : Math.min(0.18, Math.max(0.08, 0.08 + (p1.rz + 0.3) * 0.1));
            ctx.strokeStyle = isDark
              ? `rgba(99, 179, 255, ${lineAlpha})`
              : `rgba(37, 99, 235, ${lineAlpha})`;
            ctx.lineWidth = 0.6;
          }
          ctx.stroke();
        }
      }

      // 6. Draw Neurons (sort by depth rz so front nodes draw over back ones)
      const renderIndices = points
        .map((_, idx) => idx)
        .filter((idx) => projected[idx].visible)
        .sort((a, b) => projected[a].rz - projected[b].rz);

      for (const idx of renderIndices) {
        const p = projected[idx];
        const firing = firingMap.get(idx);

        if (firing) {
          const progress = firing.progress;

          // Expanding pulse ring
          const ringRadius = p.nodeSize * 2 + progress * 16;
          const ringAlpha = Math.max(0, 1 - progress);
          ctx.beginPath();
          ctx.arc(p.screenX, p.screenY, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = isDark
            ? `rgba(99, 179, 255, ${ringAlpha * 0.6})`
            : `rgba(37, 99, 235, ${ringAlpha * 0.5})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Outer halo glow
          ctx.beginPath();
          ctx.arc(p.screenX, p.screenY, p.nodeSize * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = isDark
            ? "rgba(99, 179, 255, 0.5)"
            : "rgba(37, 99, 235, 0.4)";
          ctx.fill();

          // Bright center core
          ctx.beginPath();
          ctx.arc(p.screenX, p.screenY, p.nodeSize * 2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
          ctx.fill();
        } else {
          // Normal neuron
          ctx.beginPath();
          ctx.arc(p.screenX, p.screenY, p.nodeSize, 0, Math.PI * 2);
          const alpha = isDark ? Math.min(1, p.nodeAlpha + 0.1) : p.nodeAlpha;
          ctx.fillStyle = isDark
            ? `rgba(59, 130, 246, ${alpha})`
            : `rgba(37, 99, 235, ${alpha})`;
          ctx.fill();
        }
      }

      // Step rotation
      if (!prefersReducedMotion) {
        rotY += 0.004;
        animationFrameId = requestAnimationFrame(renderFrame);
      }
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, [size]);

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <canvas
        ref={canvasRef}
        className="block"
        role="img"
        aria-label="Animated 3D brain visualization representing neural activity and mental wellness"
      />
    </div>
  );
}

export default BrainAnimation;
