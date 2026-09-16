import React, { useState } from "react";
import { 
  Shield, 
  ShieldCheck, 
  BookOpen, 
  Moon, 
  BarChart3, 
  CheckCircle2, 
  Sparkles, 
  Lock,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { consentRecordsAPI, UserConsentsSummary } from "@/services/api";

interface OnboardingConsentModalProps {
  isOpen: boolean;
  onCompleted: (summary: UserConsentsSummary) => void;
}

export const OnboardingConsentModal: React.FC<OnboardingConsentModalProps> = ({
  isOpen,
  onCompleted,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [consents, setConsents] = useState<Record<string, boolean>>({
    counselor_access: true,
    journal_sharing: true,
    behavioral_tracking: true,
    anonymous_analytics: false,
  });

  if (!isOpen) return null;

  const toggleConsent = (key: string) => {
    setConsents((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async (preferences: Record<string, boolean>) => {
    setIsSubmitting(true);
    try {
      const summary = await consentRecordsAPI.batchUpdateConsents(preferences);
      toast({
        title: "Preferences Saved",
        description: "Your privacy preferences have been securely recorded.",
        variant: "success",
      });
      onCompleted(summary);
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.response?.data?.message || "Could not save your preferences.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const consentItems = [
    {
      key: "counselor_access",
      title: "Clinical Counselor Access",
      icon: ShieldCheck,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      description:
        "Allows certified campus counselors to view your wellness timeline, monitor active risk tiers, and offer proactive care in emergencies.",
      recommended: true,
    },
    {
      key: "journal_sharing",
      title: "Journal Reflections & NLP Sentiment",
      icon: BookOpen,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      description:
        "Permits multi-modal AI to process journal text for emotional valence and depressive linguistic patterns while masking sensitive PII.",
      recommended: true,
    },
    {
      key: "behavioral_tracking",
      title: "Circadian Rhythm & Telemetry",
      icon: Moon,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      description:
        "Analyzes screen active windows and late-night computer hours (12:00 AM - 5:00 AM) to evaluate sleep schedule disruption.",
      recommended: true,
    },
    {
      key: "anonymous_analytics",
      title: "Anonymized Campus Research Analytics",
      icon: BarChart3,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      description:
        "Shares de-identified, aggregated well-being trends for institutional mental health reporting. Never tied to your student account.",
      recommended: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-card border border-border shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
            <Lock className="w-3.5 h-3.5" />
            Privacy by Design (Consent First)
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground">
            Welcome to MindGuard AI
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            You maintain sovereign ownership of your mental health records. Before beginning your wellness journey, please customize your data-sharing permissions below. You can update these anytime in your Settings.
          </p>
        </div>

        {/* 4 Consent Toggles */}
        <div className="space-y-3">
          {consentItems.map((item) => {
            const Icon = item.icon;
            const isChecked = consents[item.key];
            return (
              <div
                key={item.key}
                onClick={() => toggleConsent(item.key)}
                className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  isChecked
                    ? "border-primary/40 bg-primary/5 shadow-xs"
                    : "border-border/70 bg-card/40 opacity-75 hover:opacity-100"
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${item.bg} ${item.color} mt-0.5`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {item.title}
                      </span>
                      {item.recommended && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                          Recommended
                        </span>
                      )}
                    </div>
                    {/* Custom Toggle Switch */}
                    <div
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        isChecked ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          isChecked ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-[11px] text-muted-foreground text-center sm:text-left">
            Changes are cryptographically logged with append-only audit tracking.
          </p>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleSave(consents)}
              className="flex-1 sm:flex-none text-xs font-semibold rounded-xl h-10 px-4"
            >
              {isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : null}
              Save Custom
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() =>
                handleSave({
                  counselor_access: true,
                  journal_sharing: true,
                  behavioral_tracking: true,
                  anonymous_analytics: false,
                })
              }
              className="flex-1 sm:flex-none text-xs font-bold rounded-xl h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
            >
              {isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
              )}
              Accept Recommended
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
