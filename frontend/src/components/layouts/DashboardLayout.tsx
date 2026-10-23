import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "@/components/layouts/Sidebar";
import TopNav from "@/components/layouts/TopNav";
import { motion, AnimatePresence } from "motion/react";
import { AmbientParticles } from "@/components/3d/AmbientParticles";

interface DashboardLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ title, subtitle, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground flex">
      {/* Background Ambient Particles & Atmospheric Lighting */}
      <AmbientParticles intensity="subtle" particleCount={38} />

      {/* Desktop Sidebar (hidden on mobile, fixed width on md screens) */}
      <Sidebar className="hidden md:flex md:w-72 shrink-0" />

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer (sliding panel) */}
      <div
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 md:hidden transition-transform duration-300 ease-out transform ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onCloseMobile={() => setIsMobileMenuOpen(false)} className="w-full" />
      </div>

      {/* Main Content Area */}
      <main className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <TopNav 
          title={title} 
          subtitle={subtitle} 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
        />
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto w-full max-w-7xl"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
