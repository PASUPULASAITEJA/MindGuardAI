import React from "react";
import { cn } from "@/utils/cn";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { LottieIllustration, IllustrationVariant } from "./LottieIllustration";

interface EmptyStateProps {
  icon?: LucideIcon;
  illustration?: IllustrationVariant;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  illustration,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/60 p-8 text-center backdrop-blur-xs",
        className
      )}
    >
      {illustration ? (
        <div className="mb-4 h-24 w-24">
          <LottieIllustration variant={illustration} />
        </div>
      ) : Icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
      ) : null}
      <h3 className="text-base font-bold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          variant="outline"
          size="sm"
          className="mt-4 text-xs font-semibold"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
