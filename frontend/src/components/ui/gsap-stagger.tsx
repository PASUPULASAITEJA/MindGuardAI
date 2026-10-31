import React, { useRef, useEffect } from "react";
import gsap from "gsap";

interface GSAPStaggerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  stagger?: number; // delay between each child in seconds (e.g. 0.08)
  duration?: number;
  yOffset?: number;
  selector?: string; // target child selector, default is direct children
  className?: string;
  delay?: number;
}

export const GSAPStagger: React.FC<GSAPStaggerProps> = ({
  children,
  stagger = 0.08,
  duration = 0.6,
  yOffset = 20,
  selector,
  className = "",
  delay = 0,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use container.children by default, or querySelectorAll with safe fallback
    let items: Element[] = [];
    if (!selector || selector === "> *") {
      items = Array.from(container.children);
    } else {
      try {
        items = Array.from(container.querySelectorAll(selector));
      } catch {
        items = Array.from(container.children);
      }
    }

    if (items.length === 0) return;

    gsap.fromTo(
      items,
      { opacity: 0, y: yOffset },
      {
        opacity: 1,
        y: 0,
        stagger,
        duration,
        delay,
        ease: "power2.out",
        clearProps: "all",
      }
    );

    return () => {
      gsap.killTweensOf(items);
    };
  }, [stagger, duration, yOffset, delay, selector]);

  return (
    <div ref={containerRef} className={className} {...props}>
      {children}
    </div>
  );
};

export default GSAPStagger;
