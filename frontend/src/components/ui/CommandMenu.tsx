import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Search,
  Sparkles,
  MessageSquare,
  Calendar,
  ShieldAlert,
  Moon,
  Sun,
  Activity,
  FileText,
  Users,
  BarChart3,
  Settings,
  ArrowRight,
  BookOpen,
  X,
  Command,
  Heart,
  Monitor,
  Flame,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/utils/cn";

export interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSOS?: () => void;
  onOpenBreathing?: () => void;
  onOpenBooking?: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  category: "Actions" | "Navigation" | "Counselor" | "Admin" | "Preferences";
  icon: React.FC<{ className?: string }>;
  badge?: string;
  action: () => void;
}

export const CommandMenu: React.FC<CommandMenuProps> = ({
  isOpen,
  onClose,
  onOpenSOS,
  onOpenBreathing,
  onOpenBooking,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const runAndClose = useCallback((action: () => void) => {
    onClose();
    action();
  }, [onClose]);

  // Build commands based on user role
  const commands: CommandItem[] = [
    // Quick Actions
    {
      id: "action-checkin",
      title: "Daily Mood Check-in",
      description: "Log today's emotional score, stress and energy levels",
      category: "Actions",
      icon: Sparkles,
      badge: "Quick",
      action: () => runAndClose(() => navigate("/student/check-in")),
    },
    {
      id: "action-chat",
      title: "AI Wellness Companion",
      description: "Chat privately with your 24/7 CBT-guided wellness assistant",
      category: "Actions",
      icon: MessageSquare,
      badge: "AI",
      action: () => runAndClose(() => navigate("/student/chat")),
    },
    {
      id: "action-breathing",
      title: "Box Breathing Pacer",
      description: "4-4-4-4 autonomic nervous system reset",
      category: "Actions",
      icon: Wind,
      action: () => runAndClose(() => (onOpenBreathing ? onOpenBreathing() : navigate("/student/resources"))),
    },
    {
      id: "action-booking",
      title: "Schedule Counselor Session",
      description: "Confidential 1-on-1 appointment with campus counselor",
      category: "Actions",
      icon: Calendar,
      action: () => runAndClose(() => (onOpenBooking ? onOpenBooking() : navigate("/student/dashboard"))),
    },
    {
      id: "action-sos",
      title: "Immediate Crisis Support & Tele-MANAS",
      description: "Emergency distress escalation & 24/7 hotline 14416 / 988",
      category: "Actions",
      icon: ShieldAlert,
      badge: "Emergency",
      action: () => runAndClose(() => (onOpenSOS ? onOpenSOS() : navigate("/student/dashboard"))),
    },

    // Navigation
    {
      id: "nav-dashboard",
      title: "Student Wellness Hub",
      description: "Personal wellness score, risk status and habits",
      category: "Navigation",
      icon: Activity,
      action: () => runAndClose(() => navigate("/student/dashboard")),
    },
    {
      id: "nav-screentime",
      title: "Screen Time & Phenotyping",
      description: "Digital workload, circadian late-night monitoring & breaks",
      category: "Navigation",
      icon: Monitor,
      action: () => runAndClose(() => navigate("/student/screentime")),
    },
    {
      id: "nav-history",
      title: "Mood Logs & Trajectory",
      description: "Longitudinal trends, historical baselines & SHAP analytics",
      category: "Navigation",
      icon: Clock,
      action: () => runAndClose(() => navigate("/student/history")),
    },
    {
      id: "nav-resources",
      title: "Self-Care & Resource Library",
      description: "Evidence-based somatic calming & sleep pacing protocols",
      category: "Navigation",
      icon: BookOpen,
      action: () => runAndClose(() => navigate("/student/resources")),
    },
    {
      id: "nav-privacy",
      title: "Privacy & Consent Governance",
      description: "Granular data sharing controls & audit transparency",
      category: "Navigation",
      icon: ShieldCheck,
      action: () => runAndClose(() => navigate("/student/privacy")),
    },
    {
      id: "nav-settings",
      title: "Account Settings",
      description: "Profile information, password management & preferences",
      category: "Navigation",
      icon: Settings,
      action: () => runAndClose(() => navigate("/settings")),
    },

    // Counselor Specific
    ...(user?.role === "COUNSELOR" || user?.role === "ADMIN"
      ? [
          {
            id: "counselor-queue",
            title: "Support Triage Queue",
            description: "Review pending risk flags and high distress cases",
            category: "Counselor" as const,
            icon: Users,
            badge: "Practitioner",
            action: () => runAndClose(() => navigate("/counselor/alerts")),
          },
          {
            id: "counselor-dashboard",
            title: "Counsellor Clinical Dashboard",
            description: "Executive KPIs, intervention outcomes & case management",
            category: "Counselor" as const,
            icon: Activity,
            action: () => runAndClose(() => navigate("/counselor/dashboard")),
          },
          {
            id: "counselor-students",
            title: "Student Case Directory",
            description: "Search all monitored student longitudinal profiles",
            category: "Counselor" as const,
            icon: Users,
            action: () => runAndClose(() => navigate("/counselor/students")),
          },
        ]
      : []),

    // Admin Specific
    ...(user?.role === "ADMIN"
      ? [
          {
            id: "admin-overview",
            title: "University Wellbeing Overview",
            description: "Campus-wide wellness index & cohort participation",
            category: "Admin" as const,
            icon: BarChart3,
            badge: "Admin",
            action: () => runAndClose(() => navigate("/admin/dashboard")),
          },
          {
            id: "admin-audit",
            title: "Institutional Audit Logs",
            description: "Append-only tamper-evident compliance access ledger",
            category: "Admin" as const,
            icon: ShieldCheck,
            action: () => runAndClose(() => navigate("/admin/audit-logs")),
          },
          {
            id: "admin-directory",
            title: "Campus User Directory",
            description: "Manage student, counsellor, and administrator accounts",
            category: "Admin" as const,
            icon: Users,
            action: () => runAndClose(() => navigate("/admin/directory")),
          },
        ]
      : []),

    // Preferences
    {
      id: "pref-theme",
      title: `Toggle Theme (${theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"})`,
      description: "Switch between dark obsidian and clean daylight aesthetics",
      category: "Preferences",
      icon: theme === "dark" ? Sun : Moon,
      action: () => runAndClose(() => setTheme(theme === "dark" ? "light" : "dark")),
    },
  ];

  // Helper icon for Box Breathing
  function Wind(props: { className?: string }) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={props.className}
      >
        <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
        <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
        <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
      </svg>
    );
  }

  // Filter commands
  const filtered = query.trim()
    ? commands.filter(
        (c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          (c.description && c.description.toLowerCase().includes(query.toLowerCase())) ||
          c.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  // Group filtered commands
  const categories = Array.from(new Set(filtered.map((item) => item.category)));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl flex flex-col max-h-[75vh]"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5 bg-card/50">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search actions, tools, navigation, or clinical metrics..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-xs text-muted-foreground hover:text-foreground p-1 rounded-md"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground">
                ESC
              </kbd>
            </div>

            {/* Results Stream */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-border/40">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  <p>No matching commands or pages found for "{query}".</p>
                  <p className="mt-1 text-[11px] opacity-75">Try searching for "check-in", "chat", "breathing", or "settings".</p>
                </div>
              ) : (
                categories.map((category) => {
                  const catItems = filtered.filter((i) => i.category === category);
                  return (
                    <div key={category} className="py-1.5">
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {category}
                      </div>
                      <div className="space-y-0.5 mt-0.5">
                        {catItems.map((item) => {
                          const itemIndex = filtered.indexOf(item);
                          const isSelected = itemIndex === selectedIndex;
                          const Icon = item.icon;
                          return (
                            <div
                              key={item.id}
                              onMouseEnter={() => setSelectedIndex(itemIndex)}
                              onClick={item.action}
                              className={cn(
                                "flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs cursor-pointer transition-all",
                                isSelected
                                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                  : "text-foreground hover:bg-secondary/70"
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={cn(
                                    "p-1.5 rounded-lg flex items-center justify-center shrink-0",
                                    isSelected
                                      ? "bg-white/20 text-white"
                                      : "bg-secondary text-primary"
                                  )}
                                >
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="truncate">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate">{item.title}</span>
                                    {item.badge && (
                                      <span
                                        className={cn(
                                          "text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wide",
                                          isSelected
                                            ? "bg-white/25 text-white"
                                            : item.badge === "Emergency"
                                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25"
                                            : "bg-primary/15 text-primary border border-primary/25"
                                        )}
                                      >
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p
                                      className={cn(
                                        "text-[11px] truncate mt-0.5 font-normal",
                                        isSelected ? "text-white/80" : "text-muted-foreground"
                                      )}
                                    >
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <ArrowRight
                                className={cn(
                                  "h-3.5 w-3.5 shrink-0 transition-transform",
                                  isSelected ? "opacity-100 translate-x-0.5" : "opacity-0"
                                )}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Navigation Hints */}
            <div className="flex items-center justify-between border-t border-border/70 px-4 py-2.5 bg-muted/40 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-card border border-border font-mono text-[9px]">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-card border border-border font-mono text-[9px]">↓</kbd>
                  <span>navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-card border border-border font-mono text-[9px]">↵</kbd>
                  <span>select</span>
                </span>
              </div>
              <div className="flex items-center gap-1 font-medium">
                <Command className="h-3 w-3" />
                <span>React Bits Command Palette</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandMenu;
