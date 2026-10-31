import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { cn } from "@/utils/cn";

interface GsapInteractiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxRotation?: number; // Maximum rotation in degrees (e.g. 7)
  glare?: boolean;
}

/**
 * GsapInteractiveCard
 * Signature 3D interactive card with GSAP physics tilt and smooth elastic rebound.
 * Source reference: https://gsap.com/showcase/?tags=UI+Interactions
 */
export const GsapInteractiveCard: React.FC<GsapInteractiveCardProps> = ({
  children,
  className,
  maxRotation = 6,
  glare = true,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const glareRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const rxTo = gsap.quickTo(card, "rotationX", { duration: 0.4, ease: "power2.out" });
    const ryTo = gsap.quickTo(card, "rotationY", { duration: 0.4, ease: "power2.out" });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const normX = (x / rect.width - 0.5) * 2; // -1 to 1
      const normY = (y / rect.height - 0.5) * 2; // -1 to 1

      // Tilt
      rxTo(-normY * maxRotation);
      ryTo(normX * maxRotation);

      // Glare highlight position
      if (glare && glareRef.current) {
        gsap.to(glareRef.current, {
          opacity: 0.15,
          x: x - 100,
          y: y - 100,
          duration: 0.2,
          ease: "power1.out",
        });
      }
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        duration: 0.8,
        ease: "elastic.out(1, 0.4)",
      });

      if (glare && glareRef.current) {
        gsap.to(glareRef.current, {
          opacity: 0,
          duration: 0.4,
          ease: "power2.out",
        });
      }
    };

    const handleMouseEnter = () => {
      gsap.to(card, {
        scale: 1.015,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);
    card.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
      card.removeEventListener("mouseenter", handleMouseEnter);
      gsap.killTweensOf(card);
    };
  }, [maxRotation, glare]);

  return (
    <div
      style={{ perspective: 1000 }}
      className="transform-gpu"
    >
      <div
        ref={cardRef}
        className={cn(
          "relative overflow-hidden rounded-2xl bg-card border border-border shadow-xs transition-shadow duration-300 hover:shadow-xl hover:border-primary/30 will-change-transform",
          className
        )}
        {...props}
      >
        {glare && (
          <div
            ref={glareRef}
            aria-hidden="true"
            className="pointer-events-none absolute w-52 h-52 rounded-full bg-radial from-primary/30 to-transparent blur-xl opacity-0 -z-0"
          />
        )}
        <div className="relative z-10 w-full h-full">{children}</div>
      </div>
    </div>
  );
};

export default GsapInteractiveCard;
