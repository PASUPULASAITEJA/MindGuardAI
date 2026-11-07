import React, { useState, useEffect } from "react";
import {
  Bell,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertCircle,
  BarChart3,
  Layers,
  Smartphone
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { digitalWellnessAPI } from "@/services/api";
import { EmptyStateCard } from "./EmptyStateCard";

interface NotificationApp {
  app_name: string;
  app_identifier: string;
  count: number;
}

interface HourlyItem {
  hour: string;
  count: number;
}

interface NotificationData {
  date: string;
  has_data: boolean;
  total_notifications: number;
  applications: NotificationApp[];
  hourly_trend: HourlyItem[];
}

interface NotificationAnalyticsViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const NotificationAnalyticsView: React.FC<NotificationAnalyticsViewProps> = ({ onNavigateTab }) => {
  const [data, setData] = useState<NotificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      setRefreshing(true);
      const res = await digitalWellnessAPI.getNotifications();
      setData(res);
    } catch (err) {
      console.error("Failed to fetch notification analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (!loading && (!data || !data.has_data || data.applications.length === 0)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-500" />
              Notification Analytics
            </h2>
            <p className="text-sm text-muted-foreground">
              App notification frequencies and focus interruption analysis
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            disabled={refreshing}
            className="rounded-xl border-border/60 hover:bg-muted/50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Informational banner about platform compatibility */}
        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">
              Privacy-Guaranteed Notification Counting
            </p>
            <p>
              MindBridge tallies incoming event frequencies across system channels to analyze digital fatigue.
              Under strict privacy rules, notification bodies, private message contents, senders, and OTPs are never inspected or recorded.
            </p>
          </div>
        </div>

        <EmptyStateCard
          title="No notification telemetry recorded yet."
          description="Ensure the MindBridge Desktop Agent is running with accessibility/notification permissions on your operating system."
          onOpenDevices={onNavigateTab ? () => onNavigateTab("devices") : undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-500" />
            Notification Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Quantified focus interruptions and notification frequency trends
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400">
            Total Today: {data?.total_notifications || 0}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            disabled={refreshing}
            className="rounded-xl border-border/60 hover:bg-muted/50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 24-Hour Hourly Notification Trend Chart */}
      <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            24-Hour Notification Distribution
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Identifies peak interruption windows throughout the day and late-night disturbances
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.hourly_trend || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10 }}
                  stroke="currentColor"
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  className="text-muted-foreground"
                />
                <Tooltip
                  cursor={{ fill: "rgba(168, 85, 247, 0.05)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border/80 shadow-lg p-2.5 rounded-xl text-xs space-y-1">
                          <p className="font-semibold text-foreground">{p.hour}</p>
                          <p className="text-purple-500 font-medium">{p.count} notifications</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#a855f7"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Notification-heavy Applications Table */}
      <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Most Notification-Heavy Applications
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Ranked by total alert count
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-border/30 max-h-96 overflow-y-auto">
            {(data?.applications || []).map((app, index) => (
              <div key={app.app_identifier} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                    #{index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-sm text-foreground truncate block">
                      {app.app_name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate block font-mono">
                      {app.app_identifier}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-bold text-foreground">
                    {app.count}
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    alerts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationAnalyticsView;

