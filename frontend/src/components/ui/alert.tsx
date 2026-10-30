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
          container: "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-950 dark:text-emerald-200",
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
          titleClass: "text-emerald-900 dark:text-emerald-100",
          bodyClass: "text-emerald-800/90 dark:text-emerald-300/90",
        };
      case "warning":
        return {
          container: "border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-950 dark:text-amber-200",
          icon: <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />,
          titleClass: "text-amber-900 dark:text-amber-100",
          bodyClass: "text-amber-800/90 dark:text-amber-300/90",
        };
      case "destructive":
        return {
          container: "border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-950 dark:text-rose-200",
          icon: <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />,
          titleClass: "text-rose-900 dark:text-rose-100",
          bodyClass: "text-rose-800/90 dark:text-rose-300/90",
        };
      case "info":
      default:
        return {
          container: "border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 text-sky-950 dark:text-sky-200",
          icon: <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />,
          titleClass: "text-sky-900 dark:text-sky-100",
          bodyClass: "text-sky-800/90 dark:text-sky-300/90",
        };
    }
  };

  const { container, icon, titleClass, bodyClass } = getVariantStyles();

  return (
    <div
      role="alert"
      className={cn(
        "relative flex items-start gap-3 rounded-2xl border p-4 text-xs leading-relaxed shadow-xs",
        container,
        className
      )}
    >
      {icon}
      <div className="flex-1">
        {title && <h5 className={cn("font-bold tracking-tight mb-1", titleClass)}>{title}</h5>}
        <div className={cn("font-medium", bodyClass)}>{children}</div>
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
