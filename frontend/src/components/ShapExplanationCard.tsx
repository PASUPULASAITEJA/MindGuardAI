import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  Info, 
  ArrowUpRight, 
  ArrowDownRight,
  BrainCircuit
} from "lucide-react";
import { 
  predictionsAPI, 
  PredictionShapExplanationResponse, 
  RiskExplanationItem 
} from "@/services/api";

export interface ShapExplanationCardProps {
  predictionId?: string;
  studentId?: string;
  initialExplanation?: PredictionShapExplanationResponse;
  className?: string;
}

export const ShapExplanationCard: React.FC<ShapExplanationCardProps> = ({
  predictionId,
  initialExplanation,
  className = ""
}) => {
  const [data, setData] = useState<PredictionShapExplanationResponse | null>(
    initialExplanation || null
  );
  const [loading, setLoading] = useState<boolean>(Boolean(predictionId && !initialExplanation));
  const [error, setError] = useState<string | null>(null);

  const fetchExplanation = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await predictionsAPI.getShapExplanation(id);
      setData(res);
    } catch (err: any) {
      console.warn("Could not fetch SHAP prediction explanation:", err);
      setError("Unable to load score factors at this moment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialExplanation) {
      setData(initialExplanation);
      setLoading(false);
      return;
    }

    if (predictionId) {
      fetchExplanation(predictionId);
    }
  }, [predictionId, initialExplanation]);

  if (loading) {
    return (
      <Card className={`border-border/40 bg-card/60 backdrop-blur-md shadow-sm ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary animate-pulse">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="h-5 w-56 bg-muted/60 rounded animate-pulse" />
              <div className="h-3.5 w-72 bg-muted/40 rounded animate-pulse" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 w-full bg-muted/40 rounded animate-pulse" />
          <div className="h-14 bg-muted/20 rounded-xl animate-pulse" />
          <div className="h-14 bg-muted/20 rounded-xl animate-pulse" />
          <div className="h-14 bg-muted/20 rounded-xl animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data || !data.top_factors || data.top_factors.length === 0) {
    return (
      <Card className={`border-border/40 bg-card/60 backdrop-blur-md shadow-sm ${className}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Factors that influenced your wellness score
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  SHAP Explainability & Behavioral Insights
                </CardDescription>
              </div>
            </div>
            {predictionId && (
              <button
                onClick={() => fetchExplanation(predictionId)}
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
                title="Refresh factors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl bg-muted/20 border border-border/30 text-center space-y-1.5">
            <Info className="w-5 h-5 mx-auto text-muted-foreground/80" />
            <p className="text-sm text-foreground/80 font-medium">
              Complete your daily reflection or questionnaire to view personal wellness factors.
            </p>
            <p className="text-xs text-muted-foreground">
              These are factors that influenced your wellness score, not diagnosis factors.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Summary line: "Key factors: 1. Journal sentiment (elevated anxiety) ↑, 2. PHQ-9 score ↑, 3. Breathing completion ↓ (protective)"
  const summaryLine = data.top_factors
    .map((factor, idx) => `${idx + 1}. ${factor.feature_name} ${factor.impact_symbol}`)
    .join(", ");

  const maxAbsShap = Math.max(
    ...data.top_factors.map((f) => Math.abs(f.shap_value || 0.01)),
    0.05
  );

  return (
    <Card className={`border-border/40 bg-card/60 backdrop-blur-md shadow-sm overflow-hidden ${className}`}>
      <CardHeader className="pb-3 border-b border-border/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                Factors that influenced your wellness score
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  SHAP Explainability
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Research-backed TreeExplainer feature attributions for your current assessment
              </CardDescription>
            </div>
          </div>
          {predictionId && (
            <button
              onClick={() => fetchExplanation(predictionId)}
              className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh factors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Compact Key Factors Summary Banner */}
        <div className="mt-3 px-3 py-2 rounded-lg bg-muted/30 border border-border/30 flex items-start space-x-2 text-xs">
          <span className="font-semibold text-foreground shrink-0">Key factors:</span>
          <span className="text-muted-foreground leading-relaxed">
            {summaryLine}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3.5">
        <div className="space-y-2.5">
          {data.top_factors.map((factor) => {
            const isProtective = factor.is_protective || factor.direction === "decreasing_risk";
            const absVal = Math.abs(factor.shap_value);
            const pct = Math.min(100, Math.round((absVal / maxAbsShap) * 100));

            return (
              <div
                key={factor.id || factor.rank}
                className={`p-3.5 rounded-xl border transition-all duration-200 ${
                  isProtective
                    ? "bg-emerald-500/[0.04] border-emerald-500/20 hover:border-emerald-500/40"
                    : "bg-amber-500/[0.04] border-amber-500/20 hover:border-amber-500/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2.5">
                    {/* Rank Badge */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isProtective
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {factor.rank}
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {factor.feature_name}
                    </span>
                  </div>

                  {/* Direction Badge */}
                  <div
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${
                      isProtective
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {isProtective ? (
                      <>
                        <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
                        <span>↓ (protective)</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" />
                        <span>↑ Influenced score lower</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Attribution Progress Bar */}
                <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden my-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isProtective ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${Math.max(pct, 15)}%` }}
                  />
                </div>

                {/* Non-Diagnostic Explanatory Description */}
                <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                  {factor.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Mandatory Research & Non-Diagnostic Disclaimer */}
        <div className="pt-2 px-3 py-2.5 rounded-lg bg-muted/20 border border-border/20 flex items-start space-x-2">
          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Clinical & Screening Notice: </span>
            {data.disclaimer || "These are factors that influenced your wellness score, not diagnosis factors."}{" "}
            MindGuardAI uses validated screening frameworks (PHQ-9, GAD-7) and explainable machine learning as supportive tools, not clinical diagnoses.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
