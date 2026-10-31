import React, { useRef } from "react";
import gsap from "gsap";
import { Button, ButtonProps } from "@/components/ui/button";

interface GsapButtonProps extends ButtonProps {
  magnetic?: boolean;
}

/**
 * GsapButton
 * Button with GSAP micro-interaction: smooth squish on mouse down, elastic rebound on release.
 * Reference: https://gsap.com/showcase/?tags=UI+Interactions
 */
export const GsapButton = React.forwardRef<HTMLButtonElement, GsapButtonProps>(
  ({ children, onMouseDown, onMouseUp, onClick, className, ...props }, ref) => {
    const internalRef = useRef<HTMLButtonElement | null>(null);

    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
      const el = internalRef.current;
      if (el) {
        gsap.to(el, {
          scale: 0.94,
          duration: 0.15,
          ease: "power2.out",
        });
      }
      onMouseDown?.(e);
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
      const el = internalRef.current;
      if (el) {
        gsap.to(el, {
          scale: 1,
          duration: 0.5,
          ease: "elastic.out(1.3, 0.3)",
        });
      }
      onMouseUp?.(e);
    };

    return (
      <Button
        ref={(node) => {
          internalRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          }
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={onClick}
        className={className}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

GsapButton.displayName = "GsapButton";

export default GsapButton;
