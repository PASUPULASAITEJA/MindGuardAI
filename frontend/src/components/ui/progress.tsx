import React from "react";
import { cn } from "@/utils/cn";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
  showValue?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className,
  indicatorClassName,
  showValue = false,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full">
      <div
        className={cn(
          "relative h-2.5 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
      >
        <div
          className={cn(
            "h-full rounded-full bg-primary transition-all duration-300",
            indicatorClassName
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <div className="mt-1 flex justify-between text-[11px] font-medium text-muted-foreground">
          <span>{Math.round(percentage)}% completed</span>
          <span>{value} / {max}</span>
        </div>
      )}
    </div>
  );
};
