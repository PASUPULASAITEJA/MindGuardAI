import React from "react";
import { cn } from "@/utils/cn";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

interface AlertProps {
  variant?: "default" | "info" | "success" | "warning" | "destructive";
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = "info",
  title,
  children,
  onClose,
  className,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          container: "border-emerald-500/20 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300",
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
        };
      case "warning":
        return {
          container: "border-amber-500/20 bg-amber-500/10 text-amber-900 dark:text-amber-300",
          icon: <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />,
        };
      case "destructive":
        return {
          container: "border-rose-500/20 bg-rose-500/10 text-rose-900 dark:text-rose-300",
          icon: <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />,
        };
      case "info":
      default:
        return {
          container: "border-primary/20 bg-primary/10 text-primary-foreground dark:text-primary",
          icon: <Info className="h-4 w-4 text-primary shrink-0" />,
        };
    }
  };

  const { container, icon } = getVariantStyles();

  return (
    <div
      role="alert"
      className={cn(
        "relative flex items-start gap-3 rounded-xl border p-4 text-xs leading-relaxed",
        container,
        className
      )}
    >
      {icon}
      <div className="flex-1">
        {title && <h5 className="font-bold tracking-tight mb-0.5">{title}</h5>}
        <div className="text-muted-foreground/90 font-medium">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
