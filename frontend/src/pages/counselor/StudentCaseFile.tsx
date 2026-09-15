import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, Shield, ShieldAlert, BarChart3, Calendar, AlertTriangle, 
  HeartPulse, Activity, User, Clock, FileText, ChevronDown, ChevronUp,
  RefreshCw, CheckCircle2, Lock
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { casefileAPI, StudentCasefile, CasefileTimelineEvent } from "@/services/api";

export const StudentCaseFile: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [casefile, setCasefile] = useState<StudentCasefile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConsentRevoked, setIsConsentRevoked] = useState(false);
  const [timeframe, setTimeframe] = useState<string>("90");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});

  const fetchCasefile = async () => {
    if (!studentId) return;
    setIsLoading(true);
    setIsConsentRevoked(false);
    try {
      const data = await casefileAPI.getStudentCasefile(studentId, timeframe);
      setCasefile(data);
      if (data.student.consent_status === "REVOKED") {
        setIsConsentRevoked(true);
      }
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.data?.detail?.includes("Consent revoked")) {
        setIsConsentRevoked(true);
      } else {
        toast({
          title: "Error Loading Casefile",
          description: err.response?.data?.message || "Failed to retrieve student records.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCasefile();
  }, [studentId, timeframe]);

  const toggleExpand = (id: string) => {
    setExpandedEvents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredTimeline = (casefile?.timeline || []).filter(item => {
    if (typeFilter === "ALL") return true;
    return item.event_type === typeFilter;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case "ASSESSMENT":
        return <BarChart3 className="w-4 h-4 text-indigo-500" />;
      case "EMOTION_ANALYSIS":
        return <HeartPulse className="w-4 h-4 text-emerald-500" />;
      case "ALERT":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "APPOINTMENT":
        return <Calendar className="w-4 h-4 text-sky-500" />;
      case "SAFETY_EVENT":
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case "BEHAVIORAL":
        return <Activity className="w-4 h-4 text-purple-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
      case "HIGH":
        return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";
      case "MEDIUM":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "LOW":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      default:
        return "bg-muted text-muted-foreground border-border/70";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      {/* Top Navigation & Breadcrumb */}
      <div className="border-b border-border/60 bg-card/40 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/counselor")}
              className="h-8 px-2.5 rounded-lg border-border/70 text-xs font-medium gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Alerts Queue
            </Button>
            <span className="text-muted-foreground text-xs hidden sm:inline">/</span>
            <span className="text-xs font-semibold text-foreground hidden sm:inline">
              Student Case File & Longitudinal Timeline
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchCasefile}
            disabled={isLoading}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Loading State */}
        {isLoading && !casefile && (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-7 h-7 text-primary animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Compiling longitudinal casefile and clinical events...</p>
          </div>
        )}

        {/* Consent Revoked Security Lock Screen */}
        {isConsentRevoked && (
          <Card className="border-rose-500/30 bg-rose-500/5 backdrop-blur-md overflow-hidden relative">
            <CardContent className="p-8 sm:p-12 text-center space-y-5 max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto shadow-lg">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  ACCESS RESTRICTED (HTTP 403)
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Student Has Revoked Clinical Sharing Consent
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Under MindGuard AI's Privacy-by-Design policies, this student has chosen not to share their wellness insights, emotional trends, or casefile timeline with clinical staff.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border/80 text-left text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-primary" />
                  Protocol for Clinical Counselors:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Respect the student’s autonomous privacy preference.</li>
                  <li>In the event of an active campus emergency or verified safety incident, contact campus welfare authorities directly.</li>
                  <li>Students can re-grant counselor access at any time via their profile Settings page.</li>
                </ul>
              </div>
              <div>
                <Button
                  onClick={() => navigate("/counselor")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold h-10 px-5 rounded-xl"
                >
                  Return to Counselor Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Case File Content */}
        {!isConsentRevoked && casefile && (
          <>
            {/* Student Profile Header Card */}
            <Card className="border-border/70 bg-card/60 backdrop-blur-md overflow-hidden relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center text-primary font-bold text-lg shadow-sm">
                      {casefile.student.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg sm:text-xl font-bold text-foreground">
                          {casefile.student.full_name}
                        </h1>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                          casefile.student.current_risk_level === "HIGH" 
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                            : casefile.student.current_risk_level === "MEDIUM"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        }`}>
                          {casefile.student.current_risk_level} Risk
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Consent Active
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {casefile.student.email} • {casefile.student.academic_department}
                      </p>
                      <p className="text-[11px] text-muted-foreground/80 font-mono mt-0.5">
                        ID: {casefile.student.id}
                      </p>
                    </div>
                  </div>

                  {/* Timeframe Filter Tabs */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-accent/30 border border-border/70 self-stretch sm:self-auto justify-center">
                    {(["30", "90", "all"] as const).map(tf => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          timeframe === tf
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tf === "all" ? "All Time" : `${tf} Days`}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Metrics KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <Card className="border-border/70 bg-card/40 backdrop-blur-sm p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Wellness Score
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-foreground">
                    {casefile.summary.latest_wellness_score.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
                <div className="w-full bg-muted/60 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      casefile.summary.latest_wellness_score >= 70 ? "bg-emerald-500" :
                      casefile.summary.latest_wellness_score >= 50 ? "bg-amber-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, casefile.summary.latest_wellness_score))}%` }}
                  />
                </div>
              </Card>

              <Card className="border-border/70 bg-card/40 backdrop-blur-sm p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Active Alerts
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className={`text-2xl sm:text-3xl font-black ${
                    casefile.summary.active_alerts_count > 0 ? "text-rose-500" : "text-foreground"
                  }`}>
                    {casefile.summary.active_alerts_count}
                  </span>
                  <span className="text-xs text-muted-foreground">Pending action</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  High-risk escalations
                </p>
              </Card>

              <Card className="border-border/70 bg-card/40 backdrop-blur-sm p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Clinical Assessments
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-foreground">
                    {casefile.summary.total_assessments}
                  </span>
                  <span className="text-xs text-muted-foreground">Evaluated</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  NLP + Behavioral fusion
                </p>
              </Card>

              <Card className="border-border/70 bg-card/40 backdrop-blur-sm p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Counselor Sessions
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-foreground">
                    {casefile.summary.total_appointments}
                  </span>
                  <span className="text-xs text-muted-foreground">Scheduled</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Virtual & In-person
                </p>
              </Card>
            </div>

            {/* Timeline Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: "ALL", label: "All Events" },
                { id: "ASSESSMENT", label: "Assessments" },
                { id: "EMOTION_ANALYSIS", label: "Emotions & Journals" },
                { id: "ALERT", label: "Alerts" },
                { id: "APPOINTMENT", label: "Appointments" },
                { id: "SAFETY_EVENT", label: "Safety / SOS" },
                { id: "BEHAVIORAL", label: "Behavioral Telemetry" },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setTypeFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                    typeFilter === f.id
                      ? "bg-primary/15 text-primary border-primary/40 font-semibold"
                      : "bg-card border-border/70 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Longitudinal Unified Timeline */}
            <Card className="border-border/70 bg-card/50 backdrop-blur-md">
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Unified Clinical Timeline
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Chronological log of multi-modal signals, clinical evaluations, and staff interventions.
                    </CardDescription>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {filteredTimeline.length} events
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {filteredTimeline.length === 0 ? (
                  <div className="p-12 text-center space-y-2">
                    <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                    <p className="text-sm font-semibold text-foreground">No events recorded in this timeframe</p>
                    <p className="text-xs text-muted-foreground">
                      Try selecting a wider timeframe or changing the filter pills above.
                    </p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
                    {filteredTimeline.map(ev => {
                      const isExpanded = !!expandedEvents[ev.id];
                      return (
                        <div key={ev.id} className="relative group">
                          {/* Timeline node icon */}
                          <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-card border-2 border-border flex items-center justify-center shadow-sm group-hover:border-primary transition-colors">
                            <span className="scale-75">{getEventIcon(ev.event_type)}</span>
                          </div>

                          {/* Event Card */}
                          <div className="rounded-xl border border-border/70 bg-card/60 hover:bg-accent/20 p-4 transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getSeverityBadge(ev.severity)}`}>
                                  {ev.severity}
                                </span>
                                <h4 className="text-xs sm:text-sm font-bold text-foreground">
                                  {ev.title}
                                </h4>
                              </div>
                              <span className="text-[11px] text-muted-foreground font-mono">
                                {new Date(ev.timestamp).toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                            </div>

                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                              {ev.summary}
                            </p>

                            {/* Collapsible Details */}
                            {ev.details && Object.keys(ev.details).length > 0 && (
                              <div className="mt-3">
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(ev.id)}
                                  className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                                >
                                  {isExpanded ? (
                                    <>Hide Clinical Details <ChevronUp className="w-3 h-3" /></>
                                  ) : (
                                    <>View Clinical Details <ChevronDown className="w-3 h-3" /></>
                                  )}
                                </button>

                                {isExpanded && (
                                  <div className="mt-2.5 p-3 rounded-lg bg-accent/30 border border-border/60 text-xs font-mono space-y-1.5 animate-in fade-in duration-150">
                                    {Object.entries(ev.details).map(([k, v]) => (
                                      <div key={k} className="flex items-start gap-2">
                                        <span className="text-muted-foreground font-bold">{k}:</span>
                                        <span className="text-foreground break-all">
                                          {typeof v === "object" ? JSON.stringify(v) : String(v)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};
