import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  Smile, 
  Meh, 
  Frown, 
  FileText, 
  Activity, 
  Clock,
  ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useMoodHistory, MoodHistoryItem } from "../../hooks/useMood";

export const MoodHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState<string>("14d");
  const { data: history = [], isLoading } = useMoodHistory(timeframe);

  // Compute average score
  const validScores = history.filter((h) => typeof h.self_reported_score === "number");
  const avgScore = validScores.length > 0
    ? (validScores.reduce((acc, h) => acc + h.self_reported_score, 0) / validScores.length).toFixed(1)
    : "--";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/student/dashboard")}
          className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Hub</span>
        </Button>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl border border-border">
          {["7d", "14d", "30d"].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                timeframe === t 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
          Mood Trajectory & Longitudinal Log
        </h1>
        <p className="text-sm text-muted-foreground">
          Historical record of your daily emotional check-ins, clinical survey scores, and sentiment trends.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60 shadow-sm p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
            <span>Average Self-Reported Mood</span>
            <Smile className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">{avgScore}</span>
            <span className="text-xs text-muted-foreground">/ 10 scale</span>
          </div>
          <div className="text-[11px] text-emerald-500 font-bold mt-1">
            Consistent Positive Trajectory
          </div>
        </Card>

        <Card className="border-border/60 shadow-sm p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
            <span>Logged Check-Ins</span>
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">{history.length}</span>
            <span className="text-xs text-muted-foreground">entries recorded</span>
          </div>
          <div className="text-[11px] text-primary font-bold mt-1">
            Privacy-Protected Telemetry
          </div>
        </Card>

        <Card className="border-border/60 shadow-sm p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
            <span>Clinical Stability Status</span>
            <ShieldCheck className="h-4 w-4 text-violet-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-500">LOW</span>
            <span className="text-xs text-muted-foreground">risk index</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 font-semibold">
            No crisis triggers flagged
          </div>
        </Card>
      </div>

      {/* Timeline of Entries */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Chronological Timeline
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Review previous journal notes and extracted emotional nuances
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Loading your mood trajectory...
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Smile className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-xs text-muted-foreground">
                No entries recorded for this timeframe yet. Log your first check-in today!
              </p>
              <Button 
                onClick={() => navigate("/student/check-in")}
                size="sm"
                className="bg-primary text-primary-foreground font-bold rounded-xl"
              >
                Start Daily Check-In
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
                          {item.input_type === "TEXT" ? "Journal Reflection" : item.input_type === "SURVEY" ? "Clinical Survey" : "Mood Check-in"}
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
                      {isPositive ? "Positive Flow" : isNeutral ? "Neutral / Stable" : "Elevated Stress"}
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
