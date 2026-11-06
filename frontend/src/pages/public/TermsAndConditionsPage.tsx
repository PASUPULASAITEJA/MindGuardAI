import React from "react";
import { Link } from "react-router-dom";
import { FileText, ArrowLeft, AlertTriangle, ShieldCheck, Scale, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DotGridBackground } from "@/components/ui/DotGridBackground";

export const TermsAndConditionsPage: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <DotGridBackground />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 rounded-xl text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
              <Scale className="w-3.5 h-3.5 mr-1" />
              Terms of Service
            </Badge>
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Terms and Conditions
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            Please read these terms carefully before accessing or registering endpoints with the MindGuard AI platform.
          </p>
          <p className="text-xs text-muted-foreground">
            Last Updated: November 6, 2026 &bull; Version 2.2.0
          </p>
        </div>

        {/* Clinical Disclaimer Callout */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed space-y-1">
            <strong className="font-semibold block text-sm">Clinical & Emergency Services Disclaimer</strong>
            <p>
              MindGuard AI is an academic and clinical decision-support platform designed to assist university wellness professionals.
              <strong> It is NOT an emergency response system or a substitute for urgent clinical diagnosis.</strong> If you or someone you know is in immediate life-threatening danger, please contact local emergency services (112 / 911 / 988 Suicide & Crisis Lifeline) or your campus crisis hotline immediately.
            </p>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed bg-card/40 backdrop-blur-sm rounded-2xl border border-border/60 p-6 sm:p-8">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing MindGuard AI, creating a student or counselor account, or installing the MindGuard desktop agent / browser extension, you agree to abide by these Terms and our Privacy Policy. If you do not agree, you must discontinue platform use and uninstall client software.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              2. Permitted Student and Institutional Use
            </h2>
            <p>
              MindGuard AI is provided for enrolled university students, authorized counselors, and designated campus administrators. Users agree to:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Use the platform exclusively on personal or institutional devices owned or authorized by the student.</li>
              <li>Provide accurate university verification credentials during registration.</li>
              <li>Refrain from attempting to reverse engineer, bypass rate limits, or inject fabricated telemetry payloads.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-500" />
              3. Telemetry and Client Monitoring Consent
            </h2>
            <p>
              Installing the desktop agent or browser extension constitutes express opt-in consent to capture foreground application interaction, OS-level physical idle time, and domain visits as specified in our Privacy Policy. You maintain the right to pause monitoring or uninstall agents at any time.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              4. Intellectual Property & Research Rights
            </h2>
            <p>
              All proprietary algorithms, machine learning models (DistilBERT classification, PHQ/GAD correlation engines), and visual interfaces are the intellectual property of the MindGuard AI research team. De-identified statistical metrics may be used for academic validation and research defense.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              5. Governing Law and Dispute Resolution
            </h2>
            <p>
              These Terms are governed by applicable university digital ethics regulations and state law. Institutional disputes are subject to the academic integrity committee guidelines of the partner university.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/40">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} MindGuard AI &bull; NMIMS Capstone Project
          </p>
          <div className="flex items-center gap-3">
            <Link to="/privacy">
              <Button variant="link" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                Privacy Policy
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="rounded-xl bg-primary text-primary-foreground text-xs font-semibold">
                Sign In to Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;
