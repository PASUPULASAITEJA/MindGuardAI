import React, { useRef, useEffect } from "react";
import gsap from "gsap";

interface GsapStaggerProps {
  children: React.ReactNode;
  stagger?: number;
  duration?: number;
  yOffset?: number;
  className?: string;
  triggerKey?: any; // Re-triggers animation when this key changes
}

/**
 * GsapStagger
 * Smooth GSAP timeline entrance animation that staggers direct children into view.
 * Reference: https://gsap.com/showcase/?tags=UI+Interactions
 */
export const GsapStagger: React.FC<GsapStaggerProps> = ({
  children,
  stagger = 0.08,
  duration = 0.65,
  yOffset = 24,
  className = "",
  triggerKey,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const items = container.children;
    if (!items.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        {
          opacity: 0,
          y: yOffset,
          scale: 0.98,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration,
          stagger,
          ease: "power3.out",
          clearProps: "transform,opacity",
        }
      );
    }, container);

    return () => ctx.revert();
  }, [stagger, duration, yOffset, triggerKey]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

export default GsapStagger;
