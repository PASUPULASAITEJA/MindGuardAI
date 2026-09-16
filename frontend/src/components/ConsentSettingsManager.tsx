import React, { useState, useEffect } from "react";
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  BookOpen, 
  Moon, 
  BarChart3, 
  History, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Lock, 
  ChevronDown, 
  ChevronUp,
  Info
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { 
  consentRecordsAPI, 
  UserConsentsSummary, 
  ConsentRecordHistoryItem 
} from "@/services/api";

export const ConsentSettingsManager: React.FC = () => {
  const { toast } = useToast();
  const [consents, setConsents] = useState<UserConsentsSummary | null>(null);
  const [history, setHistory] = useState<ConsentRecordHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchConsents = async () => {
    try {
      const data = await consentRecordsAPI.getConsents();
      setConsents(data);
    } catch (err) {
      console.error("Failed to load consent settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await consentRecordsAPI.getHistory(50);
      setHistory(data.history);
    } catch (err) {
      toast({
        title: "History Unavailable",
        description: "Could not retrieve the consent audit history.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, []);

  const handleToggle = async (consentType: string, currentVal: boolean) => {
    setIsUpdating(consentType);
    const targetVal = !currentVal;
    try {
      const updated = await consentRecordsAPI.updateConsent(consentType, targetVal);
      setConsents(updated);
      toast({
        title: targetVal ? "Consent Granted" : "Consent Revoked",
        description: `Your preference for ${consentType.replace(/_/g, " ")} has been updated.`,
        variant: targetVal ? "success" : "warning",
      });
      // If history is open, refresh it
      if (isHistoryOpen) {
        fetchHistory();
      }
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.response?.data?.message || "Could not change consent status.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const toggleHistoryDropdown = () => {
    if (!isHistoryOpen && history.length === 0) {
      fetchHistory();
    }
    setIsHistoryOpen(!isHistoryOpen);
  };

  if (isLoading) {
    return (
      <Card className="border-border/70 bg-card/50 backdrop-blur-md">
        <CardContent className="p-8 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-medium">
            Loading privacy & consent policies...
          </p>
        </CardContent>
      </Card>
    );
  }

  const consentConfig = [
    {
      key: "counselor_access",
      title: "Clinical Counselor Access",
      icon: ShieldCheck,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      description:
        "Authorizes certified counselors to review your longitudinal wellness scores, active alert flags, and case profile for proactive clinical support.",
      active: consents?.counselor_access ?? false,
    },
    {
      key: "journal_sharing",
      title: "Journal Reflections & AI NLP Sentiment",
      icon: BookOpen,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      description:
        "Allows natural language processing on daily journal entries to detect emotional valence and stress indicators with automated PII masking.",
      active: consents?.journal_sharing ?? false,
    },
    {
      key: "behavioral_tracking",
      title: "Circadian Rhythm & Telemetry",
      icon: Moon,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      description:
        "Analyzes screen active windows and nocturnal screen time (12:00 AM - 5:00 AM) to evaluate sleep schedule disruption.",
      active: consents?.behavioral_tracking ?? false,
    },
    {
      key: "anonymous_analytics",
      title: "Anonymous Campus Analytics",
      icon: BarChart3,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      description:
        "Shares de-identified, aggregated well-being trends for campus health research. Never linked to your student identity.",
      active: consents?.anonymous_analytics ?? false,
    },
  ];

  return (
    <Card className="border-border/70 bg-card/50 backdrop-blur-md relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-foreground text-sm md:text-base font-bold flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-primary" />
              Granular Consent & Privacy Controls
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Control the 4 data surfaces powering MindGuard AI. Changes are append-only and cryptographically logged.
            </CardDescription>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0 self-start sm:self-auto">
            <Lock className="w-3 h-3" />
            Append-Only Audit
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 4 Consent Cards */}
        <div className="space-y-3">
          {consentConfig.map((item) => {
            const Icon = item.icon;
            const isChecked = item.active;
            const isUpdatingCurrent = isUpdating === item.key;

            return (
              <div
                key={item.key}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isChecked
                    ? "border-primary/40 bg-primary/5 shadow-xs"
                    : "border-border/70 bg-card/40"
                }`}
              >
                <div className="flex items-start gap-3.5 max-w-xl">
                  <div className={`p-2 rounded-xl shrink-0 ${item.bg} ${item.color} mt-0.5`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-foreground">
                        {item.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isChecked
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {isChecked ? "Active Grant" : "Revoked"}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Switch Toggle */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    disabled={Boolean(isUpdating)}
                    onClick={() => handleToggle(item.key, isChecked)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isChecked ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        isChecked ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  {isUpdatingCurrent && (
                    <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Append-Only Consent History Dropdown */}
        <div className="pt-2 border-t border-border/70">
          <button
            type="button"
            onClick={toggleHistoryDropdown}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-accent/20 transition-colors text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Immutable Consent Decision History (Append-Only)
            </span>
            {isHistoryOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {isHistoryOpen && (
            <div className="mt-2 space-y-2 p-3 rounded-xl bg-muted/20 border border-border/60">
              {isLoadingHistory ? (
                <div className="py-4 text-center">
                  <RefreshCw className="w-4 h-4 text-primary animate-spin mx-auto" />
                  <p className="text-[11px] text-muted-foreground mt-1">Retrieving audit log...</p>
                </div>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No historical changes recorded yet.
                </p>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-1.5 divide-y divide-border/30">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="pt-1.5 first:pt-0 flex items-center justify-between text-[11px] text-muted-foreground gap-2"
                    >
                      <div className="flex items-center gap-2">
                        {h.granted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        )}
                        <span className="font-semibold text-foreground">
                          {h.consent_type.replace(/_/g, " ")}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          h.granted ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                        }`}>
                          {h.granted ? "GRANTED" : "REVOKED"}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span>{new Date(h.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        {h.ip_address && (
                          <span className="font-mono text-[10px] ml-2 text-muted-foreground/70">
                            IP: {h.ip_address}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Informational Policy Note */}
        <div className="p-3 rounded-xl bg-accent/20 border border-border/70 flex items-start gap-2.5 text-xs text-muted-foreground">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>
            <strong className="text-foreground">Privacy Guarantee:</strong> MindGuard AI respects student autonomy. Revoking consent immediately blocks server endpoints from serving or processing the respective data category.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
