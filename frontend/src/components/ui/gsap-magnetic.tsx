import React, { useRef, useEffect } from "react";
import gsap from "gsap";

interface GSAPMagneticProps {
  children: React.ReactElement;
  strength?: number; // 0.1 to 1 (how strongly it pulls)
  radius?: number; // active distance radius in pixels
  className?: string;
  disabled?: boolean;
}

export const GSAPMagnetic: React.FC<GSAPMagneticProps> = ({
  children,
  strength = 0.35,
  className = "",
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (disabled || !element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const bounds = element.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;

      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;

      gsap.to(element, {
        x: distanceX * strength,
        y: distanceY * strength,
        rotation: distanceX * 0.05 * strength,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const handleMouseLeave = () => {
      gsap.to(element, {
        x: 0,
        y: 0,
        rotation: 0,
        duration: 0.7,
        ease: "elastic.out(1.1, 0.4)",
        overwrite: "auto",
      });
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
      gsap.killTweensOf(element);
    };
  }, [strength, disabled]);

  return (
    <div
      ref={containerRef}
      className={`inline-block will-change-transform ${className}`}
    >
      {children}
    </div>
  );
};

export default GSAPMagnetic;
