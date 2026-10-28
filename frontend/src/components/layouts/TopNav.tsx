import React, { useState } from "react";
import { Menu, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/layouts/ThemeToggle";
import { EmergencySOSModal } from "@/components/EmergencySOSModal";
import NotificationBell from "@/components/NotificationBell";

export interface TopNavProps {
  title: string;
  subtitle: string;
  onMenuClick?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ title, subtitle, onMenuClick }) => {
  const { user } = useAuth();
  const [isSOSOpen, setIsSOSOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 h-14 shrink-0 border-b border-border bg-card/95 backdrop-blur-md px-4 md:px-8 transition-colors shadow-sm">
        <div className="flex h-full items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground md:hidden"
                aria-label="Toggle navigation menu"
              >
                <Menu className="h-4 w-4" />
              </button>
            )}
            <div>
              <h2 className="leading-tight text-sm md:text-base font-semibold text-foreground">
                {title}
              </h2>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {user?.role === "STUDENT" && (
              <button
                onClick={() => setIsSOSOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-all shadow-sm shadow-rose-500/20 hover:shadow-rose-500/30"
                title="Immediate 24/7 Crisis Support"
              >
                <AlertTriangle className="w-3 h-3 pulse-soft" />
                <span>Crisis</span>
              </button>
            )}

            {/* User Avatar + First Name before NotificationBell */}
            <div className="hidden sm:flex items-center gap-2 border-r border-border pr-3 mr-1">
              <div className="w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                {user?.full_name?.slice(0, 2).toUpperCase() || "?"}
              </div>
              <span className="text-xs font-semibold text-foreground max-w-[90px] truncate">
                {user?.full_name?.split(" ")[0] || "User"}
              </span>
            </div>

            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <EmergencySOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
    </>
  );
};

export default TopNav;
