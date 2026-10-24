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
  Sparkles,
  PhoneCall,
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

interface SidebarProps {
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

  const initials = getUserInitials(user?.full_name);

  return (
    <aside
      className={cn(
        "h-screen flex flex-col justify-between bg-card border-r border-border transition-all duration-200 select-none z-30",
        isCollapsed ? "w-14" : "w-56",
        className
      )}
    >
      {/* Top Header / Logo */}
      <div>
        <div className={cn("h-16 flex items-center border-b border-border px-3", isCollapsed ? "justify-center" : "justify-between")}>
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
        <div className="py-4 px-2 space-y-5 overflow-y-auto max-h-[calc(100vh-14rem)]">
          {sections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {sec.title}
                </div>
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
                      cn(
                        "flex items-center gap-2.5 py-2 rounded-md text-xs font-medium transition-all duration-150",
                        isCollapsed ? "justify-center px-0" : "px-2.5",
                        isActive
                          ? "border-l-2 border-primary bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                      )
                    }
                  >
                    <IconComponent className={cn("w-4 h-4 shrink-0")} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Area: User Footer & Collapse Toggle */}
      <div className="border-t border-border p-2 space-y-2">
        {/* User profile info */}
        <div
          className={cn(
            "flex items-center gap-2.5 p-1.5 rounded-lg bg-secondary/40 border border-border/60",
            isCollapsed ? "justify-center" : "justify-between"
          )}
          title={isCollapsed ? `${user?.full_name || "User"} (${role})` : undefined}
        >
          <div className="flex items-center gap-2 min-w-0">
            {/* Avatar circle (first 2 letters of name, bg-primary/20 text-primary) */}
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              {initials}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-foreground truncate leading-tight">
                  {user?.full_name || "Active User"}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {role}
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={() => logout()}
              className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Collapsible Toggle button at bottom of sidebar: ChevronLeft/ChevronRight */}
        <button
          onClick={handleToggle}
          className={cn(
            "w-full flex items-center justify-center py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-xs font-medium"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-1.5">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[11px]">Collapse</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
