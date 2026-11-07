import React from "react";
import { Sparkles } from "lucide-react";

export const PageLoader: React.FC = () => {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center p-6 space-y-4">
      <div className="relative flex items-center justify-center">
        {/* Pulsing violet glow */}
        <div className="absolute w-16 h-16 rounded-full bg-violet-600/20 blur-xl animate-pulse" />
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-teal-400 p-0.5 shadow-lg shadow-violet-500/20 animate-spin" style={{ animationDuration: "3s" }}>
          <div className="w-full h-full bg-background rounded-[14px] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-violet-500 animate-pulse" />
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground animate-pulse">
          Loading MindBridge AI
        </p>
      </div>
    </div>
  );
};

export default PageLoader;
