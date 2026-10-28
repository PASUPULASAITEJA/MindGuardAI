import React from "react";
import { Moon, Sun, Sparkles } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/utils/cn";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, showLabel = false }) => {
  const { theme, toggleTheme, isNight } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "group relative inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-border/70 bg-card/80 backdrop-blur-md shadow-xs transition-all duration-300 hover:border-primary/40 hover:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/20",
        className
      )}
      title={isNight ? "Switch to Day Mood (Light Mode)" : "Switch to Night Mood (Dark Mode)"}
      aria-label={isNight ? "Switch to Day Mood" : "Switch to Night Mood"}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isNight ? (
          <Moon className="w-4 h-4 text-indigo-400 transition-transform duration-300 group-hover:rotate-12" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 transition-transform duration-300 group-hover:rotate-45" />
        )}
      </div>

      {showLabel ? (
        <span className="text-xs font-semibold text-foreground select-none">
          {isNight ? "Night Mood" : "Day Mood"}
        </span>
      ) : (
        <span className="hidden sm:inline-block text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors select-none">
          {isNight ? "Night" : "Day"}
        </span>
      )}

      {/* Tiny active pulse indicator */}
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0",
          isNight ? "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
        )}
      />
    </button>
  );
};

export default ThemeToggle;


