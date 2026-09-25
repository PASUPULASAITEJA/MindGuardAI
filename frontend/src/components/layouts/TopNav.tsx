import React, { useState } from "react";
import { Menu, AlertTriangle } from "lucide-react";
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
  const { user } = useAuth();
  const [isSOSOpen, setIsSOSOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 h-14 shrink-0 border-b border-border bg-card/95 backdrop-blur-md px-4 md:px-8 transition-colors">
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
              <h2 className="leading-tight text-sm md:text-base font-semibold text-foreground">{title}</h2>
              <p className="text-[11px] text-muted-foreground hidden sm:block">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user?.role === "STUDENT" && (
              <button
                onClick={() => setIsSOSOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                title="Immediate 24/7 Crisis Support"
              >
                <AlertTriangle className="h-3 w-3 text-rose-500" />
                <span>Crisis Support</span>
              </button>
            )}

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
