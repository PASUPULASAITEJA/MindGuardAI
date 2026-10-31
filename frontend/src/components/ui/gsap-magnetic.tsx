import React, { useRef, useEffect } from "react";
import gsap from "gsap";

interface GsapMagneticProps {
  children: React.ReactElement;
  strength?: number; // Distance factor (default 0.35)
  active?: boolean;
}

/**
 * GsapMagnetic
 * Signature GSAP UI Interaction: Cursor pulls button/element with elastic magnetic physics.
 * Source reference: https://gsap.com/showcase/?tags=UI+Interactions
 */
export const GsapMagnetic: React.FC<GsapMagneticProps> = ({
  children,
  strength = 0.35,
  active = true,
}) => {
  const magneticRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const el = magneticRef.current;
    if (!el) return;

    // Check prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      xTo(deltaX);
      yTo(deltaY);
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: "elastic.out(1.1, 0.4)",
      });
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
      gsap.killTweensOf(el);
    };
  }, [strength, active]);

  return (
    <div ref={magneticRef} className="inline-block will-change-transform">
      {children}
    </div>
  );
};

export default GsapMagnetic;
