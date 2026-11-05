import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Download,
  Trash2,
  Lock,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Sparkles,
  Sliders,
  Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { digitalWellnessAPI } from "@/services/api";

interface ConsentState {
  screen_time_enabled: boolean;
  app_tracking_enabled: boolean;
  web_tracking_enabled: boolean;
  search_tracking_enabled: boolean;
  notification_tracking_enabled: boolean;
  data_retention_days: number;
}

export const PrivacyConsentView: React.FC = () => {
  const [consent, setConsent] = useState<ConsentState>({
    screen_time_enabled: true,
    app_tracking_enabled: true,
    web_tracking_enabled: true,
    search_tracking_enabled: false,
    notification_tracking_enabled: true,
    data_retention_days: 90
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchConsent = async () => {
    try {
      const res = await digitalWellnessAPI.getConsent();
      if (res) {
        setConsent({
          screen_time_enabled: res.screen_time_enabled ?? true,
          app_tracking_enabled: res.app_tracking_enabled ?? true,
          web_tracking_enabled: res.web_tracking_enabled ?? true,
          search_tracking_enabled: res.search_tracking_enabled ?? false,
          notification_tracking_enabled: res.notification_tracking_enabled ?? true,
          data_retention_days: res.data_retention_days ?? 90
        });
      }
    } catch (err) {
      console.error("Failed to load privacy consent settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsent();
  }, []);

  const handleToggle = async (key: keyof ConsentState, value: any) => {
    const updated = { ...consent, [key]: value };
    setConsent(updated);
    try {
      setSaving(true);
      await digitalWellnessAPI.updateConsent(updated);
      setStatusMessage("Settings updated successfully");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error("Failed to update consent:", err);
      setStatusMessage("Error updating settings");
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      const data = await digitalWellnessAPI.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mindguard_wellness_export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export telemetry data:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteData = async () => {
    try {
      setDeleting(true);
      await digitalWellnessAPI.deleteData();
      setConfirmDelete(false);
      setStatusMessage("All telemetry records permanently deleted.");
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error("Failed to purge telemetry:", err);
    } finally {
      setDeleting(false);
    }
  };

  const renderToggle = (
    label: string,
    description: string,
    enabled: boolean,
    onToggle: () => void,
    color = "bg-blue-600"
  ) => {
    return (
      <div className="flex items-center justify-between py-3">
        <div className="pr-4 space-y-0.5">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            enabled ? color : "bg-muted"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Privacy, Consent & Data Ownership
          </h2>
          <p className="text-sm text-muted-foreground">
            Complete transparency &bull; Granular controls &bull; Full data autonomy
          </p>
        </div>
        {statusMessage && (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-3 py-1">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {statusMessage}
          </Badge>
        )}
      </div>

      {/* Transparent Disclosure Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              What MindGuard Collects (Transparently)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">&bull;</span>
              <span><strong>Active screen time & idle periods:</strong> Physical inactivity via OS input hooks to calculate authentic study hours without estimating.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">&bull;</span>
              <span><strong>Foreground application titles:</strong> Process identifiers (e.g. Code.exe, Chrome.exe) and active duration.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">&bull;</span>
              <span><strong>Top-level domains:</strong> Visited websites via the optional browser extension while active.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">&bull;</span>
              <span><strong>Notification counts:</strong> Interruption frequency tallies to measure digital fatigue.</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/10 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              What MindGuard NEVER Collects (Absolute Guarantee)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">&times;</span>
              <span><strong>Zero Keystrokes or Keylogging:</strong> Keystrokes, passwords, clipboard contents, and form inputs are strictly excluded.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">&times;</span>
              <span><strong>Zero Screen Captures:</strong> No screenshots, display recordings, or camera feeds are ever initiated.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">&times;</span>
              <span><strong>Zero Notification or Message Text:</strong> Message bodies, emails, WhatsApp/Slack texts, and OTPs are never inspected.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">&times;</span>
              <span><strong>Zero Private Browsing Access:</strong> Incognito windows are strictly ignored by extension and agent.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Telemetry Feature Controls */}
      <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-500" />
            Telemetry Collection Settings
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Turn specific collection streams on or off at any time. Changes sync automatically to all agents.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border/30 pt-0">
          {renderToggle(
            "Screen Time & Idle Detection",
            "Monitors OS active foreground sessions and physical mouse/keyboard idle thresholds.",
            consent.screen_time_enabled,
            () => handleToggle("screen_time_enabled", !consent.screen_time_enabled)
          )}
          {renderToggle(
            "Application Usage Tracking",
            "Collects process names and foreground window duration categorized into study/leisure.",
            consent.app_tracking_enabled,
            () => handleToggle("app_tracking_enabled", !consent.app_tracking_enabled)
          )}
          {renderToggle(
            "Website & Browser Extension",
            "Logs active tab domain names and visit counts during non-incognito study periods.",
            consent.web_tracking_enabled,
            () => handleToggle("web_tracking_enabled", !consent.web_tracking_enabled)
          )}
          {renderToggle(
            "Academic Search Query Analytics",
            "Logs search terms on Google, Bing, and DuckDuckGo to understand academic inquiry trends. Kept strictly private.",
            consent.search_tracking_enabled,
            () => handleToggle("search_tracking_enabled", !consent.search_tracking_enabled),
            "bg-indigo-600"
          )}
          {renderToggle(
            "Notification Interruption Counting",
            "Counts incoming notifications per application to measure concentration disruptions.",
            consent.notification_tracking_enabled,
            () => handleToggle("notification_tracking_enabled", !consent.notification_tracking_enabled),
            "bg-purple-600"
          )}
        </CardContent>
      </Card>

      {/* Data Retention & Life Cycle */}
      <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Automatic Data Retention
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Configure how long historical activity records are retained before automatic secure purging
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-2">
            {[7, 14, 30, 90, 180, 365].map((days) => (
              <Button
                key={days}
                variant={consent.data_retention_days === days ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggle("data_retention_days", days)}
                className="rounded-xl h-8 text-xs"
              >
                {days} Days
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Records older than {consent.data_retention_days} days are automatically and permanently deleted from the cloud database.
          </p>
        </CardContent>
      </Card>

      {/* Data Export & Deletion Action Row */}
      <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Data Portability & Purge
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            You own 100% of your telemetry. Download a copy in standard JSON format or permanently delete all records.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-0">
          <Button
            variant="outline"
            onClick={handleExportData}
            disabled={exporting}
            className="rounded-xl border-border/60 hover:bg-muted/50 text-xs h-9"
          >
            <Download className={`w-3.5 h-3.5 mr-2 ${exporting ? "animate-bounce" : ""}`} />
            {exporting ? "Generating Export..." : "Export All Telemetry (JSON)"}
          </Button>

          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                onClick={handleDeleteData}
                disabled={deleting}
                className="rounded-xl text-xs h-9"
              >
                {deleting ? "Purging Records..." : "Yes, Permanently Purge Everything"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(false)}
                className="rounded-xl text-xs h-9"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(true)}
              className="rounded-xl border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs h-9"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Delete All Stored Activity Data
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyConsentView;

