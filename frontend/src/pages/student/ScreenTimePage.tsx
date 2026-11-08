import React, { useState, useMemo } from "react";
import {
  Activity,
  Smartphone,
  Globe,
  Search,
  Bell,
  Laptop,
  ShieldCheck,
  Moon,
  Eye,
  Sparkles,
  Calendar
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DotGridBackground } from "@/components/ui/DotGridBackground";
import { ShinyText } from "@/components/ui/ShinyText";
import { pageVariants } from "@/utils/motion";
import { EyeBreakModal } from "@/components/EyeBreakModal";

// Modular Digital Wellness Views
import { DigitalWellnessOverview } from "@/components/digital-wellness/DigitalWellnessOverview";
import { ApplicationAnalyticsView } from "@/components/digital-wellness/ApplicationAnalyticsView";
import { WebsiteAnalyticsView } from "@/components/digital-wellness/WebsiteAnalyticsView";
import { SearchAnalyticsView } from "@/components/digital-wellness/SearchAnalyticsView";
import { NotificationAnalyticsView } from "@/components/digital-wellness/NotificationAnalyticsView";
import { DeviceManagementView } from "@/components/digital-wellness/DeviceManagementView";
import { PrivacyConsentView } from "@/components/digital-wellness/PrivacyConsentView";
import { CircadianTimelineView } from "@/components/digital-wellness/CircadianTimelineView";

type TabId =
  | "overview"
  | "applications"
  | "websites"
  | "searches"
  | "notifications"
  | "circadian"
  | "devices"
  | "privacy";

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "applications", label: "Applications", icon: Smartphone },
  { id: "websites", label: "Websites", icon: Globe },
  { id: "searches", label: "Searches", icon: Search },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "circadian", label: "Circadian Rhythm", icon: Moon },
  { id: "devices", label: "Devices", icon: Laptop },
  { id: "privacy", label: "Privacy & Consent", icon: ShieldCheck }
];

export const ScreenTimePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [isEyeBreakOpen, setIsEyeBreakOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });

  const quickDates = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const label =
        i === 0
          ? "Today"
          : i === 1
          ? "Yesterday"
          : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      list.push({ dateStr, label });
    }
    return list;
  }, []);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="relative w-full space-y-6 pb-12 font-sans text-foreground"
    >
      <DotGridBackground />

      {/* Header and Hero Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 flex items-center gap-1.5 px-3 py-0.5 text-xs font-semibold"
            >
              <Sparkles className="w-3 h-3" />
              Digital Wellness & Screen Time
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <ShinyText text="Digital Activity & Health Analytics" />
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 max-w-2xl">
            Cross-platform physical idle-filtered telemetry &bull; Zero synthetic estimates &bull; Student privacy safeguarded
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEyeBreakOpen(true)}
            className="rounded-xl border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs font-semibold h-9"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            20-20-20 Eye Break
          </Button>
        </div>
      </div>

      {/* Quick Date Switcher Pill Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/60 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-bold text-foreground shrink-0 mr-1">Activity Date:</span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {quickDates.map((qd) => {
              const isSelected = selectedDate === qd.dateStr;
              return (
                <button
                  key={qd.dateStr}
                  onClick={() => setSelectedDate(qd.dateStr)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs font-bold scale-102"
                      : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {qd.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Tab Navigation Pill Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/40 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div className="pt-2">
        {activeTab === "overview" && (
          <DigitalWellnessOverview
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onNavigateTab={(t) => setActiveTab(t as TabId)}
          />
        )}
        {activeTab === "applications" && (
          <ApplicationAnalyticsView
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onNavigateTab={(t) => setActiveTab(t as TabId)}
          />
        )}
        {activeTab === "websites" && (
          <WebsiteAnalyticsView onNavigateTab={(t) => setActiveTab(t as TabId)} />
        )}
        {activeTab === "searches" && (
          <SearchAnalyticsView onNavigateTab={(t) => setActiveTab(t as TabId)} />
        )}
        {activeTab === "notifications" && (
          <NotificationAnalyticsView onNavigateTab={(t) => setActiveTab(t as TabId)} />
        )}
        {activeTab === "circadian" && <CircadianTimelineView />}
        {activeTab === "devices" && <DeviceManagementView />}
        {activeTab === "privacy" && <PrivacyConsentView />}
      </div>

      {/* 20-20-20 Eye Break Modal */}
      <EyeBreakModal
        isOpen={isEyeBreakOpen}
        onClose={() => setIsEyeBreakOpen(false)}
      />
    </motion.div>
  );
};

export default ScreenTimePage;
