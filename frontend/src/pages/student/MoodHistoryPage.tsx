import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  Smile, 
  Activity, 
  Clock,
  ShieldCheck,
  Moon,
  Zap,
  BookOpen,
  HeartHandshake,
  Info,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMoodHistory } from "@/hooks/useMood";
import { useLatestAssessment, useWellnessTrends } from "@/hooks/usePredictions";
import { Alert } from "@/components/ui/alert";
import WellnessTrendDashboard from "@/components/WellnessTrendDashboard";

export const MoodHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d" | "180d">("30d");
  const { data: history = [], isLoading } = useMoodHistory(timeframe);
  const { data: latestAssessment } = useLatestAssessment();
  const { data: trendData } = useWellnessTrends(timeframe);

  // Compute average score
  const validScores = history.filter((h) => typeof h.self_reported_score === "number");
  const numAvg = validScores.length > 0
    ? validScores.reduce((acc, h) => acc + h.self_reported_score, 0) / validScores.length
    : (trendData?.summary?.average_wellness_score && trendData.summary.average_wellness_score > 0 ? trendData.summary.average_wellness_score / 10 : null);
  const avgScore = numAvg !== null ? numAvg.toFixed(1) : "—";

  // Baseline calibration
  const isBaselineNormal = numAvg === null || numAvg >= 6.0;

  const baseline = trendData?.baseline;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/student/dashboard")}
          className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl border border-border">
          {[
            { key: "7d", label: "7D" },
            { key: "30d", label: "30D" },
            { key: "90d", label: "3M" },
            { key: "180d", label: "6M" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTimeframe(t.key as any)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                timeframe === t.key 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
          My Wellbeing Analytics & Trajectory
        </h1>
        <p className="text-sm text-muted-foreground">
          Longitudinal view of your emotional health, multidimensional baselines, and chronological campus wellness events.
        </p>
      </div>

      {/* Personal Baseline Range Notice */}
      <Alert variant="info" title="Personal Historical Baseline">
        {baseline?.summary_message || (
          isBaselineNormal
            ? "Your recent wellbeing indicators are within your typical historical range. Regular sleep habits and daily check-ins help maintain this balance."
            : "Your recent stress and fatigue indicators are currently elevated compared to your typical baseline. Consider exploring calming exercises or booking a chat with a campus counselor."
        )}
      </Alert>

      {/* Multidimensional Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Mood Index</span>
            <Smile className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-foreground font-mono">
            {baseline?.recent_mood_score ? `${baseline.recent_mood_score}` : avgScore}
            {avgScore !== "—" && <span className="text-xs font-normal text-muted-foreground">/10</span>}
          </p>
          <span className="text-[10px] font-bold text-muted-foreground">
            {baseline?.usual_mood_score ? `Usual: ${baseline.usual_mood_score}/10` : "Self-Reported"}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Stress Level</span>
            <Activity className="h-3.5 w-3.5 text-indigo-500" />
          </div>
          <p className="text-xl font-black text-foreground font-mono">
            {baseline?.recent_stress !== undefined && baseline?.recent_stress !== null ? `${baseline.recent_stress}/10` : "—"}
          </p>
          <span className="text-[10px] font-bold text-muted-foreground">
            {baseline?.usual_stress ? `Usual: ${baseline.usual_stress}/10` : "Check-in Trajectory"}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sleep Hours</span>
            <Moon className="h-3.5 w-3.5 text-purple-500" />
          </div>
          <p className="text-xl font-black text-foreground font-mono">
            {baseline?.recent_sleep_hours !== undefined && baseline?.recent_sleep_hours !== null ? `${baseline.recent_sleep_hours} hrs` : "—"}
          </p>
          <span className="text-[10px] font-bold text-muted-foreground">
            {baseline?.usual_sleep_hours ? `Usual: ${baseline.usual_sleep_hours}h` : "Logged Sleep"}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Assessments</span>
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-500" />
          </div>
          <p className="text-xl font-black text-foreground font-mono">
            {latestAssessment?.mental_wellness_score ? `${Number(latestAssessment.mental_wellness_score).toFixed(0)}/100` : "—"}
          </p>
          <span className="text-[10px] font-bold text-muted-foreground">
            {latestAssessment?.risk_level ? `Risk: ${latestAssessment.risk_level}` : "Clinical Psychometric"}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Confidence</span>
            <Zap className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <p className="text-xl font-black text-foreground font-mono">
            {baseline?.baseline_confidence || "ESTABLISHING"}
          </p>
          <span className="text-[10px] font-bold text-muted-foreground">
            {baseline?.observations_count ? `${baseline.observations_count} observations` : "Active Calibration"}
          </span>
        </div>
      </div>
      
      {/* Wellness Trend Visualizer */}
      <WellnessTrendDashboard />

      {/* Chronological Longitudinal Timeline of Events */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Chronological Wellbeing Timeline
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Key milestones, daily check-ins, clinical assessments, and self-care engagements
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Loading your timeline...
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Smile className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-xs text-muted-foreground">
                No entries recorded for this timeframe yet.
              </p>
              <Button 
                onClick={() => navigate("/student/check-in")}
                size="sm"
                className="bg-primary text-primary-foreground font-bold rounded-xl"
              >
                Log Check-In
              </Button>
            </div>
          ) : (
            history.map((item, idx) => {
              const dateObj = new Date(item.logged_at);
              const formattedDate = dateObj.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              const formattedTime = dateObj.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              });

              const score = item.self_reported_score || 7;
              const isPositive = score >= 7;
              const isNeutral = score >= 5 && score < 7;

              return (
                <div 
                  key={item.id || idx}
                  className="p-4 rounded-xl border border-border/70 bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      isPositive 
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                        : isNeutral 
                        ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" 
                        : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                    }`}>
                      {score}/10
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {item.input_type === "TEXT" ? "Journal Reflection" : item.input_type === "SURVEY" ? "Clinical Assessment Completed" : "Daily Check-In"}
                        </span>
                        {item.primary_emotion && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                            {item.primary_emotion}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span>{formattedDate}</span>
                        <span>•</span>
                        <span>{formattedTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      isPositive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                      isNeutral ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                      "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}>
                      {isPositive ? "Optimal State" : isNeutral ? "Stable Baseline" : "Elevated Strain"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MoodHistoryPage;
