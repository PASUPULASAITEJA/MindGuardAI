import React from "react";
import { cn } from "@/utils/cn";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: string | number;
    trend: "up" | "down" | "neutral";
    label?: string;
  };
  icon?: LucideIcon;
  badge?: {
    text: string;
    variant?: "default" | "success" | "warning" | "destructive" | "indigo";
  };
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  badge,
  className,
  onClick,
}) => {
  const getBadgeClass = (variant = "default") => {
    switch (variant) {
      case "success":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
      case "warning":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      case "destructive":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20";
      case "indigo":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      default:
        return "bg-secondary text-secondary-foreground border-border";
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-xs transition-colors",
        onClick && "cursor-pointer hover:border-border/80 hover:bg-secondary/20",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-foreground/80">
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
        </div>
        {badge && (
          <span
            className={cn(
              "rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              getBadgeClass(badge.variant)
            )}
          >
            {badge.text}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </span>
          {subtitle && (
            <span className="text-xs text-muted-foreground">
              {subtitle}
            </span>
          )}
        </div>

        {change && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-semibold",
              change.trend === "up"
                ? "text-emerald-600 dark:text-emerald-400"
                : change.trend === "down"
                ? "text-rose-600 dark:text-rose-400"
                : "text-muted-foreground"
            )}
          >
            <span>
              {change.trend === "up" ? "↑" : change.trend === "down" ? "↓" : "→"}{" "}
              {change.value}
            </span>
            {change.label && (
              <span className="text-[10px] font-normal text-muted-foreground">
                {change.label}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
