import React from "react";

interface DotGridBackgroundProps {
  className?: string;
}

export const DotGridBackground: React.FC<DotGridBackgroundProps> = ({ className = "" }) => {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] opacity-[0.04] dark:opacity-[0.07] ${className}`}
      style={{
        backgroundImage: `radial-gradient(currentColor 1.25px, transparent 1.25px)`,
        backgroundSize: "24px 24px",
      }}
    />
  );
};

export default DotGridBackground;
