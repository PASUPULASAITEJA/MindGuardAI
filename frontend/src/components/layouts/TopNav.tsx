import React, { useState } from "react";
import { LogOut, Menu, AlertTriangle, ShieldCheck, Activity, User as UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/layouts/ThemeToggle";
import { EmergencySOSModal } from "@/components/EmergencySOSModal";
import NotificationBell from "@/components/NotificationBell";

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
      <header className="sticky top-0 z-20 h-16 shrink-0 border-b border-border/70 bg-card/80 dark:bg-card/75 backdrop-blur-2xl px-4 md:px-8 transition-all">
        <div className="flex h-full items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="p-2 rounded-xl border border-border/70 bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200 md:hidden shadow-xs"
                aria-label="Toggle navigation menu"
              >
                <Menu className="h-4 w-4" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="leading-tight text-sm md:text-base font-bold text-foreground tracking-tight">{title}</h2>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Activity Tracking Active
                </span>
              </div>
              <p className="mt-0.5 hidden text-[11px] text-muted-foreground sm:block font-normal">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {user?.role === "STUDENT" && (
              <button
                onClick={() => setIsSOSOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-500/15 to-red-500/10 px-3 py-1.5 text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm shadow-rose-500/10 active:scale-95"
                title="Immediate 24/7 Crisis Help & Counselor Dispatch"
              >
                <AlertTriangle className="h-3.5 w-3.5 animate-pulse text-rose-500" />
                <span>SOS Help</span>
              </button>
            )}

            <NotificationBell />
            <ThemeToggle />



            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/60 px-2.5 py-1.5 text-xs font-bold text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 md:hidden"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      <EmergencySOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
    </>
  );
};

export default TopNav;


