import React, { useState } from "react";
import { LogOut, Menu, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/layouts/ThemeToggle";
import { EmergencySOSModal } from "@/components/EmergencySOSModal";

interface TopNavProps {
  title: string;
  subtitle: string;
  onMenuClick?: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ title, subtitle, onMenuClick }) => {
  const { user, logout } = useAuth();
  const [isSOSOpen, setIsSOSOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 h-16 shrink-0 border-b border-border/50 bg-card/40 px-6 md:px-8 backdrop-blur-md">
        <div className="flex h-full items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="p-2 rounded-xl border border-border/50 bg-background/50 hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-300 md:hidden"
                aria-label="Toggle navigation menu"
              >
                <Menu className="h-4 w-4" />
              </button>
            )}
            <div>
              <h2 className="leading-tight text-sm md:text-base font-extrabold text-foreground">{title}</h2>
              <p className="mt-0.5 hidden text-[11px] text-muted-foreground sm:block">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {user?.role === "STUDENT" && (
              <button
                onClick={() => setIsSOSOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm shadow-rose-500/10 active:scale-95"
                title="Immediate 24/7 Crisis Help & Counselor Dispatch"
              >
                <AlertTriangle className="h-3.5 w-3.5 animate-pulse text-rose-500" />
                <span>SOS Help</span>
              </button>
            )}
            <ThemeToggle />
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-xs font-bold text-muted-foreground transition-all duration-300 hover:bg-accent hover:text-accent-foreground md:hidden"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <EmergencySOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
    </>
  );
};

export default TopNav;

