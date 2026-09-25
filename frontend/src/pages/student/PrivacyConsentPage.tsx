import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { ConsentSettingsManager } from "@/components/ConsentSettingsManager";
import { 
  ShieldCheck, 
  Eye, 
  Sparkles, 
  Users, 
  CheckCircle2, 
  Lock,
  Download,
  Info
} from "lucide-react";

export const PrivacyConsentPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card/90 to-primary/5 p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Privacy & Consent Governance Center
            </h1>
            <p className="text-xs text-muted-foreground">
              Understand how your wellbeing data is protected, encrypted, and managed across MindGuardAI.
            </p>
          </div>
        </div>
      </div>

      <Alert variant="info" title="Privacy-First Campus Commitment">
        Your wellness data is strictly confidential. Personal reflections and text logs are never shared with academic staff or university administrators. Only licensed university counsellors can view critical triage indicators if escalation consent is enabled.
      </Alert>

      {/* Information Disclosure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center gap-2.5 text-primary mb-3">
            <Eye className="h-4 w-4" />
            <h3 className="text-sm font-bold text-foreground">What We Collect</h3>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <span>Self-reported daily mood, stress, sleep, and energy levels</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <span>Standardized clinical assessments (PHQ-9 and GAD-7)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <span>Aggregated device active time (no keystroke or browser history)</span>
            </li>
          </ul>
        </Card>

        <Card className="rounded-2xl border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center gap-2.5 text-primary mb-3">
            <Sparkles className="h-4 w-4" />
            <h3 className="text-sm font-bold text-foreground">How AI Is Used</h3>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <span>Predictive early-warning trend detection (SHAP explainable factors)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <span>Generates tailored psychoeducation and coping exercises</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <span>Non-diagnostic decision support with licensed human counsellor oversight</span>
            </li>
          </ul>
        </Card>

        <Card className="rounded-2xl border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center gap-2.5 text-primary mb-3">
            <Users className="h-4 w-4" />
            <h3 className="text-sm font-bold text-foreground">Who Has Access</h3>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <span><strong>You:</strong> Complete visibility and export capability</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <span><strong>Counsellors:</strong> Triage queue & support notes when escalated</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <span><strong>Admins:</strong> Anonymized campus-wide statistics only (k-anonymity)</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* Embedded Granular Consent & Immutable Audit History Component */}
      <ConsentSettingsManager />
    </div>
  );
};

export default PrivacyConsentPage;
