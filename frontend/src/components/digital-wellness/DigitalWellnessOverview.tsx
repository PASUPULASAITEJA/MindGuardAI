import React, { useState, useEffect } from "react";
import {
  Clock,
  Activity,
  Moon,
  Smartphone,
  Globe,
  Bell,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Zap,
  BarChart2
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { digitalWellnessAPI } from "@/services/api";
import { EmptyStateCard } from "./EmptyStateCard";

interface OverviewData {
  date: string;
  has_data: boolean;
  active_screen_minutes: number;
  idle_minutes: number;
  locked_minutes: number;
  total_awake_minutes: number;
  first_activity_time?: string;
  last_activity_time?: string;
  apps_count: number;
  websites_count: number;
  notifications_count: number;
  daily_trend: Array<{
    date: string;
    active_minutes: number;
    is_today: boolean;
  }>;
}

interface DigitalWellnessOverviewProps {
  onNavigateTab?: (tab: string) => void;
}

export const DigitalWellnessOverview: React.FC<DigitalWellnessOverviewProps> = ({
  onNavigateTab
}) => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOverview = async () => {
    try {
      setRefreshing(true);
      const res = await digitalWellnessAPI.getOverview();
      setData(res);
    } catch (err) {
      console.error("Failed to fetch digital wellness overview:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const formatHoursMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  if (!loading && (!data || !data.has_data)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Digital Wellness Overview
            </h2>
            <p className="text-sm text-muted-foreground">
              Authentic active screen time, physical idle detection, and device usage
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOverview}
            disabled={refreshing}
            className="rounded-xl border-border/60 hover:bg-muted/50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <EmptyStateCard
          onOpenDevices={() => onNavigateTab && onNavigateTab("devices")}
        />
      </div>
    );
  }

  const activeMins = data?.active_screen_minutes || 0;
  const idleMins = data?.idle_minutes || 0;
  const totalAwakeMins = data?.total_awake_minutes || activeMins + idleMins;
  const activePercent = totalAwakeMins > 0 ? Math.round((activeMins / totalAwakeMins) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Digital Wellness Overview
          </h2>
          <p className="text-sm text-muted-foreground">
            Real physical idle-filtered telemetry across all connected endpoints
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Active Sync
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOverview}
            disabled={refreshing}
            className="rounded-xl border-border/60 hover:bg-muted/50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Active Session & Device Awake Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-emerald-500/10 border border-blue-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-foreground">
                Active Session: {data?.first_activity_time ? `Started at ${data.first_activity_time}` : "Active Today"}
              </span>
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-semibold px-2 py-0.5">
                ● Live Endpoint Connected
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total laptop awake duration: <strong className="text-foreground">{formatHoursMins(totalAwakeMins)}</strong> &bull; Authentic active screen time: <strong className="text-blue-500">{formatHoursMins(activeMins)}</strong> &bull; Physical idle: <strong className="text-amber-500">{formatHoursMins(idleMins)}</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/60 backdrop-blur px-3 py-1.5 rounded-xl border border-border/50 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Zero synthetic estimates &bull; Hardware idle-filtered</span>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Device Awake Time (Since 10:14 AM) */}
        <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Awake Time
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-foreground">
                {formatHoursMins(totalAwakeMins)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {data?.first_activity_time ? (
                  <>Started at <span className="text-purple-500 font-semibold">{data.first_activity_time}</span></>
                ) : (
                  <span>Active telemetry session</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Today's Active Screen Time */}
        <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Screen Time
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-foreground">
                {formatHoursMins(activeMins)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <span className="text-blue-500 font-medium">{activePercent}%</span> of total awake time
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Physical Idle Time */}
        <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Idle / Inactive Time
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-foreground">
                {formatHoursMins(idleMins)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Zero keyboard/mouse input detected
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Active Applications */}
        <Card
          onClick={() => onNavigateTab && onNavigateTab("applications")}
          className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm shadow-sm relative overflow-hidden cursor-pointer hover:border-blue-500/40 transition-colors"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Applications Used
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-foreground">
                {data?.apps_count || 0}
              </div>
              <p className="text-xs text-blue-500 font-medium mt-1 hover:underline">
                View application breakdown &rarr;
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Websites Visited */}
        <Card
          onClick={() => onNavigateTab && onNavigateTab("websites")}
          className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm shadow-sm relative overflow-hidden cursor-pointer hover:border-emerald-500/40 transition-colors"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Websites Visited
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-foreground">
                {data?.websites_count || 0}
              </div>
              <p className="text-xs text-emerald-500 font-medium mt-1 hover:underline">
                View browser domains &rarr;
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Longitudinal Activity Chart */}
      <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-500" />
                7-Day Longitudinal Screen-Time Trend
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Calculated from verified OS foreground sessions (excludes idle periods)
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs font-medium">
              Daily Aggregates
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.daily_trend || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => {
                    const parts = val.split("-");
                    return parts.length === 3 ? `${parts[1]}/${parts[2]}` : val;
                  }}
                  stroke="currentColor"
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${Math.round(v / 60)}h`}
                  stroke="currentColor"
                  className="text-muted-foreground"
                />
                <Tooltip
                  cursor={{ fill: "rgba(59, 130, 246, 0.05)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border/80 shadow-lg p-3 rounded-xl text-xs space-y-1">
                          <p className="font-semibold text-foreground">{p.date} {p.is_today ? "(Today)" : ""}</p>
                          <p className="text-blue-500 font-medium">
                            Active Time: {formatHoursMins(p.active_minutes)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="active_minutes"
                  radius={[6, 6, 0, 0]}
                  fill="#3b82f6"
                >
                  {(data?.daily_trend || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.is_today ? "#2563eb" : "#93c5fd"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Notifications and Privacy Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          onClick={() => onNavigateTab && onNavigateTab("notifications")}
          className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm shadow-sm cursor-pointer hover:border-purple-500/40 transition-colors p-5 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                {data?.notifications_count || 0} Notification Alerts Today
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Aggregated notification counts without logging message bodies or OTPs
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-purple-500 hover:text-purple-600">
            Details &rarr;
          </Button>
        </Card>

        <Card
          onClick={() => onNavigateTab && onNavigateTab("privacy")}
          className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm shadow-sm cursor-pointer hover:border-emerald-500/40 transition-colors p-5 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Privacy & Data Retention Controls
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Export telemetry, configure retention periods, or purge records anytime
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-emerald-500 hover:text-emerald-600">
            Manage &rarr;
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default DigitalWellnessOverview;

