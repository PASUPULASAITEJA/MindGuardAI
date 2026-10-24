import React from "react";

export interface GlowOrbProps {
  size?: number;
  variant?: "primary" | "purple" | "emerald";
  className?: string;
}

export function GlowOrb({
  size = 400,
  variant = "primary",
  className = "",
}: GlowOrbProps) {
  const variantClass =
    variant === "purple"
      ? "glow-orb-purple"
      : variant === "emerald"
      ? "glow-orb-emerald"
      : "glow-orb-primary";

  return (
    <div
      className={`glow-orb ${variantClass} ${className}`}
      style={{
        width: size,
        height: size,
      }}
      aria-hidden="true"
    />
  );
}

export default GlowOrb;
