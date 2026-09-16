import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, ShieldAlert, Check, X, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { consentAPI, ConsentRecord } from "@/services/api";

interface ConsentBannerProps {
  onConsentChange?: (newConsent: ConsentRecord) => void;
  showAlways?: boolean;
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({ onConsentChange, showAlways = false }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { data: consent, isLoading, refetch } = useQuery({
    queryKey: ["my-consent"],
    queryFn: consentAPI.getMyConsent,
    staleTime: 10000,
  });

  const handleGrant = async () => {
    setIsActionLoading(true);
    try {
      const res = await consentAPI.grantConsent();
      toast({
        title: "Consent Granted",
        description: "Counselors are now authorized to view your wellness trends and case file.",
        variant: "success",
      });
      await queryClient.invalidateQueries({ queryKey: ["my-consent"] });
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
      await queryClient.invalidateQueries({ queryKey: ["behavioral-summary"] });
      await refetch();
      if (onConsentChange) onConsentChange(res.consent);
    } catch (err) {
      toast({
        title: "Action Failed",
        description: "Could not grant consent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDecline = async () => {
    setIsActionLoading(true);
    try {
      const res = await consentAPI.declineConsent();
      toast({
        title: "Consent Declined",
        description: "Counselors will remain blocked from accessing your personal data.",
        variant: "warning",
      });
      await queryClient.invalidateQueries({ queryKey: ["my-consent"] });
      await refetch();
      if (onConsentChange) onConsentChange(res.consent);
    } catch (err) {
      toast({
        title: "Action Failed",
        description: "Could not decline consent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading || !consent) {
    return null;
  }

  // If consent is already GRANTED or REVOKED, do not show on dashboard unless showAlways=true
  if (consent.status !== "PENDING" && !showAlways) {
    return null;
  }

  const isPending = consent.status === "PENDING";
  const isGranted = consent.status === "GRANTED";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all shadow-md ${
        isPending
          ? "border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/20 text-foreground"
          : isGranted
          ? "border-emerald-500/30 bg-emerald-500/5 text-foreground"
          : "border-rose-500/30 bg-rose-500/5 text-foreground"
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 max-w-2xl">
          <div
            className={`mt-0.5 p-2 rounded-xl shrink-0 ${
              isPending
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                : isGranted
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
            }`}
          >
            {isPending ? (
              <ShieldAlert className="h-5 w-5 animate-bounce" />
            ) : isGranted ? (
              <Shield className="h-5 w-5" />
            ) : (
              <Lock className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-extrabold tracking-tight">
                {isPending
                  ? "Action Required: Campus Clinical Data Consent"
                  : isGranted
                  ? "Clinical Consent Active (Granted)"
                  : "Clinical Consent Inactive (Declined / Revoked)"}
              </h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isPending
                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40"
                    : isGranted
                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40"
                    : "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40"
                }`}
              >
                {consent.status}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
              {isPending
                ? "MindGuard is a consent-first platform. Please choose whether to authorize certified university counselors to review your wellness assessments, emotional mapping, chat history, and behavioral telemetry."
                : isGranted
                ? "Your counselors have authorized access to support your wellbeing. You can revoke this permission anytime."
                : "Counselors are currently prohibited from accessing your wellness records, journal evaluation, or behavioral telemetry."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          {isPending ? (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={isActionLoading}
                onClick={handleDecline}
                className="h-9 px-3 text-xs font-semibold border-border/80 hover:bg-rose-500/10 hover:text-rose-600 gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                Decline
              </Button>
              <Button
                size="sm"
                disabled={isActionLoading}
                onClick={handleGrant}
                className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
              >
                <Check className="h-3.5 w-3.5" />
                Grant Consent
              </Button>
            </>
          ) : isGranted ? (
            <Button
              size="sm"
              variant="outline"
              disabled={isActionLoading}
              onClick={handleDecline}
              className="h-9 px-3 text-xs font-semibold border-rose-500/30 text-rose-600 hover:bg-rose-500/10 gap-1.5"
            >
              <Lock className="h-3.5 w-3.5" />
              Revoke Consent
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={isActionLoading}
              onClick={handleGrant}
              className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
            >
              <Check className="h-3.5 w-3.5" />
              Grant Consent
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
export default ConsentBanner;
