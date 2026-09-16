import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  sleepAPI, 
  SleepLogCreatePayload, 
  SleepAnalysisResponse,
  SleepLogListResponse 
} from "@/services/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Moon, 
  Sun, 
  Bed, 
  Coffee, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Activity, 
  Sparkles, 
  Loader2, 
  Plus, 
  Minus,
  RefreshCw,
  Compass
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";

export const SleepTrackerCard: React.FC = () => {
  const queryClient = useQueryClient();

  // Form states
  const todayStr = new Date().toISOString().split("T")[0];
  const [logDate, setLogDate] = useState<string>(todayStr);
  const [bedtimeTime, setBedtimeTime] = useState<string>("23:30");
  const [wakeTimeTime, setWakeTimeTime] = useState<string>("07:30");
  const [sleepQuality, setSleepQuality] = useState<number>(3);
  const [napTaken, setNapTaken] = useState<boolean>(false);
  const [napDuration, setNapDuration] = useState<number>(20);
  const [disruptions, setDisruptions] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Fetch 7-day analysis
  const { data: analysis, isLoading: isAnalysisLoading, refetch: refetchAnalysis } = useQuery<SleepAnalysisResponse>({
    queryKey: ["sleep-analysis-7d"],
    queryFn: () => sleepAPI.getAnalysis(7),
    staleTime: 60 * 1000
  });

  // Fetch recent sleep logs for trend visualization
  const { data: logsData } = useQuery<SleepLogListResponse>({
    queryKey: ["sleep-logs-7d"],
    queryFn: () => sleepAPI.getMyLogs("7d"),
    staleTime: 60 * 1000
  });

  const sleepMutation = useMutation({
    mutationFn: (payload: SleepLogCreatePayload) => sleepAPI.create(payload),
    onSuccess: () => {
      setIsSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["sleep-analysis-7d"] });
      queryClient.invalidateQueries({ queryKey: ["sleep-logs-7d"] });
      queryClient.invalidateQueries({ queryKey: ["personalized-recommendations"] });
      setTimeout(() => setIsSuccess(false), 5000);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Build ISO timestamp strings for bedtime and wake time
    const bedDateTime = new Date(`${logDate}T${bedtimeTime}:00Z`).toISOString();
    // If wake time is earlier than bedtime, assume it's next day
    let wakeDate = new Date(`${logDate}T${wakeTimeTime}:00Z`);
    if (wakeTimeTime <= bedtimeTime) {
      wakeDate.setDate(wakeDate.getDate() + 1);
    }
    const wakeDateTime = wakeDate.toISOString();

    sleepMutation.mutate({
      log_date: logDate,
      bedtime: bedDateTime,
      wake_time: wakeDateTime,
      sleep_quality: sleepQuality,
      nap_taken: napTaken,
      nap_duration_minutes: napTaken ? napDuration : 0,
      sleep_disruptions: disruptions,
      source: "self_report"
    });
  };

  // Chart data formatting (reversed to chronological)
  const chartData = (logsData?.items || []).slice().reverse().map((l) => ({
    date: new Date(l.log_date).toLocaleDateString("en-US", { weekday: "short" }),
    hours: l.sleep_hours,
    quality: l.sleep_quality
  }));

  const qualityLabels = [
    { val: 1, label: "Poor", desc: "Restless / Fragmented" },
    { val: 2, label: "Fair", desc: "Tired on Waking" },
    { val: 3, label: "Good", desc: "Refreshed & Clear" },
    { val: 4, label: "Great", desc: "Deep & Restorative" },
  ];

  return (
    <Card className="wellness-card overflow-hidden shadow-xs border-primary/20 bg-gradient-to-b from-card to-background">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Moon className="h-4 w-4" />
              </span>
              <CardTitle className="text-base md:text-lg font-black text-foreground tracking-tight">
                Circadian Sleep & Recovery Tracker
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Monitor sleep consistency, circadian rhythms, and restorative rest patterns.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {analysis?.is_flagged_risk ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <AlertTriangle className="h-3 w-3" />
                Circadian Strain
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" />
                Rhythm Stable
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchAnalysis()}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {isSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Sleep session logged successfully! Circadian statistics updated.</span>
            </div>
            <button onClick={() => setIsSuccess(false)} className="underline opacity-80 text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* 1. Macro Sleep Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
              Average Duration
            </span>
            <div className="text-xl font-black text-foreground mt-1 flex items-baseline gap-1">
              <span>{analysis?.avg_sleep_hours ?? "7.5"}</span>
              <span className="text-xs font-medium text-muted-foreground">hrs</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">Target: 7-9 hrs</span>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
              7-Day Consistency
            </span>
            <div className={`text-xl font-black mt-1 flex items-baseline gap-1 ${
              (analysis?.sleep_consistency_7d ?? 0) > 2.0 ? "text-rose-500" : "text-emerald-500"
            }`}>
              <span>±{analysis?.sleep_consistency_7d ?? "0.0"}</span>
              <span className="text-xs font-medium text-muted-foreground">hrs</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">STDDEV &lt; 1.5h optimal</span>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
              Quality Rating
            </span>
            <div className="text-xl font-black text-foreground mt-1 flex items-baseline gap-1">
              <span>{analysis?.avg_quality_score ?? "3.0"}</span>
              <span className="text-xs font-medium text-muted-foreground">/ 4</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">Subjective feeling</span>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
              Disruptions / Night
            </span>
            <div className="text-xl font-black text-foreground mt-1 flex items-baseline gap-1">
              <span>{analysis?.avg_disruptions ?? "0.0"}</span>
              <span className="text-xs font-medium text-muted-foreground">wakeups</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">Sleep fragmentation</span>
          </div>
        </div>

        {/* 2. Circadian Flag Alert (if triggered) */}
        {analysis?.is_flagged_risk && analysis.risk_reasons.length > 0 && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 font-black uppercase tracking-wider text-[11px]">
              <AlertTriangle className="h-4 w-4" />
              <span>Circadian Safety Notice</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground pl-1">
              {analysis.risk_reasons.map((r, i) => (
                <li key={i}><strong className="text-foreground">{r}</strong></li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. Sleep Trend Chart & Quick Log Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Log Form */}
          <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-muted/20 border border-border/50 space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Bed className="h-3.5 w-3.5 text-primary" />
                Log Last Night's Sleep
              </h4>
              <Input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="h-7 text-[11px] w-32 bg-background border-border/70 text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                  Bedtime
                </Label>
                <Input
                  type="time"
                  value={bedtimeTime}
                  onChange={(e) => setBedtimeTime(e.target.value)}
                  className="h-8 text-xs bg-background border-border/70 text-foreground"
                />
              </div>

              <div>
                <Label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                  Wake Time
                </Label>
                <Input
                  type="time"
                  value={wakeTimeTime}
                  onChange={(e) => setWakeTimeTime(e.target.value)}
                  className="h-8 text-xs bg-background border-border/70 text-foreground"
                />
              </div>
            </div>

            {/* Quality Rating Radio Grid */}
            <div>
              <Label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1.5">
                Sleep Quality
              </Label>
              <div className="grid grid-cols-4 gap-1.5">
                {qualityLabels.map((q) => (
                  <button
                    key={q.val}
                    type="button"
                    onClick={() => setSleepQuality(q.val)}
                    className={`p-2 rounded-lg text-center transition-all border ${
                      sleepQuality === q.val
                        ? "bg-primary text-primary-foreground border-primary shadow-2xs font-bold"
                        : "bg-background border-border/70 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="text-xs font-bold">{q.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Daytime Nap & Disruptions Row */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-lg bg-background border border-border/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-foreground">Daytime Nap?</span>
                  <input
                    type="checkbox"
                    checked={napTaken}
                    onChange={(e) => setNapTaken(e.target.checked)}
                    className="h-3.5 w-3.5 accent-primary rounded cursor-pointer"
                  />
                </div>
                {napTaken && (
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Duration:</span>
                    <span className="font-bold text-foreground">{napDuration}m</span>
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-background border border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-foreground block">Awakenings</span>
                  <span className="text-[10px] text-muted-foreground">Night disruptions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disruptions <= 0}
                    onClick={() => setDisruptions(Math.max(0, disruptions - 1))}
                    className="h-6 w-6 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-xs font-black text-foreground w-4 text-center">{disruptions}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDisruptions(disruptions + 1)}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={sleepMutation.isPending}
              className="w-full h-8 text-xs font-bold gap-1.5 shadow-xs"
            >
              {sleepMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
              <span>Record Sleep Session</span>
            </Button>
          </form>

          {/* Sleep Trajectory Visual Chart */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/50 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Activity className="h-3.5 w-3.5 text-primary" />
                Recent 7-Day Sleep Duration
              </h4>
              <p className="text-[11px] text-muted-foreground mb-3">
                Target band: 7.0 - 9.0 hours. Dotted line marks clinical 6.0h threshold.
              </p>
            </div>

            <div className="h-[170px] w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  No sleep records found in the last 7 days.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                    <YAxis domain={[0, 12]} stroke="#94a3b8" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--background)",
                        borderColor: "var(--border)",
                        borderRadius: "8px",
                        fontSize: "11px"
                      }}
                    />
                    <ReferenceLine y={6.0} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "6h Threshold", fill: "#ef4444", fontSize: 9 }} />
                    <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Recommendations footer */}
            <div className="mt-3 pt-3 border-t border-border/40 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block flex items-center gap-1">
                <Compass className="h-3 w-3 text-primary" />
                Circadian Hygiene Focus
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                {analysis?.circadian_insight}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SleepTrackerCard;
