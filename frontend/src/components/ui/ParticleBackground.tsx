import React, { useEffect, useRef } from "react";

interface ParticleBackgroundProps {
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

const PARTICLE_COUNT = 55;
const CONNECTION_DISTANCE = 130;
const DOT_OPACITY = 0.35;
const LINE_WIDTH = 0.7;

export function ParticleBackground({ className = "" }: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    let particles: Particle[] = [];

    // Helper to check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Resize canvas to fill parent element container
    const initCanvasSize = () => {
      const parent = canvas.parentElement;
      const width = parent ? parent.clientWidth : window.innerWidth;
      const height = parent ? parent.clientHeight : window.innerHeight;

      // Handle high-DPI displays while maintaining logical size
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);

      // Re-initialize or re-bound particles
      if (particles.length === 0) {
        particles = Array.from({ length: PARTICLE_COUNT }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.7, // Random velocity between -0.35 and +0.35
          vy: (Math.random() - 0.5) * 0.7,
          radius: 1 + Math.random() * 1.5, // Random 1px to 2.5px
        }));
      } else {
        // Keep particles within new boundaries
        particles.forEach((p) => {
          if (p.x > width) p.x = Math.random() * width;
          if (p.y > height) p.y = Math.random() * height;
        });
      }
    };

    initCanvasSize();

    // Debounced resize handler (150ms)
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        initCanvasSize();
      }, 150);
    };

    window.addEventListener("resize", handleResize);

    // Animation loop
    const render = () => {
      const parent = canvas.parentElement;
      const width = parent ? parent.clientWidth : window.innerWidth;
      const height = parent ? parent.clientHeight : window.innerHeight;

      // Detect dark mode on every frame for immediate theme toggle responsiveness
      const isDark = document.documentElement.classList.contains("dark");
      // Light: primary blue rgb(37, 99, 235), Dark: lighter blue rgb(59, 130, 246)
      const r = isDark ? 59 : 37;
      const g = isDark ? 130 : 99;
      const b = isDark ? 246 : 235;

      ctx.clearRect(0, 0, width, height);

      // Connect particles within CONNECTION_DISTANCE
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DISTANCE) {
            const lineOpacity = (1 - dist / CONNECTION_DISTANCE) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${lineOpacity})`;
            ctx.lineWidth = LINE_WIDTH;
            ctx.stroke();
          }
        }
      }

      // Draw and update each particle
      particles.forEach((p) => {
        // Draw dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${DOT_OPACITY})`;
        ctx.fill();

        // If reduced motion is preferred, keep particles static
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          // Bounce off bounds
          if (p.x <= 0 || p.x >= width) {
            p.vx *= -1;
            p.x = Math.max(0, Math.min(width, p.x));
          }
          if (p.y <= 0 || p.y >= height) {
            p.vy *= -1;
            p.y = Math.max(0, Math.min(height, p.y));
          }
        }
      });

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    />
  );
}

export default ParticleBackground;
