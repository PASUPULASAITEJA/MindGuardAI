import React, { useState } from "react";
import { useLocation, NavLink } from "react-router-dom";
import Sidebar from "@/components/layouts/Sidebar";
import TopNav from "@/components/layouts/TopNav";
import { motion, AnimatePresence } from "motion/react";
import { AmbientParticles } from "@/components/3d/AmbientParticles";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  ClipboardCheck,
  MessageSquare,
  Activity,
  BookOpen,
  Users,
  AlertCircle,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface DashboardLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ title, subtitle, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  // Mobile Bottom Tab Bar items by role
  const getMobileTabs = () => {
    if (user?.role === "STUDENT") {
      return [
        { label: "Dashboard", to: "/student/dashboard", icon: LayoutDashboard },
        { label: "Check-in", to: "/student/check-in", icon: ClipboardCheck },
        { label: "AI Chat", to: "/student/chat", icon: MessageSquare },
        { label: "Wellbeing", to: "/student/history", icon: Activity },
        { label: "Tools", to: "/student/resources", icon: BookOpen },
      ];
    }
    if (user?.role === "COUNSELOR") {
      return [
        { label: "Dashboard", to: "/counselor/dashboard", icon: LayoutDashboard },
        { label: "Triage", to: "/counselor/alerts", icon: AlertCircle },
        { label: "Cases", to: "/counselor/students", icon: Users },
      ];
    }
    return [
      { label: "Overview", to: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Reports", to: "/admin/reports", icon: BarChart3 },
      { label: "Audit", to: "/admin/audit-logs", icon: ShieldCheck },
    ];
  };

  const mobileTabs = getMobileTabs();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground flex font-sans">
      {/* Background Ambient Particles & Atmospheric Lighting */}
      <AmbientParticles intensity="subtle" particleCount={32} />

      {/* Desktop Collapsible Sidebar */}
      <Sidebar className="hidden md:flex shrink-0" />

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer (sliding panel) */}
      <div
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 md:hidden transition-transform duration-300 ease-out transform ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onCloseMobile={() => setIsMobileMenuOpen(false)} className="w-full h-full" />
      </div>

      {/* Main Content Area */}
      <main className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <TopNav title={title} subtitle={subtitle} onMenuClick={() => setIsMobileMenuOpen(true)} />
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mx-auto w-full max-w-7xl"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* MOBILE BOTTOM TAB BAR (< md) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.to;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all",
                isActive
                  ? "text-indigo-600 dark:text-indigo-400 font-bold scale-105"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default DashboardLayout;
