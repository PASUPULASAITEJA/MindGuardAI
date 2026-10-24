import React from "react";

export interface BreathingBlobProps {
  size?: number;
  className?: string;
  variant?: "primary" | "calm" | "alert";
  children?: React.ReactNode;
}

export function BreathingBlob({
  size = 200,
  className = "",
  variant = "primary",
  children,
}: BreathingBlobProps) {
  const variantStyles = {
    primary: "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-primary/10",
    calm: "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 shadow-emerald-500/10",
    alert: "bg-gradient-to-br from-rose-500/20 to-rose-500/5 border border-rose-500/20 shadow-rose-500/10",
  };

  const glowStyles = {
    primary: "bg-primary/15 blur-xl",
    calm: "bg-emerald-500/15 blur-xl",
    alert: "bg-rose-500/15 blur-xl",
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center pointer-events-none select-none transition-transform duration-700 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Outer glow aura layer */}
      <div
        className={`absolute inset-0 rounded-full breathing-blob-glow ${glowStyles[variant]}`}
      />

      {/* Main breathing morphing blob */}
      <div
        className={`breathing-blob relative w-full h-full shadow-lg ${variantStyles[variant]} flex items-center justify-center`}
      >
        {/* Inner subtle glow ring */}
        <div className="breathing-blob-glow absolute inset-2 rounded-full opacity-60 bg-white/5 dark:bg-white/10" />

        {/* Optional content inside blob */}
        {children && (
          <div className="relative z-10 pointer-events-auto flex flex-col items-center justify-center">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export default BreathingBlob;
