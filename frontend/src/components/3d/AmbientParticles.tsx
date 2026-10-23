import React, { useEffect, useRef, useMemo } from "react";

export interface AmbientParticlesProps {
  className?: string;
  particleCount?: number;
  interactive?: boolean;
  intensity?: "calm" | "medium" | "subtle";
}

interface Particle {
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  baseAlpha: number;
  alpha: number;
  vx: number;
  vy: number;
  pulseSpeed: number;
  pulseOffset: number;
}

export const AmbientParticles: React.FC<AmbientParticlesProps> = ({
  className = "",
  particleCount = 50,
  interactive = true,
  intensity = "calm",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const animFrameRef = useRef<number | null>(null);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Adapt particle count for mobile/tablet to preserve battery and 60fps
    const isMobile = width < 768;
    const adjustedCount = isMobile ? Math.min(22, particleCount) : particleCount;

    // Palette: Calm Deep Teal, Cyan, Soft Violet/Indigo
    const colors = [
      "rgba(45, 212, 191, ",  // Teal #2DD4BF
      "rgba(56, 189, 248, ",  // Cyan #38BDF8
      "rgba(129, 140, 248, ", // Soft Violet #818CF8
      "rgba(94, 234, 212, ",  // Light Teal #5EEAD4
    ];

    const alphaMultiplier = intensity === "subtle" ? 0.35 : intensity === "calm" ? 0.55 : 0.75;

    const particles: Particle[] = Array.from({ length: adjustedCount }, () => {
      const z = Math.random() * 0.8 + 0.2; // depth factor (0.2 to 1.0)
      const baseAlpha = (Math.random() * 0.35 + 0.15) * alphaMultiplier * z;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        z,
        radius: (Math.random() * 1.8 + 0.8) * z,
        color: colors[Math.floor(Math.random() * colors.length)],
        baseAlpha,
        alpha: baseAlpha,
        vx: (Math.random() - 0.5) * 0.25 * z,
        vy: -(Math.random() * 0.3 + 0.08) * z, // gentle slow upward drift
        pulseSpeed: Math.random() * 0.02 + 0.008,
        pulseOffset: Math.random() * Math.PI * 2,
      };
    });

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      // Normalized offset from center [-1, 1]
      mouseRef.current.targetX = (e.clientX / width - 0.5) * 2;
      mouseRef.current.targetY = (e.clientY / height - 0.5) * 2;
    };

    window.addEventListener("resize", handleResize, { passive: true });
    if (interactive) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
    }

    let clock = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth pointer parallax damping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

      clock += 0.02;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.x += p.vx - mouseRef.current.x * 0.3 * p.z;
          p.y += p.vy - mouseRef.current.y * 0.3 * p.z;

          // Wrap around edges gracefully
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;

          // Soft sinusoidal twinkle
          p.alpha = p.baseAlpha * (0.8 + 0.3 * Math.sin(clock * p.pulseSpeed * 50 + p.pulseOffset));
        }

        // Draw soft glowing orb
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0, Math.min(1, p.alpha))})`;
        ctx.fill();

        // Subtle outer glow for larger particles
        if (p.radius > 1.2 && !isMobile) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.alpha * 0.25})`;
          ctx.fill();
        }
      }

      if (!prefersReducedMotion) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    if (prefersReducedMotion) {
      render(); // Single static frame
    } else {
      animFrameRef.current = requestAnimationFrame(render);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (interactive) {
        window.removeEventListener("mousemove", handleMouseMove);
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [particleCount, interactive, intensity, prefersReducedMotion]);

  return (
    <div 
      className={`fixed inset-0 pointer-events-none -z-10 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Ambient background illumination gradient mesh */}
      <div 
        className="absolute inset-0 opacity-40 dark:opacity-25"
        style={{
          background: `
            radial-gradient(circle at 18% 15%, rgba(56, 189, 248, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 82% 25%, rgba(129, 140, 248, 0.07) 0%, transparent 45%),
            radial-gradient(circle at 50% 85%, rgba(45, 212, 191, 0.06) 0%, transparent 50%)
          `,
        }}
      />
      {/* 2D/3D Ambient Particles Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 h-full w-full pointer-events-none" 
      />
    </div>
  );
};

export default AmbientParticles;
