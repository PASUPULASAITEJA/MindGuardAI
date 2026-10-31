import React, { useRef, useEffect } from "react";
import gsap from "gsap";

interface GSAPTiltProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxTilt?: number; // max tilt degrees (e.g., 8)
  perspective?: number; // 3d perspective in px
  scaleOnHover?: number; // scale factor e.g., 1.02
  className?: string;
}

export const GSAPTilt: React.FC<GSAPTiltProps> = ({
  children,
  maxTilt = 7,
  perspective = 1000,
  scaleOnHover = 1.015,
  className = "",
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
      gsap.killTweensOf(card);
    };
  }, [maxTilt, perspective, scaleOnHover]);

  return (
    <div
      ref={cardRef}
      className={`relative will-change-transform ${className}`}
      style={{ transformStyle: "preserve-3d" }}
      {...props}
    >
      {children}
    </div>
  );
};

export default GSAPTilt;
