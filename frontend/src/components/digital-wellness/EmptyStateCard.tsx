import React from "react";
import { Monitor, ArrowRight, ShieldCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateCardProps {
  title?: string;
  description?: string;
  onOpenDevices?: () => void;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  title = "No activity data available yet. Start monitoring to see your digital wellness analytics.",
  description = "Connect your laptop, desktop, or browser extension to begin capturing real-time active study sessions, application usage, and circadian balance.",
  onOpenDevices,
}) => {
  return (
    <Card className="border-dashed border-2 border-border/80 bg-card/40 dark:bg-card/20 backdrop-blur-sm rounded-2xl p-8 text-center">
      <CardContent className="flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto p-0">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 flex items-center justify-center ring-8 ring-blue-500/5">
          <Monitor className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {onOpenDevices && (
            <Button
              onClick={onOpenDevices}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              Connect a Device
            </Button>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border/50">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Zero keystrokes or screenshots logged</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyStateCard;
