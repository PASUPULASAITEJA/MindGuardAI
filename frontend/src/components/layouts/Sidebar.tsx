import React from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  User,
  Users,
  X,
  Settings,
  MessageSquare,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { cn } from "@/utils/cn";

type SidebarItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
};

const roleNavigation: Record<UserRole, SidebarItem[]> = {
  STUDENT: [
    { label: "Daily Sanctuary", to: "/student/dashboard", icon: LayoutDashboard },
    { label: "AI Wellness Chat", to: "/student/chat", icon: MessageSquare },
    { label: "Daily Check-In", to: "/student/check-in", icon: ClipboardCheck },
    { label: "Mood History", to: "/student/history", icon: Activity },
    { label: "Self-Care Resources", to: "/student/resources", icon: BookOpen },
    { label: "Settings", to: "/settings", icon: Settings },
  ],
  COUNSELOR: [
    { label: "Triage Command", to: "/counselor/dashboard", icon: LayoutDashboard },
    { label: "Active Alerts", to: "/counselor/alerts", icon: AlertCircle },
    { label: "Student Records", to: "/counselor/students", icon: Users },
    { label: "Settings", to: "/settings", icon: Settings },
  ],
  ADMIN: [
    { label: "Executive Overview", to: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Wellness Reports", to: "/admin/reports", icon: BarChart3 },
    { label: "User Directory", to: "/admin/directory", icon: Users },
    { label: "Settings", to: "/settings", icon: Settings },
  ],
};

interface SidebarProps {
  className?: string;
  onCloseMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ className, onCloseMobile }) => {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <aside
      className={cn(
        "flex flex-col justify-between border-r border-border/60 bg-card/90 dark:bg-card/85 backdrop-blur-xl p-5 h-full transition-all",
        className
      )}
    >
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-primary to-emerald-500 p-0.5 shadow-sm shadow-primary/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-[14px] bg-card overflow-hidden flex items-center justify-center">
                <img src="/favicon.jpg" alt="MindGuardAI Logo" className="h-full w-full object-cover" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-foreground">
                  MindGuard<span className="text-primary">AI</span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[10px] text-muted-foreground tracking-wider uppercase font-semibold">Campus Wellness</p>
            </div>
          </div>
          
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg border border-border/50 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors md:hidden"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-extrabold tracking-wider text-muted-foreground uppercase block mb-2">
            Navigation
          </span>
          <nav className="space-y-1">
            {roleNavigation[user.role].map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all duration-200",
                      isActive
                        ? "border-primary/25 bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-105", isActive && "text-primary")} />
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Section */}
      <div className="space-y-3 border-t border-border/50 pt-4">
        {user.role === "STUDENT" && (
          <a
            href="tel:14416"
            className="flex items-center justify-between p-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs transition-colors group shadow-xs"
            title="Tele-MANAS Toll-Free 24/7 National Mental Health Helpline"
          >
            <div className="flex items-center gap-2">
              <PhoneCall className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
              <div>
                <span className="font-bold text-[11px] block text-foreground">Crisis Helpline</span>
                <span className="text-[10px] text-muted-foreground font-mono">Dial 14416 (24/7)</span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold text-rose-500 group-hover:underline">Call Free</span>
          </a>
        )}

        {/* User Card */}
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/50 p-3 shadow-xs">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase shrink-0">
            {user.full_name ? user.full_name.charAt(0) : user.email.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-foreground">
              {user.full_name || user.email.split("@")[0]}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
          </div>
          <span className={cn(
            "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border shrink-0",
            user.role === "STUDENT" ? "bg-primary/10 text-primary border-primary/20" :
            user.role === "COUNSELOR" ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" :
            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          )}>
            {user.role}
          </span>
        </div>

        <button
          onClick={() => logout()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/50 bg-background/40 px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 active:scale-[0.99]"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

