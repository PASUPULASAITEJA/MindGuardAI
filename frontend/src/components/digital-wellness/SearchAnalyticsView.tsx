import React, { useState, useEffect } from "react";
import {
  Search,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Clock,
  Sparkles,
  CheckCircle2,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { digitalWellnessAPI } from "@/services/api";
import { EmptyStateCard } from "./EmptyStateCard";

interface SearchItem {
  id: string;
  query: string;
  engine: string;
  category: string;
  is_crisis: boolean;
  timestamp: string;
}

interface SearchAnalyticsData {
  consent_enabled: boolean;
  has_data: boolean;
  searches: SearchItem[];
  engine_breakdown: Array<{ engine: string; count: number }>;
}

export const SearchAnalyticsView: React.FC = () => {
  const [data, setData] = useState<SearchAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const fetchSearches = async () => {
    try {
      setRefreshing(true);
      const res = await digitalWellnessAPI.getSearches();
      setData(res);
    } catch (err) {
      console.error("Failed to fetch search analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSearches();
  }, []);

  const handleClearHistory = async () => {
    try {
      setClearing(true);
      await digitalWellnessAPI.clearSearches();
      setConfirmClear(false);
      fetchSearches();
    } catch (err) {
      console.error("Failed to clear search history:", err);
    } finally {
      setClearing(false);
    }
  };

  const filteredSearches = (data?.searches || []).filter((s) =>
    s.query.toLowerCase().includes(filterText.toLowerCase()) ||
    s.engine.toLowerCase().includes(filterText.toLowerCase()) ||
    s.category.toLowerCase().includes(filterText.toLowerCase())
  );

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            Search Query Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Academic topic trends &bull; Strictly private to account owner
          </p>
        </div>
        <div className="flex items-center gap-2">
          {confirmClear ? (
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearHistory}
                disabled={clearing}
                className="rounded-xl h-8 text-xs"
              >
                {clearing ? "Purging..." : "Confirm Purge"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmClear(false)}
                className="rounded-xl h-8 text-xs"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmClear(true)}
              disabled={!data?.searches || data.searches.length === 0}
              className="rounded-xl text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 h-8 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Clear History
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSearches}
            disabled={refreshing}
            className="rounded-xl border-border/60 hover:bg-muted/50 h-8 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Privacy guarantee notice */}
      <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">
            Privacy-First Academic Search Logging
          </p>
          <p>
            Searches are captured via the MindGuard browser extension exclusively when explicitly opted-in.
            Private/incognito queries are never inspected, raw queries are never shared with counselors or third parties,
            and records can be purged at any time.
          </p>
        </div>
      </div>

      {!loading && (!data || !data.has_data || data.searches.length === 0) ? (
        <EmptyStateCard
          title="No search analytics available yet."
          description="Enable academic search tracking in Privacy Settings and browse Google, Bing, or DuckDuckGo with the MindGuard extension."
        />
      ) : (
        <>
          {/* Engine distribution badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(data?.engine_breakdown || []).map((eb) => (
              <Card key={eb.engine} className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  {eb.engine}
                </div>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {eb.count} <span className="text-xs font-normal text-muted-foreground">queries</span>
                </div>
              </Card>
            ))}
            <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Total Queries
              </div>
              <div className="text-2xl font-bold text-blue-500 mt-1">
                {data?.searches.length || 0}
              </div>
            </Card>
          </div>

          {/* Search table */}
          <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Recorded Search Queries
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Historical queries logged during active study sessions
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
                  <Input
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Search query records..."
                    className="pl-9 h-9 text-xs rounded-xl border-border/60"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-border/30 max-h-[460px] overflow-y-auto">
                {filteredSearches.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    No search records match your filter criteria.
                  </div>
                ) : (
                  filteredSearches.map((s) => (
                    <div key={s.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground truncate">
                            "{s.query}"
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {s.engine}
                          </Badge>
                          {s.category && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {s.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(s.timestamp)}
                        </p>
                      </div>
                      {s.is_crisis && (
                        <Badge variant="destructive" className="text-[10px] shrink-0">
                          Support Resources Offered
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default SearchAnalyticsView;

