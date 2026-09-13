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
    { label: "Overview", to: "/student/dashboard", icon: LayoutDashboard },
    { label: "AI Wellness Chat", to: "/student/chat", icon: MessageSquare },
    { label: "Check-In", to: "/student/check-in", icon: ClipboardCheck },
    { label: "Mood History", to: "/student/history", icon: Activity },
    { label: "Resources", to: "/student/resources", icon: BookOpen },
    { label: "Settings", to: "/settings", icon: Settings },
  ],
  COUNSELOR: [
    { label: "Overview", to: "/counselor/dashboard", icon: LayoutDashboard },
    { label: "Active Alerts", to: "/counselor/alerts", icon: AlertCircle },
    { label: "Student Records", to: "/counselor/students", icon: Users },
    { label: "Settings", to: "/settings", icon: Settings },
  ],
  ADMIN: [
    { label: "Overview", to: "/admin/dashboard", icon: LayoutDashboard },
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
        "flex flex-col justify-between border-r border-border bg-card/95 dark:bg-card/90 backdrop-blur-xl p-5 h-full",
        className
      )}
    >
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-500 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-card overflow-hidden flex items-center justify-center">
                <img src="/favicon.jpg" alt="MindGuardAI Logo" className="h-full w-full object-cover" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 dark:from-indigo-400 dark:via-purple-300 dark:to-emerald-400 bg-clip-text text-transparent">
                  MindGuardAI
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[10px] text-muted-foreground tracking-wider uppercase font-bold">Campus Wellness</p>
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

        <nav className="space-y-1.5">
          {roleNavigation[user.role].map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  cn(
                    "group relative flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-all duration-300",
                    "hover:bg-accent/70 hover:text-accent-foreground",
                    isActive
                      ? "border-primary/30 bg-primary/10 text-primary shadow-sm shadow-primary/5 font-bold"
                      : "border-transparent text-muted-foreground hover:border-border/50"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", isActive && "text-primary")} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3 border-t border-border/50 pt-5">
        {user.role === "STUDENT" && (
          <a
            href="tel:14416"
            className="flex items-center justify-between p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs transition-colors group"
            title="Tele-MANAS Toll-Free 24/7 National Mental Health Helpline"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span className="font-bold text-[11px]">24/7 Crisis: 14416</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-rose-500 group-hover:underline">Call Free</span>
          </a>
        )}

        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/50 p-3 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-primary/20 text-primary font-bold text-xs uppercase shrink-0">
            {user.email.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-foreground">
              {user.email.split("@")[0]}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
          </div>
          <span className={cn(
            "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border shrink-0",
            user.role === "STUDENT" ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" :
            user.role === "COUNSELOR" ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" :
            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          )}>
            {user.role}
          </span>
        </div>

        <button
          onClick={() => logout()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/40 bg-background/30 px-4 py-2 text-xs font-bold text-muted-foreground transition-all duration-300 hover:border-border hover:bg-accent hover:text-accent-foreground active:scale-[0.99]"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
