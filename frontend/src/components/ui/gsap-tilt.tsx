import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface GSAPTiltProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxTilt?: number; // max tilt degrees (e.g., 8)
  perspective?: number; // 3d perspective in px
  scaleOnHover?: number; // scale factor e.g., 1.02
  className?: string;
  glareEffect?: boolean;
}

export const GSAPTilt: React.FC<GSAPTiltProps> = ({
  children,
  maxTilt = 7,
  perspective = 1000,
  scaleOnHover = 1.015,
  className = "",
  glareEffect = true,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const card = cardRef.current;
      if (!card) return;

      const handleMouseMove = (e: MouseEvent) => {
        const bounds = card.getBoundingClientRect();
        const mouseX = e.clientX - bounds.left;
        const mouseY = e.clientY - bounds.top;

        const xPct = (mouseX / bounds.width - 0.5) * 2; // -1 to 1
        const yPct = (mouseY / bounds.height - 0.5) * 2; // -1 to 1

        const rotateY = xPct * maxTilt;
        const rotateX = -yPct * maxTilt;

        gsap.to(card, {
          rotateX,
          rotateY,
          scale: scaleOnHover,
          duration: 0.35,
          ease: "power2.out",
          transformPerspective: perspective,
          transformStyle: "preserve-3d",
          overwrite: "auto",
        });

        if (glareEffect && glareRef.current) {
          gsap.to(glareRef.current, {
            opacity: 0.15,
            x: (mouseX / bounds.width) * 100 + "%",
            y: (mouseY / bounds.height) * 100 + "%",
            duration: 0.25,
            ease: "power1.out",
          });
        }
      };

      const handleMouseLeave = () => {
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          scale: 1,
          duration: 0.7,
          ease: "power3.out",
          overwrite: "auto",
        });

        if (glareEffect && glareRef.current) {
          gsap.to(glareRef.current, {
            opacity: 0,
            duration: 0.4,
          });
        }
      };

      card.addEventListener("mousemove", handleMouseMove);
      card.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        card.removeEventListener("mousemove", handleMouseMove);
        card.removeEventListener("mouseleave", handleMouseLeave);
      };
    },
    { scope: cardRef, dependencies: [maxTilt, perspective, scaleOnHover, glareEffect] }
  );

  return (
    <div
      ref={cardRef}
      className={`relative will-change-transform ${className}`}
      style={{ transformStyle: "preserve-3d" }}
      {...props}
    >
      {children}
      {glareEffect && (
        <div
          ref={glareRef}
          className="pointer-events-none absolute inset-0 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-gradient-to-r from-primary/30 to-purple-400/20 blur-xl opacity-0 transition-opacity"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default GSAPTilt;
