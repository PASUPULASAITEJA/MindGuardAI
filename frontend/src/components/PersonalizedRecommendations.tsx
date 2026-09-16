import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  recommendationsAPI, 
  PersonalizedRecommendationItem, 
  PersonalizedRecommendationsResponse 
} from "@/services/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Wind, 
  Eye, 
  Moon, 
  BookOpen, 
  PhoneCall, 
  CheckCircle2, 
  ThumbsUp, 
  ArrowRight, 
  RefreshCw, 
  Loader2, 
  HeartHandshake,
  AlertTriangle,
  BrainCircuit,
  Compass
} from "lucide-react";

export const PersonalizedRecommendations: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actingId, setActingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<PersonalizedRecommendationsResponse>({
    queryKey: ["personalized-recommendations"],
    queryFn: () => recommendationsAPI.getPersonalized(),
    staleTime: 5 * 60 * 1000
  });

  const feedbackMutation = useMutation({
    mutationFn: async ({ recId, feedback, status }: { recId: string; feedback?: string; status?: string }) => {
      setActingId(recId);
      return await recommendationsAPI.recordFeedback(recId, { feedback, status });
    },
    onSuccess: (updatedRec) => {
      setActingId(null);
      queryClient.setQueryData<PersonalizedRecommendationsResponse>(
        ["personalized-recommendations"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            recommendations: old.recommendations.map((r) =>
              r.id === updatedRec.id ? { ...r, feedback: updatedRec.feedback, status: updatedRec.status, completed_at: updatedRec.completed_at } : r
            )
          };
        }
      );
    },
    onError: () => {
      setActingId(null);
    }
  });

  const getCategoryMeta = (cat: string) => {
    switch (cat.toUpperCase()) {
      case "BREATHING":
        return {
          icon: <Wind className="h-4 w-4" />,
          color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
          label: "Breathwork"
        };
      case "GROUNDING":
        return {
          icon: <Eye className="h-4 w-4" />,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          label: "Sensory Grounding"
        };
      case "COGNITIVE_REFRAME":
        return {
          icon: <BrainCircuit className="h-4 w-4" />,
          color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
          label: "CBT Reframing"
        };
      case "CRISIS_SUPPORT":
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          label: "Crisis Support"
        };
      case "COUNSELOR_APPOINTMENT":
        return {
          icon: <HeartHandshake className="h-4 w-4" />,
          color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
          label: "Counselor Consultation"
        };
      case "SLEEP_HYGIENE":
        return {
          icon: <Moon className="h-4 w-4" />,
          color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          label: "Sleep Hygiene"
        };
      case "JOURNALING":
      default:
        return {
          icon: <BookOpen className="h-4 w-4" />,
          color: "text-teal-500 bg-teal-500/10 border-teal-500/20",
          label: "Reflective Journaling"
        };
    }
  };

  if (isLoading) {
    return (
      <Card className="wellness-card p-6 shadow-xs border-primary/20 bg-primary/5">
        <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm font-medium">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Synthesizing your personalized self-care recommendations...</span>
        </div>
      </Card>
    );
  }

  if (isError || !data || data.recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="wellness-card overflow-hidden shadow-xs border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardHeader className="pb-4 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="h-4 w-4" />
              </div>
              <CardTitle className="text-base md:text-lg font-black text-foreground tracking-tight">
                AI Personalized Self-Care Interventions
              </CardTitle>
            </div>
            <CardDescription className="text-xs md:text-sm text-muted-foreground">
              {data.rationale}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase border ${
              data.risk_tier === "HIGH" || data.risk_tier === "CRITICAL"
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                : data.risk_tier === "MEDIUM"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            }`}>
              Tier: {data.risk_tier}
            </span>

            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase border bg-primary/10 text-primary border-primary/20">
              State: {data.primary_emotion}
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="Refresh recommendations"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.recommendations.map((rec: PersonalizedRecommendationItem) => {
            const meta = getCategoryMeta(rec.category);
            const isActing = actingId === rec.id;
            const isCompleted = rec.status === "COMPLETED";
            const isHelpful = rec.feedback === "HELPFUL";

            return (
              <div 
                key={rec.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
                  isCompleted 
                    ? "bg-muted/20 border-border/50 opacity-85" 
                    : "bg-card border-border/70 hover:border-primary/40 shadow-2xs"
                }`}
              >
                <div className="space-y-2.5">
                  {/* Category Pill */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${meta.color}`}>
                      {meta.icon}
                      {meta.label}
                    </span>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className={`text-sm font-bold text-foreground ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                      {rec.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-3">
                      {rec.description}
                    </p>
                  </div>

                  {/* Clinical Reason */}
                  {rec.reason && (
                    <div className="p-2 rounded-lg bg-muted/40 border border-border/50 text-[11px] text-muted-foreground/90 italic flex items-start gap-1.5">
                      <Compass className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                      <span>{rec.reason}</span>
                    </div>
                  )}
                </div>

                {/* Actions Row */}
                <div className="pt-4 mt-3 border-t border-border/40 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant={isCompleted ? "outline" : "default"}
                    onClick={() => {
                      if (rec.action_url.startsWith("http")) {
                        window.open(rec.action_url, "_blank");
                      } else {
                        navigate(rec.action_url);
                      }
                    }}
                    className="h-8 text-xs font-bold gap-1.5 flex-1"
                  >
                    <span>Launch</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isActing}
                      onClick={() => feedbackMutation.mutate({ 
                        recId: rec.id, 
                        feedback: isHelpful ? undefined : "HELPFUL" 
                      })}
                      className={`h-8 px-2 text-xs gap-1 rounded-lg ${
                        isHelpful 
                          ? "text-primary bg-primary/10 border border-primary/20" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title={isHelpful ? "Marked as helpful" : "Helpful recommendation"}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isActing}
                      onClick={() => feedbackMutation.mutate({ 
                        recId: rec.id, 
                        status: isCompleted ? "ACTIVE" : "COMPLETED" 
                      })}
                      className={`h-8 px-2 text-xs gap-1 rounded-lg ${
                        isCompleted 
                          ? "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title={isCompleted ? "Mark active" : "Mark completed"}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalizedRecommendations;
