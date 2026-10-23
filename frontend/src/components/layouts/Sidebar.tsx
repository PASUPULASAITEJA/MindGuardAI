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
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { cn } from "@/utils/cn";
import { motion } from "motion/react";

interface NavSection {
  title: string;
  items: {
    label: string;
    to: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const getRoleNavSections = (role: UserRole): NavSection[] => {
  if (role === "STUDENT") {
    return [
      {
        title: "Main",
        items: [
          { label: "Dashboard", to: "/student/dashboard", icon: LayoutDashboard },
        ],
      },
      {
        title: "Wellness",
        items: [
          { label: "My Wellbeing", to: "/student/history", icon: Activity },
          { label: "Daily Check-in", to: "/student/check-in", icon: ClipboardCheck },
          { label: "AI Companion", to: "/student/chat", icon: MessageSquare },
          { label: "Self-Care Tools", to: "/student/resources", icon: BookOpen },
        ],
      },
      {
        title: "Settings & Privacy",
        items: [
          { label: "Privacy & Consent", to: "/student/privacy", icon: ShieldCheck },
          { label: "Account Settings", to: "/settings", icon: Settings },
        ],
      },
    ];
  }

  if (role === "COUNSELOR") {
    return [
      {
        title: "Main",
        items: [
          { label: "Clinical Overview", to: "/counselor/dashboard", icon: LayoutDashboard },
        ],
      },
      {
        title: "Clinical Casework",
        items: [
          { label: "Triage Alerts", to: "/counselor/alerts", icon: AlertCircle },
          { label: "Student Case Files", to: "/counselor/students", icon: Users },
        ],
      },
      {
        title: "Settings",
        items: [
          { label: "Settings", to: "/settings", icon: Settings },
        ],
      },
    ];
  }

  // ADMIN
  return [
    {
      title: "Main",
      items: [
        { label: "University Overview", to: "/admin/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "Campus Analytics",
      items: [
        { label: "Aggregate Reports", to: "/admin/reports", icon: BarChart3 },
        { label: "User Directory", to: "/admin/directory", icon: Users },
        { label: "Compliance & Audit", to: "/admin/audit-logs", icon: ShieldCheck },
      ],
    },
    {
      title: "Settings",
      items: [
        { label: "Settings", to: "/settings", icon: Settings },
      ],
    },
  ];
};

interface SidebarProps {
  className?: string;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const sections = getRoleNavSections(user.role);

  return (
    <aside
      className={cn(
        "flex flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 select-none z-30",
        collapsed ? "w-20" : "w-64",
        className
      )}
    >
      <div className="flex flex-col flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2">
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white block truncate">
                  MindGuard<span className="text-indigo-600 dark:text-indigo-400">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Campus Care
                </span>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 mx-auto rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 shrink-0">
              <Brain className="w-5 h-5" />
            </div>
          )}

          {/* Collapse Toggle for Desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Close for Mobile Drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Grouped Nav Items */}
        <nav className="space-y-6">
          {sections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  {sec.title}
                </p>
              )}
              {sec.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onCloseMobile}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group",
                        isActive
                          ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold border-l-4 border-indigo-600 shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      )
                    }
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        collapsed ? "mx-auto" : ""
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer User Profile & Tele-MANAS */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
        {user.role === "STUDENT" && !collapsed && (
          <a
            href="tel:14416"
            className="flex items-center justify-between p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 text-xs transition-colors hover:bg-rose-100 dark:hover:bg-rose-950/80"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
              <span className="font-bold text-[11px]">Tele-MANAS: 14416</span>
            </div>
            <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-700 dark:text-rose-200">
              SOS
            </span>
          </a>
        )}

        {/* User Profile Card */}
        <div
          className={cn(
            "flex items-center rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-2",
            collapsed ? "justify-center" : "gap-2.5 justify-between"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs uppercase shrink-0 shadow-xs">
            {user.full_name ? user.full_name.charAt(0) : user.email.charAt(0)}
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                {user.full_name || user.email.split("@")[0]}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-slate-500 font-semibold uppercase">{user.role}</span>
              </div>
            </div>
          )}

          <button
            onClick={() => logout()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
