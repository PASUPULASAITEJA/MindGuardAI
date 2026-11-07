import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Clock,
  Layers,
  RefreshCw,
  Search,
  Code2,
  BookOpen,
  MessageCircle,
  Tv,
  Gamepad,
  Briefcase,
  HelpCircle,
  CheckCircle2,
  PieChart as PieChartIcon
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { digitalWellnessAPI } from "@/services/api";
import { EmptyStateCard } from "./EmptyStateCard";

interface AppItem {
  app_name: string;
  app_identifier: string;
  category: string;
  minutes: number;
  launches: number;
  percentage: number;
  icon_hint?: string;
}

interface CategorySummary {
  category: string;
  minutes: number;
  percentage: number;
}

interface ApplicationData {
  date: string;
  has_data: boolean;
  total_app_minutes: number;
  applications: AppItem[];
  categories: CategorySummary[];
  available_dates?: string[];
  latest_active_date?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Education: "#3b82f6",
  Programming: "#8b5cf6",
  Communication: "#10b981",
  Entertainment: "#ec4899",
  "Social Media": "#f59e0b",
  Gaming: "#ef4444",
  Productivity: "#06b6d4",
  Other: "#64748b"
};

export interface ApplicationAnalyticsViewProps {
  onNavigateTab?: (tab: string) => void;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
}

export const ApplicationAnalyticsView: React.FC<ApplicationAnalyticsViewProps> = ({
  onNavigateTab,
  selectedDate,
  onSelectDate,
}) => {
  const [data, setData] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const fetchApps = async (targetDate?: string) => {
    try {
      setRefreshing(true);
      const queryDate = targetDate !== undefined ? targetDate : selectedDate;
      const res = await digitalWellnessAPI.getApplications(queryDate);
      setData(res);
    } catch (err) {
      console.error("Failed to fetch application analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApps(selectedDate);
  }, [selectedDate]);

  const formatHoursMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Programming":
        return <Code2 className="w-4 h-4 text-purple-500" />;
      case "Education":
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case "Communication":
        return <MessageCircle className="w-4 h-4 text-emerald-500" />;
      case "Entertainment":
        return <Tv className="w-4 h-4 text-pink-500" />;
      case "Gaming":
        return <Gamepad className="w-4 h-4 text-red-500" />;
      case "Productivity":
        return <Briefcase className="w-4 h-4 text-cyan-500" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  if (!loading && (!data || !data.has_data || data.applications.length === 0)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-indigo-500" />
              Application Usage Analytics
            </h2>
            <p className="text-sm text-muted-foreground">
              Foreground window duration and launch telemetry detected across sessions
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchApps(selectedDate)}
            disabled={refreshing}
            className="rounded-xl border-border/60 hover:bg-muted/50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {data?.latest_active_date && onSelectDate ? (
          <div className="p-8 rounded-2xl bg-card border border-border/70 text-center space-y-4 max-w-xl mx-auto shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                No Application Launches Recorded for {selectedDate || data?.date}
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-md mx-auto">
                Live desktop agent is monitoring in background. You have detailed application metrics from your recent session.
              </p>
            </div>
            <div className="pt-2">
              <Button
                onClick={() => onSelectDate(data.latest_active_date!)}
                className="rounded-xl bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 hover:bg-primary/90 shadow-sm"
              >
                View Recent Active Session ({data.latest_active_date}) &rarr;
              </Button>
            </div>
          </div>
        ) : (
          <EmptyStateCard
            title="No application data available yet. Start monitoring to see your digital wellness analytics."
            description="MindGuard desktop agent tracks foreground application windows with zero synthetic estimates."
            onOpenDevices={onNavigateTab ? () => onNavigateTab("devices") : undefined}
          />
        )}
      </div>
    );
  }

  const filteredApps = (data?.applications || []).filter((app) => {
    const matchesSearch =
      app.app_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.app_identifier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "ALL" || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryChartData = (data?.categories || []).map((cat) => ({
    name: cat.category,
    value: cat.minutes,
    color: CATEGORY_COLORS[cat.category] || "#64748b"
  }));

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-500" />
            Application Usage Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            True active window durations categorized across programming, study, and recreation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
            Total App Time: {formatHoursMins(data?.total_app_minutes || 0)}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchApps}
            disabled={refreshing}
            className="rounded-xl border-border/60 hover:bg-muted/50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Category breakdown overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm shadow-sm lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-indigo-500" />
              Category Distribution
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Ratio of study vs. entertainment usage
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {categoryChartData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const p = payload[0];
                        return (
                          <div className="bg-popover border border-border/80 shadow-lg p-2.5 rounded-xl text-xs space-y-1">
                            <span className="font-semibold text-foreground">{p.name}</span>
                            <p className="text-muted-foreground">
                              {formatHoursMins(p.value as number)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Category list with badges */}
            <div className="space-y-2 mt-4 pt-3 border-t border-border/40 max-h-48 overflow-y-auto">
              {(data?.categories || []).map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between text-xs cursor-pointer hover:bg-muted/40 p-1.5 rounded-lg transition-colors"
                  onClick={() => setSelectedCategory(selectedCategory === cat.category ? "ALL" : cat.category)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[cat.category] || "#64748b" }}
                    />
                    <span className="font-medium text-foreground">{cat.category}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{formatHoursMins(cat.minutes)}</span>
                    <span className="font-semibold text-foreground">({cat.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Applications table & filters */}
        <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">
                  Most-Used Applications
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Foreground window time tracked with microsecond accuracy
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter applications..."
                  className="pl-9 h-9 text-xs rounded-xl border-border/60"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              <Button
                variant={selectedCategory === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("ALL")}
                className="h-7 text-xs rounded-lg px-2.5"
              >
                All Categories
              </Button>
              {Object.keys(CATEGORY_COLORS).map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="h-7 text-xs rounded-lg px-2.5"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border/30 max-h-[420px] overflow-y-auto">
              {filteredApps.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No applications match your filter criteria.
                </div>
              ) : (
                filteredApps.map((app) => (
                  <div key={app.app_identifier} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                        {getCategoryIcon(app.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {app.app_name}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                            {app.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate font-mono">
                          {app.app_identifier} &bull; {app.launches} launches
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 w-36 space-y-1">
                      <div className="text-sm font-bold text-foreground">
                        {formatHoursMins(app.minutes)}
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <Progress value={app.percentage} className="h-1.5 w-20" />
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {app.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApplicationAnalyticsView;

