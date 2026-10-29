import React, { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";

export interface BioNeuralSynapseMeshProps {
  className?: string;
  nodeCount?: number;
  interactive?: boolean;
}

type ModalityType = "biometric" | "cognitive" | "affective" | "circadian" | "hub";

interface ModalityStyle {
  label: string;
  darkColor: string;
  darkGlow: string;
  lightColor: string;
  lightGlow: string;
}

const MODALITY_CONFIG: Record<ModalityType, ModalityStyle> = {
  biometric: {
    label: "Biometric Vitals",
    darkColor: "rgba(34, 211, 238, 0.85)", // Cyan
    darkGlow: "rgba(34, 211, 238, 0.4)",
    lightColor: "rgba(14, 165, 233, 0.75)",
    lightGlow: "rgba(14, 165, 233, 0.3)",
  },
  cognitive: {
    label: "Cognitive Sentiment",
    darkColor: "rgba(168, 85, 247, 0.85)", // Violet
    darkGlow: "rgba(168, 85, 247, 0.4)",
    lightColor: "rgba(124, 58, 237, 0.75)",
    lightGlow: "rgba(124, 58, 237, 0.3)",
  },
  affective: {
    label: "Affective Velocity",
    darkColor: "rgba(251, 113, 133, 0.85)", // Rose
    darkGlow: "rgba(251, 113, 133, 0.4)",
    lightColor: "rgba(225, 29, 72, 0.75)",
    lightGlow: "rgba(225, 29, 72, 0.3)",
  },
  circadian: {
    label: "Circadian Rhythm",
    darkColor: "rgba(45, 212, 191, 0.85)", // Teal
    darkGlow: "rgba(45, 212, 191, 0.4)",
    lightColor: "rgba(13, 148, 136, 0.75)",
    lightGlow: "rgba(13, 148, 136, 0.3)",
  },
  hub: {
    label: "Multimodal Hub",
    darkColor: "rgba(251, 191, 36, 0.95)", // Gold
    darkGlow: "rgba(251, 191, 36, 0.5)",
    lightColor: "rgba(217, 119, 6, 0.8)",
    lightGlow: "rgba(217, 119, 6, 0.35)",
  },
};

interface NeuralNode {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  phase: number;
  speed: number;
  depth: number; // 0.4 (distant) to 1.0 (foreground)
  radius: number;
  modality: ModalityType;
  charge: number; // 0 to 1, increases on action potential or proximity
  ripples: { radius: number; maxRadius: number; alpha: number }[];
  connections: number[];
}

interface ActionPotential {
  from: number;
  to: number;
  progress: number;
  speed: number;
  color: string;
}

export const BioNeuralSynapseMesh: React.FC<BioNeuralSynapseMeshProps> = ({
  className,
  nodeCount,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Mouse coordinates in viewport
    const mouse = {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      active: false,
    };

    // Parallax scroll state
    let scrollY = window.scrollY || 0;
    let targetScrollY = scrollY;

    const onScroll = () => {
      targetScrollY = window.scrollY || 0;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Node & pulse arrays
    let nodes: NeuralNode[] = [];
    const pulses: ActionPotential[] = [];
    let frame = 0;
    let prevWidth = window.innerWidth;
    let prevHeight = window.innerHeight;

    const modalities: ModalityType[] = ["biometric", "cognitive", "affective", "circadian", "hub"];

    const updateCanvasDimensions = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      return { w, h };
    };

    const recomputeNeighbors = (w: number) => {
      // Calibrate connection distance adaptively based on screen width
      const isMobile = w < 640;
      const isTablet = w < 1024;
      const maxConnectDist = isMobile
        ? Math.max(90, Math.min(w * 0.32, 120))
        : isTablet
        ? 140
        : 175;
      const maxDistSq = maxConnectDist * maxConnectDist;
      const maxNeighbors = isMobile ? 3 : 4;

      for (let i = 0; i < nodes.length; i++) {
        const neighbors: { idx: number; distSq: number }[] = [];
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distSq = dx * dx + dy * dy;
          if (distSq < maxDistSq) {
            neighbors.push({ idx: j, distSq });
          }
        }
        neighbors.sort((a, b) => a.distSq - b.distSq);
        nodes[i].connections = neighbors.slice(0, maxNeighbors).map((n) => n.idx);
      }
    };

    const initNetwork = (isInitial = false) => {
      const { w, h } = updateCanvasDimensions();
      const isMobile = w < 640;
      const isTablet = w < 1024;

      // Adaptive node count based on screen width
      const targetCount =
        nodeCount || (isMobile ? 48 : isTablet ? 85 : 130);

      if (isInitial || nodes.length === 0) {
        nodes = [];
        pulses.length = 0;

        for (let i = 0; i < targetCount; i++) {
          const x = Math.random() * w;
          const y = Math.random() * h;
          const depth = 0.4 + Math.random() * 0.6; // 0.4 to 1.0
          const modalityChoice =
            Math.random() < 0.12
              ? "hub"
              : modalities[Math.floor(Math.random() * (modalities.length - 1))];

          const baseRadius = (modalityChoice === "hub" ? 3.2 : 1.8) * (isMobile ? 0.85 : 1);

          nodes.push({
            x,
            y,
            baseX: x,
            baseY: y,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            phase: Math.random() * Math.PI * 2,
            speed: 0.008 + Math.random() * 0.012,
            depth,
            radius: baseRadius * depth,
            modality: modalityChoice,
            charge: Math.random() < 0.1 ? 0.8 : 0,
            ripples: [],
            connections: [],
          });
        }
      } else {
        // Anatomically / proportionally resize existing nodes without jarring resets
        const scaleX = prevWidth > 0 ? w / prevWidth : 1;
        const scaleY = prevHeight > 0 ? h / prevHeight : 1;

        nodes.forEach((node) => {
          node.baseX = Math.max(0, Math.min(w, node.baseX * scaleX));
          node.baseY = Math.max(0, Math.min(h, node.baseY * scaleY));
          node.x = Math.max(0, Math.min(w, node.x * scaleX));
          node.y = Math.max(0, Math.min(h, node.y * scaleY));
        });

        // Add or trim nodes if significant layout change (e.g. phone portrait to landscape)
        while (nodes.length < targetCount) {
          const x = Math.random() * w;
          const y = Math.random() * h;
          const depth = 0.4 + Math.random() * 0.6;
          const modalityChoice =
            Math.random() < 0.12
              ? "hub"
              : modalities[Math.floor(Math.random() * (modalities.length - 1))];
          const baseRadius = (modalityChoice === "hub" ? 3.2 : 1.8) * (isMobile ? 0.85 : 1);

          nodes.push({
            x,
            y,
            baseX: x,
            baseY: y,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            phase: Math.random() * Math.PI * 2,
            speed: 0.008 + Math.random() * 0.012,
            depth,
            radius: baseRadius * depth,
            modality: modalityChoice,
            charge: 0,
            ripples: [],
            connections: [],
          });
        }
        if (nodes.length > targetCount + 10) {
          nodes.splice(targetCount);
        }
      }

      prevWidth = w;
      prevHeight = h;
      recomputeNeighbors(w);
    };

    initNetwork(true);

    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        initNetwork(false);
      }, 100);
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    // Mouse handlers
    const onMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const onMouseLeave = () => {
      mouse.active = false;
    };

    const triggerBurst = (cx: number, cy: number) => {
      const isMobile = window.innerWidth < 640;
      const burstRadius = isMobile ? 150 : 220;

      nodes.forEach((node, idx) => {
        const dx = node.x - cx;
        const dy = node.y - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < burstRadius) {
          node.charge = 1.0;
          node.ripples.push({ radius: node.radius, maxRadius: isMobile ? 26 : 36, alpha: 0.9 });
          // Launch pulses along its connections
          node.connections.forEach((targetIdx) => {
            pulses.push({
              from: idx,
              to: targetIdx,
              progress: 0,
              speed: 0.03 + Math.random() * 0.02,
              color: "#ffffff",
            });
          });
        }
      });
    };

    const onClick = (e: MouseEvent) => {
      if (!interactive) return;
      triggerBurst(e.clientX, e.clientY);
    };

    // Phone / Touch Screen Handlers
    const onTouchStart = (e: TouchEvent) => {
      if (!interactive || e.touches.length === 0) return;
      const touch = e.touches[0];
      mouse.targetX = touch.clientX;
      mouse.targetY = touch.clientY;
      mouse.x = touch.clientX;
      mouse.y = touch.clientY;
      mouse.active = true;
      triggerBurst(touch.clientX, touch.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!interactive || e.touches.length === 0) return;
      const touch = e.touches[0];
      mouse.targetX = touch.clientX;
      mouse.targetY = touch.clientY;
      mouse.active = true;
    };

    const onTouchEnd = () => {
      mouse.active = false;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("click", onClick);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    // Helper to launch action potential between connected nodes
    const fireActionPotential = (fromIdx: number, toIdx: number) => {
      if (pulses.length > 35) return; // Cap simultaneous pulses for performance
      const isDark = document.documentElement.classList.contains("dark");
      const fromNode = nodes[fromIdx];
      const cfg = MODALITY_CONFIG[fromNode.modality];
      pulses.push({
        from: fromIdx,
        to: toIdx,
        progress: 0,
        speed: 0.018 + Math.random() * 0.018,
        color: isDark ? "#ffffff" : cfg.lightColor,
      });
    };

    // Main animation loop
    const render = () => {
      frame++;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isDark = document.documentElement.classList.contains("dark");

      // Smooth mouse interpolation
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.12;
        mouse.y += (mouse.targetY - mouse.y) * 0.12;
      }

      // Smooth scroll parallax interpolation
      scrollY += (targetScrollY - scrollY) * 0.08;

      ctx.clearRect(0, 0, w, h);

      // Periodically trigger spontaneous action potentials (every 50-70 frames)
      if (!prefersReducedMotion && frame % 55 === 0 && nodes.length > 0) {
        const sourceIdx = Math.floor(Math.random() * nodes.length);
        const sourceNode = nodes[sourceIdx];
        sourceNode.charge = 0.9;
        sourceNode.ripples.push({ radius: sourceNode.radius, maxRadius: 28, alpha: 0.8 });

        if (sourceNode.connections.length > 0) {
          const randConn =
            sourceNode.connections[
              Math.floor(Math.random() * sourceNode.connections.length)
            ];
          fireActionPotential(sourceIdx, randConn);
        }
      }

      // 1. UPDATE NODE POSITIONS & CHARGES
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        if (!prefersReducedMotion) {
          node.phase += node.speed;
          // Harmonic undulating floating drift
          node.x = node.baseX + Math.sin(node.phase) * 18 * node.depth;
          node.y = node.baseY + Math.cos(node.phase * 0.8) * 18 * node.depth;

          // Parallax vertical translation modulated by depth
          const parallaxOffset = (scrollY * 0.15 * (1 - node.depth)) % h;
          let screenY = node.y - parallaxOffset;
          if (screenY < -50) screenY += h + 100;
          if (screenY > h + 50) screenY -= h + 100;
          node.y = screenY;

          // Mouse proximity attraction & excitation
          if (mouse.active) {
            const mdx = node.x - mouse.x;
            const mdy = node.y - mouse.y;
            const dist = Math.sqrt(mdx * mdx + mdy * mdy);
            const influenceRadius = 160;

            if (dist < influenceRadius) {
              const force = (1 - dist / influenceRadius) * 15;
              node.x += (mdx / dist) * force * 0.4;
              node.y += (mdy / dist) * force * 0.4;
              node.charge = Math.max(node.charge, 0.75 * (1 - dist / influenceRadius));
            }
          }

          // Charge decay
          if (node.charge > 0) {
            node.charge = Math.max(0, node.charge - 0.015);
          }
        }

        // Update ripple rings
        for (let r = node.ripples.length - 1; r >= 0; r--) {
          const rip = node.ripples[r];
          rip.radius += 0.85;
          rip.alpha *= 0.93;
          if (rip.alpha < 0.03 || rip.radius > rip.maxRadius) {
            node.ripples.splice(r, 1);
          }
        }
      }

      // 2. DRAW SYNAPSE CONNECTIONS
      const drawnPairs = new Set<string>();

      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        const styleA = MODALITY_CONFIG[nodeA.modality];

        for (const connIdx of nodeA.connections) {
          const nodeB = nodes[connIdx];
          const pairKey = i < connIdx ? `${i}_${connIdx}` : `${connIdx}_${i}`;
          if (drawnPairs.has(pairKey)) continue;
          drawnPairs.add(pairKey);

          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = w < 768 ? 130 : 175;

          if (dist > maxDist) continue;

          const distRatio = 1 - dist / maxDist;
          const combinedCharge = Math.max(nodeA.charge, nodeB.charge);
          const baseAlpha = isDark ? 0.08 : 0.06;
          const lineAlpha = (baseAlpha + distRatio * 0.16 + combinedCharge * 0.35) * nodeA.depth;

          // Dynamic gradient line between node modalities
          const grad = ctx.createLinearGradient(nodeA.x, nodeA.y, nodeB.x, nodeB.y);
          const colA = isDark ? styleA.darkColor : styleA.lightColor;
          const colB = isDark
            ? MODALITY_CONFIG[nodeB.modality].darkColor
            : MODALITY_CONFIG[nodeB.modality].lightColor;

          grad.addColorStop(0, colA.replace(/[\d.]+\)$/, `${lineAlpha})`));
          grad.addColorStop(1, colB.replace(/[\d.]+\)$/, `${lineAlpha})`));

          ctx.beginPath();
          ctx.moveTo(nodeA.x, nodeA.y);
          ctx.lineTo(nodeB.x, nodeB.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = combinedCharge > 0.4 ? 1.4 : 0.7;
          ctx.stroke();
        }
      }

      // Draw interactive synaptic bridges to cursor
      if (mouse.active && interactive) {
        const cursorNeighbors: { idx: number; dist: number }[] = [];
        for (let i = 0; i < nodes.length; i++) {
          const dx = nodes[i].x - mouse.x;
          const dy = nodes[i].y - mouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 180) {
            cursorNeighbors.push({ idx: i, dist: d });
          }
        }
        cursorNeighbors.sort((a, b) => a.dist - b.dist);

        cursorNeighbors.slice(0, 3).forEach(({ idx, dist }) => {
          const target = nodes[idx];
          const alpha = (1 - dist / 180) * (isDark ? 0.4 : 0.3);
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = isDark
            ? `rgba(99, 179, 255, ${alpha})`
            : `rgba(37, 99, 235, ${alpha})`;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }

      // 3. DRAW ACTION POTENTIAL PULSES (SIGNAL TRAINS)
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        pulse.progress += pulse.speed;

        if (pulse.progress >= 1.0) {
          // Reached target node! Deliver excitation charge
          const targetNode = nodes[pulse.to];
          targetNode.charge = 1.0;
          targetNode.ripples.push({
            radius: targetNode.radius,
            maxRadius: 26,
            alpha: 0.85,
          });

          // Cascade: 30% chance to relay signal onward to one of target's connections
          if (!prefersReducedMotion && Math.random() < 0.35 && targetNode.connections.length > 0) {
            const nextIdx =
              targetNode.connections[
                Math.floor(Math.random() * targetNode.connections.length)
              ];
            if (nextIdx !== pulse.from) {
              fireActionPotential(pulse.to, nextIdx);
            }
          }

          pulses.splice(p, 1);
          continue;
        }

        const nodeFrom = nodes[pulse.from];
        const nodeTo = nodes[pulse.to];
        const currentX = nodeFrom.x + (nodeTo.x - nodeFrom.x) * pulse.progress;
        const currentY = nodeFrom.y + (nodeTo.y - nodeFrom.y) * pulse.progress;

        // Draw traveling action potential photon
        ctx.beginPath();
        ctx.arc(currentX, currentY, 2.5 * nodeFrom.depth, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? "#ffffff" : "#2563eb";
        ctx.shadowColor = isDark ? "#60a5fa" : "#3b82f6";
        ctx.shadowBlur = isDark ? 8 : 4;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      // 4. DRAW NODES & RIPPLE WAVES
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const style = MODALITY_CONFIG[node.modality];

        // Draw expanding ripple rings
        for (const rip of node.ripples) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, rip.radius, 0, Math.PI * 2);
          ctx.strokeStyle = isDark
            ? style.darkColor.replace(/[\d.]+\)$/, `${rip.alpha})`)
            : style.lightColor.replace(/[\d.]+\)$/, `${rip.alpha})`);
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        const effectiveRadius =
          node.radius * (1 + node.charge * 0.65) * (isDark ? 1 : 0.95);

        // Soft outer ambient halo
        const haloRadius = effectiveRadius * (node.charge > 0.4 ? 4.0 : 2.5);
        const haloGrad = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          haloRadius
        );
        const glowColor = isDark ? style.darkGlow : style.lightGlow;
        haloGrad.addColorStop(
          0,
          glowColor.replace(/[\d.]+\)$/, `${(0.45 + node.charge * 0.4) * node.depth})`)
        );
        haloGrad.addColorStop(1, "transparent");

        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, haloRadius, 0, Math.PI * 2);
        ctx.fill();

        // Node center core
        ctx.beginPath();
        ctx.arc(node.x, node.y, effectiveRadius, 0, Math.PI * 2);
        const coreAlpha = (0.6 + node.charge * 0.4) * node.depth;
        const baseCol = isDark ? style.darkColor : style.lightColor;
        ctx.fillStyle = node.charge > 0.6 && isDark ? "#ffffff" : baseCol.replace(/[\d.]+\)$/, `${coreAlpha})`);
        ctx.fill();
      }

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("click", onClick);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, [nodeCount, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none block", className)}
      role="presentation"
      aria-hidden="true"
    />
  );
};

export default BioNeuralSynapseMesh;
