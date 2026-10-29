import React, { useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  Brain,
  Monitor,
} from "lucide-react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { cn } from "@/utils/cn";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const getRoleNavSections = (role: UserRole): NavSection[] => {
  if (role === "STUDENT") {
    return [
      {
        title: "OVERVIEW",
        items: [
          { label: "Dashboard", to: "/student/dashboard", icon: LayoutDashboard },
          { label: "Screen Time & Apps", to: "/student/screentime", icon: Monitor },
          { label: "My Wellbeing", to: "/student/history", icon: Activity },
          { label: "Daily Check-in", to: "/student/check-in", icon: ClipboardCheck },
        ],
      },
      {
        title: "SUPPORT",
        items: [
          { label: "AI Assistant", to: "/student/chat", icon: MessageSquare },
          { label: "Resources", to: "/student/resources", icon: BookOpen },
        ],
      },
      {
        title: "ACCOUNT",
        items: [
          { label: "Privacy & Consent", to: "/student/privacy", icon: ShieldCheck },
          { label: "Settings", to: "/settings", icon: Settings },
        ],
      },
    ];
  }

  if (role === "COUNSELOR") {
    return [
      {
        title: "CLINICAL",
        items: [
          { label: "Overview", to: "/counselor/dashboard", icon: LayoutDashboard },
          { label: "Support Queue", to: "/counselor/alerts", icon: AlertCircle },
          { label: "Student Cases", to: "/counselor/students", icon: Users },
        ],
      },
      {
        title: "ACCOUNT",
        items: [
          { label: "Settings", to: "/settings", icon: Settings },
        ],
      },
    ];
  }

  // ADMIN
  return [
    {
      title: "ANALYTICS",
      items: [
        { label: "University Overview", to: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Campus Reports", to: "/admin/reports", icon: BarChart3 },
        { label: "User Directory", to: "/admin/directory", icon: Users },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        { label: "Audit Logs", to: "/admin/audit-logs", icon: ShieldCheck },
        { label: "Settings", to: "/settings", icon: Settings },
      ],
    },
  ];
};

export interface SidebarProps {
  className?: string;
  onClose?: () => void;
  onCloseMobile?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  className,
  onClose,
  onCloseMobile,
  collapsed: controlledCollapsed,
  onToggleCollapse,
}) => {
  const handleClose = onClose || onCloseMobile;

  const { user, logout } = useAuth();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  const role = user?.role || "STUDENT";
  const sections = getRoleNavSections(role);

  // Get user initials (first 2 letters)
  const getUserInitials = (name?: string) => {
    if (!name) return "MG";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full border-r border-border bg-card transition-all duration-200 select-none z-30",
        isCollapsed ? "w-14" : "w-56",
        className
      )}
    >
      {/* Top Header / Logo */}
      <div>
        <div
          className={cn(
            "h-16 flex items-center border-b border-border px-3",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0 shadow-xs">
              <Brain className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm tracking-tight text-foreground truncate">
                  MindGuard<span className="text-primary">AI</span>
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate -mt-0.5">
                  Campus Care
                </span>
              </div>
            )}
          </div>
          {handleClose && (
            <button
              onClick={handleClose}
              className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="py-2 px-2 space-y-1 overflow-y-auto max-h-[calc(100vh-14rem)]">
          {sections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 pt-5 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {sec.title}
                </p>
              )}
              {sec.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={handleClose}
                    title={isCollapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      isActive
                        ? cn(
                            "flex items-center rounded-lg text-xs font-semibold transition-all bg-primary/10 text-primary border-l-2 border-primary",
                            isCollapsed
                              ? "justify-center p-2"
                              : "gap-2.5 px-3 py-2 ml-0 pl-[10px]"
                          )
                        : cn(
                            "flex items-center rounded-lg text-xs font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary/80",
                            isCollapsed ? "justify-center p-2" : "gap-2.5 px-3 py-2"
                          )
                    }
                  >
                    <IconComponent className="w-4 h-4 shrink-0" />
                    {isCollapsed ? (
                      <span className="sr-only">{item.label}</span>
                    ) : (
                      <span className="truncate">{item.label}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Area: User Footer & Collapse Toggle */}
      <div className="border-t border-border p-2 space-y-1 mt-auto">
        {/* User profile info */}
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2.5 px-3 py-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                {getUserInitials(user?.full_name)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate max-w-[110px]">
                  {user?.full_name || "User"}
                </p>
                <p className="text-[10px] text-muted-foreground capitalize">
                  {user?.role?.toLowerCase() || "student"}
                </p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div
            className="flex items-center justify-center py-2"
            title={`${user?.full_name || "User"} (${user?.role || "STUDENT"})`}
          >
            <div className="w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
              {getUserInitials(user?.full_name)}
            </div>
          </div>
        )}

        {/* Collapse toggle button at very bottom */}
        <button
          onClick={handleToggle}
          className="w-full flex items-center justify-center p-2 mt-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors text-xs gap-1.5 font-medium"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <>
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
