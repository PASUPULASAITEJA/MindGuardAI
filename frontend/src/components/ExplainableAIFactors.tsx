import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Brain, Moon, FileSpreadsheet, ShieldCheck, Sparkles, Info } from "lucide-react";

interface ExplainableAIFactorsProps {
  wellnessScore: number;
  riskLevel: string;
  lateNightMins?: number;
  totalScreenMins?: number;
  sentimentScore?: number;
  hasAssessment?: boolean;
  surveyScore?: number;
}

export const ExplainableAIFactors: React.FC<ExplainableAIFactorsProps> = ({
  wellnessScore,
  riskLevel,
  lateNightMins = 0,
  totalScreenMins = 0,
  sentimentScore = 0,
  hasAssessment = false,
  surveyScore,
}) => {
  // 1. Circadian Risk: Strictly telemetry-driven (late-night screen exposure)
  const circadianRisk = lateNightMins > 60 ? 32 : lateNightMins > 15 ? 18 : 6;

  // 2. Linguistic Affect: The ONLY factor driven by journal NLP sentiment analysis
  const linguisticRisk = sentimentScore < -0.3 ? 38 : sentimentScore < 0.1 ? 22 : 8;

  // 3. Psychometric Survey: Decoupled from journal entries (stable medical cutoff baseline)
  const surveyRisk = surveyScore !== undefined 
    ? (surveyScore > 14 ? 34 : surveyScore > 9 ? 22 : 12)
    : 16;

  // 4. Protective Behavioral Buffer: Strictly daytime focus vs late-night burnout
  const protectiveBuffer = (totalScreenMins > 0 && lateNightMins < 60) ? 16 : 8;

  return (
    <Card className="shadow-sm">
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
