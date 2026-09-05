import React, { useState } from "react";
import { PhoneCall, AlertTriangle, ShieldCheck, HeartHandshake, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { sosAPI, SOSHelpline } from "@/services/api";

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_HELPLINES: SOSHelpline[] = [
  {
    name: "Tele-MANAS (Govt of India)",
    number: "14416",
    badge: "24/7 Toll-Free",
    description: "National comprehensive tele-mental health services programme of India"
  },
  {
    name: "KIRAN National Helpline",
    number: "1800-599-0019",
    badge: "24/7 Toll-Free",
    description: "Official 24/7 mental health rehabilitation helpline"
  },
  {
    name: "NMIMS Campus Health Clinic",
    number: "+91 22 4235 5555",
    badge: "Campus Medical Desk",
    description: "On-campus emergency medical response and psychologist on duty"
  }
];

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [isDispatching, setIsDispatching] = useState(false);
  const [isDispatched, setIsDispatched] = useState(false);
  const [helplines, setHelplines] = useState<SOSHelpline[]>(DEFAULT_HELPLINES);

  if (!isOpen) return null;

  const handleDispatchCounselorAlert = async () => {
    setIsDispatching(true);
    try {
      const data = await sosAPI.triggerSOS();
      if (data.helplines && data.helplines.length > 0) {
        setHelplines(data.helplines);
      }
      setIsDispatched(true);
      toast({
        title: "Counselor Alert Dispatched",
        description: "Campus counseling staff have been notified with high priority.",
        variant: "destructive",
      });
    } catch (err) {
      toast({
        title: "Alert Failed",
        description: "Could not reach emergency dispatch server. Please dial the numbers directly.",
        variant: "destructive",
      });
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border-2 border-rose-500/50 bg-card p-6 shadow-2xl space-y-5 text-foreground">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-inner">
              <AlertTriangle className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-black text-rose-600 dark:text-rose-400">
                  Emergency Crisis Gateway
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-[10px] font-extrabold text-rose-500 uppercase tracking-widest border border-rose-500/20">
                  SOS Live
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Immediate 24/7 psychological support and campus emergency contact
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Immediate Calming Banner */}
        <div className="p-3.5 rounded-xl border border-rose-200/60 bg-gradient-to-r from-rose-50/80 to-amber-50/80 dark:border-rose-900/40 dark:bg-rose-950/30 text-xs text-rose-900 dark:text-rose-200 flex items-center gap-3">
          <HeartHandshake className="h-5 w-5 text-rose-600 shrink-0" />
          <p className="leading-relaxed">
            <strong>You don't have to carry this alone.</strong> If you feel overwhelmed, in acute pain, or unsafe, please reach out to one of the verified crisis resources below immediately.
          </p>
        </div>

        {/* Priority Counselor Dispatch Button */}
        <div className="p-4 rounded-xl border border-border/80 bg-background/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Direct Campus Counselor Dispatch
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">High-Priority</span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Tapping this button flags your file in the university counselor triage queue with <strong className="text-rose-500">CRITICAL PRIORITY</strong> for immediate staff outreach.
          </p>

          {isDispatched ? (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Counselor Alert Logged. On-duty clinical staff have been notified.</span>
            </div>
          ) : (
            <Button
              onClick={handleDispatchCounselorAlert}
              disabled={isDispatching}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2"
            >
              {isDispatching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Dispatching High-Priority Alert...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  <span>Dispatch Emergency Counselor Alert Now</span>
                </>
              )}
            </Button>
          )}
        </div>

        {/* Direct-Dial Verified Helplines */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
            Direct 24/7 Telephone Helplines
          </span>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {helplines.map((line) => (
              <div
                key={line.number}
                className="p-3 rounded-xl border border-border bg-card/60 hover:bg-accent/30 transition-all flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-xs text-foreground truncate">{line.name}</h5>
                    <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                      {line.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{line.description}</p>
                </div>

                <a
                  href={`tel:${line.number.replace(/\s+/g, '')}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shrink-0 transition-all shadow-sm"
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  <span>{line.number}</span>
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Close Gateway
          </Button>
        </div>
      </div>
    </div>
  );
};
