import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft, Lock, EyeOff, Database, Server, UserCheck, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DotGridBackground } from "@/components/ui/DotGridBackground";

export const PrivacyPolicyPage: React.FC = () => {
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
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Privacy-First Architecture
            </Badge>
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            MindBridge AI Privacy Policy
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            Our unwavering commitment to student confidentiality, digital phenotyping transparency, and complete personal data autonomy.
          </p>
          <p className="text-xs text-muted-foreground">
            Effective Date: November 6, 2026 &bull; Version 2.4.0
          </p>
        </div>

        {/* Core Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
            <CardContent className="p-5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <EyeOff className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm">Zero Content Capture</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Zero keystroke logging, zero screenshots, and zero audio recording. Only window titles, aggregate process names, and OS-level idle states are tracked.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
            <CardContent className="p-5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm">End-to-End Encryption</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Device sync payloads are authenticated with unique hardware device tokens and transmitted over TLS 1.3 with AES-256 database encryption at rest.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
            <CardContent className="p-5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm">Student Data Autonomy</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You retain complete control: pause tracking at any moment, toggle browser search indexing, export your records in JSON, or purge your account with one click.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed bg-card/40 backdrop-blur-sm rounded-2xl border border-border/60 p-6 sm:p-8">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" />
              1. Information We Collect
            </h2>
            <p>
              MindBridge AI only captures telemetry necessary for student mental wellness assessment, digital phenotyping, and circadian health insights:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Screen & Session Telemetry:</strong> Device awake intervals, active foreground application interaction, and OS-level physical idle duration (keyboard/mouse inactivity).</li>
              <li><strong>Application Usage:</strong> Process names (e.g., <code className="text-xs bg-muted px-1 py-0.5 rounded">Code.exe</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">chrome.exe</code>) and category mappings (Education, Programming, Entertainment).</li>
              <li><strong>Web Activity (Extension):</strong> Top-level domain names visited (e.g., <code className="text-xs bg-muted px-1 py-0.5 rounded">github.com</code>) without query strings, passwords, or personal message inspection.</li>
              <li><strong>Self-Reported Wellness:</strong> PHQ-9 / GAD-7 screeners, daily check-ins, sleep diaries, and guided cognitive reframer entries.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-500" />
              2. How Telemetry Is Used
            </h2>
            <p>
              Telemetry data is used strictly for clinical decision support, personalized burnout detection, and circadian rhythm balance:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Detecting nocturnal screen exposure past midnight that disrupts restorative REM sleep.</li>
              <li>Correlating intensive coursework bursts with fatigue indicators to suggest timely 20-20-20 eye breaks.</li>
              <li>Enabling campus counseling centers to offer timely, proactive appointments when clinical distress thresholds are reached.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              3. Counselor & Guardian Data Access Boundaries
            </h2>
            <p>
              Counselors only receive aggregated clinical risk scores and high-level behavioral biomarker indicators. Raw search queries and private diary entries are strictly kept private to your account unless an acute emergency crisis protocol is explicitly triggered.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              4. Data Retention and Right to Deletion
            </h2>
            <p>
              By default, detailed activity events are retained for 30 to 90 days according to your privacy settings, after which they are automatically anonymized or purged. You may download a full copy of your data or permanently delete your profile at any time in the Privacy & Consent Center.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              5. Contacting Our Data Protection Officer
            </h2>
            <p>
              For privacy inquiries, audit requests, or university compliance questions, please contact our institutional data protection team at <a href="mailto:privacy@mindguard.ai" className="text-primary hover:underline">privacy@mindguard.ai</a>.
            </p>
          </section>
        </div>

        {/* Footer CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/40">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} MindBridge AI &bull; Student Mental Wellness Platform
          </p>
          <div className="flex items-center gap-3">
            <Link to="/terms">
              <Button variant="link" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                Terms of Service
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

export default PrivacyPolicyPage;
