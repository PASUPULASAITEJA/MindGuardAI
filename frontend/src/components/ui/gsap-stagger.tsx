import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface GSAPStaggerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  stagger?: number; // delay between each child in seconds (e.g. 0.08)
  duration?: number;
  yOffset?: number;
  selector?: string; // target child selector, default is direct children "> *"
  className?: string;
  delay?: number;
}

export const GSAPStagger: React.FC<GSAPStaggerProps> = ({
  children,
  stagger = 0.08,
  duration = 0.6,
  yOffset = 20,
  selector = "> *",
  className = "",
  delay = 0,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const items = container.querySelectorAll(selector);
      if (!items || items.length === 0) return;

      gsap.from(items, {
        opacity: 0,
        y: yOffset,
        stagger,
        duration,
        delay,
        ease: "power2.out",
        clearProps: "all",
      });
    },
    { scope: containerRef, dependencies: [stagger, duration, yOffset, delay, selector] }
  );

  return (
    <div ref={containerRef} className={className} {...props}>
      {children}
    </div>
  );
};

export default GSAPStagger;
