import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { 
  Brain, Moon, FileSpreadsheet, ShieldCheck, Sparkles, Info, AlertTriangle, 
  TrendingDown, TrendingUp, Minus, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw, Activity
} from "lucide-react";
import { predictionsAPI, PredictionExplanationResponse, RiskFactorItem } from "@/services/api";

export interface ExplainableAIFactorsProps {
  studentId?: string;
  explanation?: PredictionExplanationResponse;
  wellnessScore?: number;
  riskLevel?: string;
  lateNightMins?: number;
  totalScreenMins?: number;
  sentimentScore?: number;
  hasAssessment?: boolean;
  surveyScore?: number;
  className?: string;
}

export const ExplainableAIFactors: React.FC<ExplainableAIFactorsProps> = ({
  studentId,
  explanation: initialExplanation,
  wellnessScore = 50,
  riskLevel = "LOW",
  lateNightMins = 0,
  totalScreenMins = 0,
  sentimentScore = 0,
  hasAssessment = false,
  surveyScore,
  className = "",
}) => {
  const [explanationData, setExplanationData] = useState<PredictionExplanationResponse | null>(initialExplanation || null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(studentId && !initialExplanation));
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (initialExplanation) {
      setExplanationData(initialExplanation);
      setIsLoading(false);
      return;
    }

    if (!studentId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setFetchError(null);

    predictionsAPI.getRiskExplanation(studentId)
      .then((data) => {
        if (isMounted) {
          setExplanationData(data);
          setIsLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          const detail = err.response?.data?.detail;
          if (err.response?.status === 403 || (typeof detail === "string" && detail.includes("Consent revoked"))) {
            setFetchError("Student clinical sharing consent is not active.");
          } else {
            setFetchError(err.response?.data?.message || "Could not fetch dynamic risk factors.");
          }
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [studentId, initialExplanation]);

  // If loading live explanation
  if (isLoading) {
    return (
      <Card className={`shadow-sm border-border/80 ${className}`}>
        <CardContent className="p-8 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-medium">
            Synthesizing multi-modal risk factors and longitudinal trends...
          </p>
        </CardContent>
      </Card>
    );
  }

  // If live explanation API data is available
  if (explanationData) {
    const { current_risk_tier, current_wellness_score, trend_summary, top_factors } = explanationData;

    // Severity color helper
    const getSeverityBadge = (severity: string) => {
      switch (severity) {
        case "CRITICAL":
          return "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40";
        case "HIGH":
          return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
        case "MEDIUM":
          return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
        case "LOW":
          return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
        case "POSITIVE":
          return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
        default:
          return "bg-muted text-muted-foreground border-border";
      }
    };

    const getProgressBarColor = (severity: string) => {
      switch (severity) {
        case "CRITICAL":
          return "bg-rose-600";
        case "HIGH":
          return "bg-rose-500";
        case "MEDIUM":
          return "bg-amber-500";
        case "LOW":
          return "bg-blue-500";
        case "POSITIVE":
          return "bg-emerald-500";
        default:
          return "bg-primary";
      }
    };

    const getRiskTierBadge = (tier: string) => {
      switch (tier) {
        case "CRITICAL":
          return {
            label: "CRITICAL RISK",
            className: "bg-rose-600 text-white animate-pulse shadow-md shadow-rose-500/20",
            icon: AlertTriangle,
          };
        case "HIGH":
          return {
            label: "HIGH RISK",
            className: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30",
            icon: ShieldAlert,
          };
        case "MEDIUM":
          return {
            label: "MEDIUM RISK",
            className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
            icon: AlertCircle,
          };
        default:
          return {
            label: "LOW RISK",
            className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
            icon: CheckCircle2,
          };
      }
    };

    const tierBadge = getRiskTierBadge(current_risk_tier);
    const TierIcon = tierBadge.icon;

    const renderTrendPill = (dir: string, delta: number) => {
      if (dir === "IMPROVING") {
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <TrendingUp className="w-3 h-3" />
            +{Math.abs(delta).toFixed(1)} pts (Improving)
          </span>
        );
      }
      if (dir === "DECLINING") {
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
            <TrendingDown className="w-3 h-3" />
            -{Math.abs(delta).toFixed(1)} pts (Declining)
          </span>
        );
      }
      if (dir === "STABLE") {
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
            <Minus className="w-3 h-3" />
            Stable (±{Math.abs(delta).toFixed(1)} pts)
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
          Insufficient Data
        </span>
      );
    };

    return (
      <Card className={`shadow-sm border-border/80 ${className}`}>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2 flex-wrap">
                  Unified Explainable AI Factors
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${tierBadge.className}`}>
                    <TierIcon className="w-3 h-3" />
                    {tierBadge.label}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Multi-modal diagnostic breakdown synthesized from mood check-ins, journal NLP, circadian patterns, and assessments.
                </CardDescription>
              </div>
            </div>
            <div className="text-right shrink-0 bg-accent/30 sm:bg-transparent p-2 sm:p-0 rounded-xl">
              <div className="text-xs text-muted-foreground font-semibold">Current Wellness Score</div>
              <div className="text-xl font-black text-foreground">
                {current_wellness_score.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">/ 100</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* (b) 7/30-Day Trend Summary Banner */}
          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/70 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-primary" />
                Longitudinal Trajectory
              </span>
              <span className="text-[11px] font-normal text-muted-foreground">
                Evaluated: {new Date(explanationData.evaluated_at).toLocaleDateString()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 7-day card */}
              <div className="p-2.5 rounded-xl bg-card border border-border/60 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-muted-foreground">Last 7 Days:</span>
                  {renderTrendPill(trend_summary.summary_7d.direction, trend_summary.summary_7d.wellness_delta)}
                </div>
                <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                  <span>Avg Wellness: {trend_summary.summary_7d.average_wellness.toFixed(1)}/100</span>
                  <span>{trend_summary.summary_7d.mood_logs_count} mood log(s)</span>
                </div>
                {trend_summary.summary_7d.crisis_flags_count > 0 && (
                  <div className="text-[11px] font-bold text-rose-500 flex items-center gap-1 pt-0.5">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    {trend_summary.summary_7d.crisis_flags_count} active crisis flag(s) detected
                  </div>
                )}
              </div>

              {/* 30-day card */}
              <div className="p-2.5 rounded-xl bg-card border border-border/60 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-muted-foreground">Last 30 Days:</span>
                  {renderTrendPill(trend_summary.summary_30d.direction, trend_summary.summary_30d.wellness_delta)}
                </div>
                <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                  <span>Avg Wellness: {trend_summary.summary_30d.average_wellness.toFixed(1)}/100</span>
                  <span>
                    {trend_summary.summary_30d.average_sentiment !== null && trend_summary.summary_30d.average_sentiment !== undefined
                      ? `Sentiment: ${trend_summary.summary_30d.average_sentiment > 0 ? "+" : ""}${trend_summary.summary_30d.average_sentiment.toFixed(2)}`
                      : `${trend_summary.summary_30d.assessments_count} assessment(s)`}
                  </span>
                </div>
                {trend_summary.summary_30d.average_mood_score !== null && trend_summary.summary_30d.average_mood_score !== undefined && (
                  <div className="text-[11px] text-muted-foreground pt-0.5">
                    Average Check-in Mood: {trend_summary.summary_30d.average_mood_score.toFixed(1)} / 10
                  </div>
                )}
              </div>
            </div>

            {/* AI Synthesized Headline */}
            <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2 text-xs text-foreground">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span className="leading-snug">
                <strong>Clinical Summary:</strong> {trend_summary.headline}
              </span>
            </div>
          </div>

          {/* (c) Top 5 Synthesized Factors */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                Top 5 Key Factors
              </h4>
              <span className="text-[11px] text-muted-foreground">Ordered by Diagnostic Influence</span>
            </div>

            <div className="space-y-2.5">
              {top_factors.map((factor: RiskFactorItem, idx: number) => {
                const isPositive = factor.severity === "POSITIVE";
                return (
                  <div 
                    key={factor.id || idx} 
                    className="p-3 rounded-2xl bg-card border border-border/70 hover:border-primary/30 transition-all space-y-2 shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                          {factor.name}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(factor.severity)}`}>
                          {factor.severity}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                          {factor.category.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className={`font-black text-xs shrink-0 ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                        +{factor.impact_pct}% {isPositive ? "Protection" : "Impact"}
                      </span>
                    </div>

                    {/* Progress Impact Bar */}
                    <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(factor.severity)}`}
                        style={{ width: `${Math.min(100, factor.impact_pct * 2.2)}%` }}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-muted-foreground">
                      <p className="leading-relaxed text-foreground/80">{factor.description}</p>
                      {factor.source_metric && (
                        <span className="text-[10px] font-mono text-muted-foreground/80 shrink-0 self-start sm:self-auto bg-muted/40 px-1.5 py-0.5 rounded">
                          {factor.source_metric}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Informational Guidance Note */}
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex items-start gap-2 text-[11px] text-muted-foreground">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              <strong className="text-foreground">Clinical Explainability:</strong> MindGuard AI's multi-modal predictive model dynamically weights circadian sleep disruption, reflective linguistic sentiment, self-reported scores, and crisis signals to maintain transparency.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Fallback Mode: Telemetry-driven Rule-based calculation if API is unavailable ---
  const circadianRisk = lateNightMins > 60 ? 32 : lateNightMins > 15 ? 18 : 6;
  const linguisticRisk = sentimentScore < -0.3 ? 38 : sentimentScore < 0.1 ? 22 : 8;
  const surveyRisk = surveyScore !== undefined 
    ? (surveyScore > 14 ? 34 : surveyScore > 9 ? 22 : 12)
    : 16;
  const protectiveBuffer = (totalScreenMins > 0 && lateNightMins < 60) ? 16 : 8;

  return (
    <Card className={`shadow-sm border-border/80 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                What Affects Your Wellness Score
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary tracking-wide">
                  Key Factors
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Clear breakdown of the daily habits and check-ins that shape your {hasAssessment ? `${(typeof wellnessScore === "number" && !isNaN(wellnessScore) ? wellnessScore : 50).toFixed(1)}/100` : "--"} wellness score
              </CardDescription>
            </div>
          </div>
          {fetchError && (
            <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
              {fetchError}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3.5">
        {/* Factor 1: Late-night screen use */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Moon className="h-3.5 w-3.5 text-indigo-400" />
              Late-Night Screen Time & Sleep
            </span>
            <span className={`font-bold ${circadianRisk > 25 ? "text-rose-500" : "text-amber-500"}`}>
              +{circadianRisk}% Impact
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                circadianRisk > 25 ? "bg-rose-500" : "bg-amber-500"
              }`}
              style={{ width: `${circadianRisk * 2.5}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {lateNightMins > 60
              ? `${lateNightMins} mins of screen activity logged after 1:00 AM. Staying up late disrupts deep sleep.`
              : lateNightMins > 0
              ? `${lateNightMins} mins of late-night screen time. Mild impact on your sleep schedule.`
              : "Great sleep habits! No late-night screen disruption detected."}
          </p>
        </div>

        {/* Factor 2: Journal Mood */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Mood in Your Daily Journals
            </span>
            <span className={`font-bold ${linguisticRisk > 25 ? "text-rose-500" : "text-emerald-500"}`}>
              +{linguisticRisk}% Influence
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                linguisticRisk > 25 ? "bg-rose-500" : "bg-emerald-500"
              }`}
              style={{ width: `${linguisticRisk * 2.2}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {sentimentScore < -0.3
              ? "Recent journal entries suggest you may be feeling overwhelmed or down. Taking some rest or talking to a counselor can help."
              : sentimentScore < 0.1
              ? "Your journal entries reflect normal everyday stress and typical student workload."
              : "Your journal entries reflect positive feelings, balance, and optimism."}
          </p>
        </div>

        {/* Factor 3: Survey Responses */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <FileSpreadsheet className="h-3.5 w-3.5 text-blue-400" />
              Well-Being Survey Responses
            </span>
            <span className="font-bold text-blue-500">
              +{surveyRisk}% Baseline
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${surveyRisk * 2.5}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {surveyScore !== undefined
              ? "Based on your completed student well-being assessment responses."
              : "Based on standard student well-being questionnaires (PHQ-9 & GAD-7)."}
          </p>
        </div>

        {/* Factor 4: Healthy Focus & Habits */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Healthy Daytime Focus & Self-Care
            </span>
            <span className="font-bold text-emerald-500">
              +{protectiveBuffer}% Protection
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${protectiveBuffer * 4}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {totalScreenMins > 0 && lateNightMins < 60
              ? "Active daytime study sessions and healthy breaks help protect your mental well-being."
              : "Setting regular study hours and taking short breaks helps you stay refreshed and relaxed."}
          </p>
        </div>

        {/* Informational Note */}
        <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex items-start gap-2 text-[11px] text-muted-foreground">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>
            <strong className="text-foreground">How this works:</strong> Your score combines your sleep patterns, journal reflections, survey check-ins, and study habits to provide an honest, personalized view of your overall wellness.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
