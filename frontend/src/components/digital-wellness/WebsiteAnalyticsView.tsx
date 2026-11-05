import React, { useState, useEffect } from "react";
import {
  Globe,
  Clock,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
  Compass
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { digitalWellnessAPI } from "@/services/api";
import { EmptyStateCard } from "./EmptyStateCard";

interface WebAnalyticsData {
  date: string;
  has_data: boolean;
  total_web_minutes: number;
  websites: Array<{
    domain: string;
    browser: string;
    category: string;
    minutes: number;
    visits: number;
    percentage: number;
  }>;
  browsers: Array<{
    browser: string;
    minutes: number;
  }>;
}

export const WebsiteAnalyticsView: React.FC = () => {
  const [data, setData] = useState<WebAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWebsites = async () => {
    try {
      setRefreshing(true);
      const res = await digitalWellnessAPI.getWebsites();
      setData(res);
    } catch (err) {
      console.error("Failed to fetch website analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  const formatHoursMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const getCategoryClass = (category: string) => {
    switch (category?.toLowerCase()) {
      case "education":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "entertainment":
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30";
      case "social media":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      default:
        return "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30";
    }
  };

  if (!loading && (!data || !data.has_data || data.websites.length === 0)) {
    return (
      <div className="space-y-6">
        <EmptyStateCard
          title="No activity data available yet. Start monitoring to see your digital wellness analytics."
          description="Domain-level browsing duration and visit counts will appear here once you browse with the MindGuard Chrome/Edge extension active."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Globe className="w-5 h-5 text-sky-500" />
            Website & Active Domain Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Authentic domain-level active tab duration and visit frequency captured via browser extension.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchWebsites}
          disabled={refreshing}
          className="rounded-xl border-border/80"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/70 border-border/70 rounded-2xl p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold">Active Web Time</div>
          <div className="text-2xl font-bold text-sky-500 mt-1">
            {formatHoursMins(data?.total_web_minutes || 0)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Focused active tab duration</div>
        </Card>

        <Card className="bg-card/70 border-border/70 rounded-2xl p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold">Distinct Domains</div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {data?.websites.length || 0}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Websites visited today</div>
        </Card>

        <Card className="bg-card/70 border-border/70 rounded-2xl p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold">Primary Browser</div>
          <div className="text-2xl font-bold text-emerald-500 mt-1">
            {data?.browsers[0]?.browser || "Chrome / Edge"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Manifest V3 protected client</div>
        </Card>
      </div>

      {/* Domains Table */}
      <Card className="bg-card/70 border-border/70 rounded-2xl shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Most-Visited Domains Today</CardTitle>
          <CardDescription className="text-xs">
            Duration strictly counted when tab is focused and user is active. Zero page contents or form data collected.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-border/50">
            {data?.websites.map((site) => (
              <div key={site.domain} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-foreground truncate flex items-center gap-2">
                      <span>{site.domain}</span>
                      <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${getCategoryClass(site.category)}`}>
                        {site.category}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {site.visits} {site.visits === 1 ? "visit" : "visits"} • {site.browser}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-right">
                  <div className="w-24 hidden md:block">
                    <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-sky-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, site.percentage || 5)}%` }}
                      />
                    </div>
                  </div>
                  <div className="font-semibold text-sm text-foreground">
                    {formatHoursMins(site.minutes)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebsiteAnalyticsView;
