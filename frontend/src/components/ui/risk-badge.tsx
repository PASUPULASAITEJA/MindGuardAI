import React from "react";
import { cn } from "@/utils/cn";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "MODERATE" | "ELEVATED" | "CRITICAL" | string;

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
  showDot?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, className, showDot = true }) => {
  const normalized = (level || "LOW").toUpperCase();

  let badgeClasses = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
  let dotColor = "bg-emerald-500";
  let displayLabel = "LOW";

  if (normalized === "HIGH" || normalized === "CRITICAL" || normalized === "ELEVATED") {
    badgeClasses = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    dotColor = "bg-rose-500";
    displayLabel = normalized === "CRITICAL" ? "CRITICAL" : "HIGH";
  } else if (normalized === "MEDIUM" || normalized === "MODERATE") {
    badgeClasses = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    dotColor = "bg-amber-500";
    displayLabel = normalized === "MODERATE" ? "MODERATE" : "MEDIUM";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border",
        badgeClasses,
        className
      )}
    >
      {showDot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />}
      <span>{displayLabel}</span>
    </span>
  );
};

export default RiskBadge;
