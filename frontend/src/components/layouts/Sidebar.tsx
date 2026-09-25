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
  Users,
  X,
  Settings,
  MessageSquare,
  ShieldCheck,
  PhoneCall,
  Calendar,
  Layers
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
    { label: "Dashboard", to: "/student/dashboard", icon: LayoutDashboard },
    { label: "My Wellbeing", to: "/student/history", icon: Activity },
    { label: "Daily Check-in", to: "/student/check-in", icon: ClipboardCheck },
    { label: "AI Assistant", to: "/student/chat", icon: MessageSquare },
    { label: "Resources", to: "/student/resources", icon: BookOpen },
    { label: "Privacy & Consent", to: "/student/privacy", icon: ShieldCheck },
    { label: "Settings", to: "/settings", icon: Settings },
  ],
  COUNSELOR: [
    { label: "Overview", to: "/counselor/dashboard", icon: LayoutDashboard },
    { label: "Support Queue", to: "/counselor/alerts", icon: AlertCircle },
    { label: "Student Cases", to: "/counselor/students", icon: Users },
    { label: "Settings", to: "/settings", icon: Settings },
  ],
  ADMIN: [
    { label: "University Overview", to: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Campus Reports", to: "/admin/reports", icon: BarChart3 },
    { label: "User Directory", to: "/admin/directory", icon: Users },
    { label: "Audit Logs", to: "/admin/audit-logs", icon: ShieldCheck },
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
        "flex flex-col justify-between border-r border-border bg-card p-4 h-full transition-colors w-64 select-none",
        className
      )}
    >
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="MindGuardAI Logo"
              className="h-9 w-9 rounded-lg object-contain bg-white dark:bg-card border border-border p-0.5 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-foreground">
                  MindGuard<span className="text-primary">AI</span>
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">Wellbeing Platform</p>
            </div>
          </div>
          
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground md:hidden"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation links */}
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
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-primary font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer User Profile & Tele-MANAS */}
      <div className="space-y-3 pt-4 border-t border-border">
        {user.role === "STUDENT" && (
          <a
            href="tel:14416"
            className="flex items-center justify-between p-2 rounded-lg border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs transition-colors"
            title="Tele-MANAS 24/7 National Mental Health Helpline"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span className="font-semibold text-[11px]">24/7 Crisis: 14416</span>
            </div>
            <span className="text-[10px] uppercase font-semibold text-rose-500">Call</span>
          </a>
        )}

        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-secondary/40 p-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-foreground font-semibold text-xs uppercase shrink-0">
            {user.full_name ? user.full_name.charAt(0) : user.email.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">
              {user.full_name || user.email.split("@")[0]}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">{user.role}</p>
          </div>
          <button
            onClick={() => logout()}
            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
