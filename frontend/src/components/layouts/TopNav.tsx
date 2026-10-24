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

  // Extract initials and first name
  const getInitials = (name?: string) => {
    if (!name) return "MG";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getFirstName = (name?: string) => {
    if (!name) return "User";
    return name.trim().split(/\s+/)[0];
  };

  const initials = getInitials(user?.full_name);
  const firstName = getFirstName(user?.full_name);

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
              <h2 className="leading-tight text-sm md:text-base font-semibold text-foreground">{title}</h2>
              <p className="text-[11px] text-muted-foreground hidden sm:block">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {user?.role === "STUDENT" && (
              <button
                onClick={() => setIsSOSOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 text-white hover:bg-rose-600 px-3 py-1.5 text-xs font-bold transition-all shadow-sm"
                title="Immediate 24/7 Crisis Support"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-white pulse-soft" />
                <span>Crisis Support</span>
              </button>
            )}

            <NotificationBell />
            <ThemeToggle />

            {/* Desktop User Avatar Circle + First Name */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs select-none">
                {initials}
              </div>
              <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                {firstName}
              </span>
            </div>
          </div>
        </div>
      </header>

      <EmergencySOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
    </>
  );
};

export default TopNav;
