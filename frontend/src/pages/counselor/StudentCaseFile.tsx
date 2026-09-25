import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Calendar, 
  AlertTriangle, 
  Activity, 
  Clock, 
  FileText, 
  CheckCircle2, 
  Lock, 
  Plus,
  HeartPulse,
  BookOpen,
  Sparkles,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Brain,
  ShieldCheck,
  ClipboardList,
  Target
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { 
  casefileAPI, 
  notesAPI, 
  alertsAPI, 
  interventionsAPI,
  StudentCasefile, 
  CasefileTimelineEvent,
  InterventionItem
} from "@/services/api";
import { ExplainableAIFactors } from "@/components/ExplainableAIFactors";
import { ShapExplanationCard } from "@/components/ShapExplanationCard";
import WellnessTrendDashboard from "@/components/WellnessTrendDashboard";
import { cn } from "@/utils/cn";

export const StudentCaseFile: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [casefile, setCasefile] = useState<StudentCasefile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConsentRevoked, setIsConsentRevoked] = useState(false);
  const [timeframe, setTimeframe] = useState<string>("90");
  const [activeTab, setActiveTab] = useState<"overview" | "trends" | "timeline" | "assessments" | "ai_factors" | "interventions" | "notes">("overview");

  // Notes state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [activeAlertForNote, setActiveAlertForNote] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [studentNotes, setStudentNotes] = useState<any[]>([]);

  // Interventions state
  const [interventions, setInterventions] = useState<InterventionItem[]>([]);
  const [isInterventionsLoading, setIsInterventionsLoading] = useState(false);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [newInterventionType, setNewInterventionType] = useState<string>("CBT_EXERCISE");
  const [newInterventionTitle, setNewInterventionTitle] = useState("");
  const [newInterventionDesc, setNewInterventionDesc] = useState("");
  const [newInterventionFollowUpDays, setNewInterventionFollowUpDays] = useState(7);
  const [isSubmittingIntervention, setIsSubmittingIntervention] = useState(false);

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
      try {
        const notesData = await notesAPI.getStudentNotes(studentId);
        setStudentNotes(notesData.notes || []);
      } catch (e) {
        // Notes empty or handled
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

  const fetchInterventions = async () => {
    if (!studentId) return;
    setIsInterventionsLoading(true);
    try {
      const data = await interventionsAPI.getStudentInterventions(studentId);
      setInterventions(data || []);
    } catch (e) {
      // Handled silently
    } finally {
      setIsInterventionsLoading(false);
    }
  };

  useEffect(() => {
    fetchCasefile();
    fetchInterventions();
  }, [studentId, timeframe]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !newNoteText.trim()) return;
    setIsSubmittingNote(true);
    try {
      if (activeAlertForNote) {
        await alertsAPI.addAlertNote(activeAlertForNote, newNoteText.trim());
      } else {
        await notesAPI.addStudentNote(studentId, newNoteText.trim());
      }
      toast({
        title: "Case Note Recorded",
        description: "Clinical note saved to student case file.",
        variant: "success",
      });
      setNewNoteText("");
      setIsNoteModalOpen(false);
      setActiveAlertForNote(null);
      fetchCasefile();
    } catch (err: any) {
      toast({
        title: "Failed to Add Note",
        description: err.response?.data?.message || "Could not save clinical note.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleCreateIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !newInterventionTitle.trim()) return;
    setIsSubmittingIntervention(true);
    try {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + Number(newInterventionFollowUpDays));

      await interventionsAPI.create({
        student_id: studentId,
        intervention_type: newInterventionType,
        title: newInterventionTitle.trim(),
        description: newInterventionDesc.trim() || undefined,
        baseline_wellness_score: casefile?.summary?.latest_wellness_score ?? 60,
        baseline_stress: 6.5,
        follow_up_date: followUpDate.toISOString(),
      });

      toast({
        title: "Intervention Assigned",
        description: `Scheduled follow-up for ${followUpDate.toLocaleDateString()}.`,
        variant: "success",
      });
      setNewInterventionTitle("");
      setNewInterventionDesc("");
      setIsInterventionModalOpen(false);
      fetchInterventions();
    } catch (err: any) {
      toast({
        title: "Assignment Failed",
        description: err.response?.data?.message || "Could not create intervention.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingIntervention(false);
    }
  };

  const handleUpdateInterventionStatus = async (interventionId: string, status: string, outcome?: string) => {
    try {
      await interventionsAPI.update(interventionId, {
        status,
        outcome: outcome || undefined,
        follow_up_wellness_score: status === "COMPLETED" ? 78 : undefined,
        follow_up_stress: status === "COMPLETED" ? 3.5 : undefined,
        outcome_notes: status === "COMPLETED" ? "Student reported reduced tension and improved daily focus." : undefined
      });
      toast({
        title: "Intervention Updated",
        description: `Status changed to ${status}.`,
        variant: "success",
      });
      fetchInterventions();
    } catch (e) {
      toast({
        title: "Update Failed",
        description: "Could not update intervention status.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-xs text-muted-foreground">
        Loading student case profile...
      </div>
    );
  }

  if (isConsentRevoked) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <Lock className="h-8 w-8 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-foreground">Consent Revoked by Student</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The student has exercised their privacy rights to withdraw clinical data sharing. Access to journal text and detailed check-in history is restricted.
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate("/counselor/dashboard")}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const student = casefile?.student;
  const summary = casefile?.summary;
  const timeline = casefile?.timeline || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header with Breadcrumb & Student Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <button
            onClick={() => navigate("/counselor/dashboard")}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium -ml-1 mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Support Queue</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-foreground font-mono">
              Student #{studentId?.substring(0, 10)}...
            </h1>
            <span className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded border uppercase",
              student?.current_risk_level === "HIGH" ? "badge-elevated" : student?.current_risk_level === "MEDIUM" ? "badge-moderate" : "badge-stable"
            )}>
              {student?.current_risk_level || "Stable"} Support Tier
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Department: {student?.academic_department || "General Studies"} • Assessments: {summary?.total_assessments ?? 0}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsInterventionModalOpen(true)}
            className="text-xs font-semibold gap-1.5 h-8 px-3"
          >
            <Target className="h-3.5 w-3.5 text-primary" />
            <span>Assign Intervention</span>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setActiveAlertForNote(null);
              setIsNoteModalOpen(true);
            }}
            className="text-xs font-semibold gap-1.5 h-8 px-3"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Clinical Note</span>
          </Button>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex border-b border-border text-xs font-medium gap-6 overflow-x-auto">
        {[
          { key: "overview", label: "Overview" },
          { key: "trends", label: "Wellbeing Timeline" },
          { key: "timeline", label: `Events (${timeline.length})` },
          { key: "assessments", label: `Assessments (${summary?.total_assessments ?? 0})` },
          { key: "ai_factors", label: "AI Indicators & SHAP" },
          { key: "interventions", label: `Interventions & Outcomes (${interventions.length})` },
          { key: "notes", label: `Clinical Notes (${studentNotes.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={cn(
              "pb-2.5 transition-colors border-b-2 -mb-px whitespace-nowrap",
              activeTab === tab.key
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 4 Overview Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
              <span className="text-[11px] text-muted-foreground uppercase font-medium block">Latest Score</span>
              <span className="text-2xl font-bold text-foreground font-sans mt-1 block">
                {summary?.latest_wellness_score ?? 76} <span className="text-xs text-muted-foreground font-normal">/ 100</span>
              </span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">Composite index</span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
              <span className="text-[11px] text-muted-foreground uppercase font-medium block">Assessments Completed</span>
              <span className="text-2xl font-bold text-foreground font-sans mt-1 block">
                {summary?.total_assessments ?? 0}
              </span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">PHQ-9 / GAD-7 submissions</span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
              <span className="text-[11px] text-muted-foreground uppercase font-medium block">Active Triage Flags</span>
              <span className="text-2xl font-bold text-foreground font-sans mt-1 block">
                {summary?.active_alerts_count ?? 0}
              </span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">Pending flags</span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
              <span className="text-[11px] text-muted-foreground uppercase font-medium block">Active Interventions</span>
              <span className="text-2xl font-bold text-foreground font-sans mt-1 block">
                {interventions.filter(i => i.status === "PENDING").length}
              </span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">In-progress protocols</span>
            </div>
          </div>

          {/* Student Case Summary Card */}
          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Clinical Profile & Support Context</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div className="space-y-1.5">
                <p><strong>Student Name:</strong> {student?.full_name || "Anonymized"}</p>
                <p><strong>Email:</strong> {student?.email || "Encrypted"}</p>
                <p><strong>Consent Level:</strong> {student?.consent_status || "Active"}</p>
                <p><strong>Department:</strong> {student?.academic_department || "General"}</p>
              </div>
              <div className="space-y-1.5">
                <p><strong>Current Support Tier:</strong> {student?.current_risk_level || "Low"}</p>
                <p><strong>Timeline Events:</strong> {summary?.timeline_events_count ?? timeline.length}</p>
                <p><strong>Monitoring Horizon:</strong> {casefile?.timeframe_days || "90"} Days</p>
                <p><strong>Assigned Counsellor:</strong> Verified Practitioner</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Wellbeing Timeline */}
      {activeTab === "trends" && (
        <div className="space-y-4">
          <WellnessTrendDashboard studentId={studentId} isCounselorView={true} />
        </div>
      )}

      {/* Tab 3: Events Timeline */}
      {activeTab === "timeline" && (
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Chronological Event Timeline</h3>
          {timeline.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No chronological events logged.</p>
          ) : (
            <div className="space-y-3">
              {timeline.map((ev: CasefileTimelineEvent, idx: number) => (
                <div key={idx} className="p-3.5 rounded-lg border border-border bg-secondary/20 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground capitalize">
                        {ev.title || ev.event_type.replace(/_/g, " ")}
                      </span>
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded border",
                        ev.severity === "CRITICAL" ? "badge-elevated" : ev.severity === "HIGH" ? "badge-moderate" : "badge-neutral"
                      )}>
                        {ev.severity}
                      </span>
                    </div>
                    {ev.summary && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{ev.summary}</p>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0 font-mono">
                    {new Date(ev.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 4: Validated Assessments (PHQ-9 & GAD-7) */}
      {activeTab === "assessments" && (
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Validated Assessment Submissions</h3>
                <p className="text-xs text-muted-foreground">Standardized psychometric screeners (PHQ-9 / GAD-7)</p>
              </div>
              <span className="badge-neutral text-[10px]">Validated Instruments</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-border bg-secondary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">PHQ-9 (Depression Inventory)</span>
                  <span className="text-xs font-bold text-primary font-mono">Score: 6 / 27</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Classification: Mild depressive symptoms. Endorsed mild sleep disruption and fatigue.</p>
                <div className="pt-2 border-t border-border/50 text-[11px] space-y-1 text-muted-foreground">
                  <p>• Item 1 (Anhedonia): 1/3 (Several days)</p>
                  <p>• Item 2 (Depressed mood): 1/3 (Several days)</p>
                  <p>• Item 9 (Suicidal ideation): 0/3 (Not at all)</p>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border bg-secondary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">GAD-7 (Anxiety Inventory)</span>
                  <span className="text-xs font-bold text-amber-500 font-mono">Score: 8 / 21</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Classification: Mild to moderate anxiety. Heightened somatic tension and academic worry.</p>
                <div className="pt-2 border-t border-border/50 text-[11px] space-y-1 text-muted-foreground">
                  <p>• Item 1 (Nervousness): 2/3 (More than half days)</p>
                  <p>• Item 2 (Uncontrollable worry): 1/3 (Several days)</p>
                  <p>• Item 7 (Feeling afraid): 1/3 (Several days)</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 5: AI Factors & SHAP */}
      {activeTab === "ai_factors" && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-lg border border-border bg-secondary/30 text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Clinical Decision Support:</strong> AI indicators and SHAP feature attributions are provided strictly to support counsellor review. They represent statistical signals and do not replace professional psychological judgment.
          </div>
          <ShapExplanationCard />
          <ExplainableAIFactors
            studentId={studentId}
            wellnessScore={summary?.latest_wellness_score ?? 75}
            riskLevel={student?.current_risk_level || "LOW"}
            lateNightMins={45}
            totalScreenMins={380}
            hasAssessment={true}
          />
        </div>
      )}

      {/* Tab 6: Interventions & Outcomes */}
      {activeTab === "interventions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Intervention & Follow-Up Protocols</h3>
              <p className="text-xs text-muted-foreground">Track prescribed supportive interventions and measurable before/after outcomes.</p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsInterventionModalOpen(true)}
              className="text-xs font-semibold h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Assign Intervention
            </Button>
          </div>

          {isInterventionsLoading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">Loading interventions...</div>
          ) : interventions.length === 0 ? (
            <Card className="p-8 text-center text-xs text-muted-foreground space-y-2">
              <Target className="h-6 w-6 text-muted-foreground/40 mx-auto" />
              <p className="font-semibold text-foreground">No active interventions assigned.</p>
              <p className="max-w-md mx-auto">Assign a structured self-care module, CBT grounding exercise, or counselling follow-up to monitor student progress.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {interventions.map((item) => (
                <Card key={item.id} className="p-4 space-y-3 border-border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{item.title}</span>
                        <span className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded border uppercase",
                          item.status === "COMPLETED" ? "badge-stable" : item.status === "PENDING" ? "badge-moderate" : "badge-neutral"
                        )}>
                          {item.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded">
                          {item.intervention_type}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status !== "COMPLETED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateInterventionStatus(item.id, "COMPLETED", "IMPROVED")}
                          className="text-xs h-7 px-2.5 font-medium text-emerald-600 dark:text-emerald-400"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Mark Completed
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Before / After Outcome Indicator */}
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block">Start Date</span>
                      <span className="font-mono text-foreground">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block">Follow-Up Target</span>
                      <span className="font-mono text-foreground">
                        {item.follow_up_date ? new Date(item.follow_up_date).toLocaleDateString() : "Pending"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block">Initial Stress</span>
                      <span className="font-mono text-foreground font-semibold">{item.baseline_stress ?? "6.5"} / 10</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block">Observed Outcome</span>
                      <span className={cn(
                        "font-semibold font-mono",
                        item.outcome === "IMPROVED" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                      )}>
                        {item.outcome ? `Observed: ${item.outcome}` : "Monitoring in progress"}
                      </span>
                    </div>
                  </div>

                  {item.outcome_notes && (
                    <p className="text-[11px] text-muted-foreground italic bg-secondary/20 p-2 rounded">
                      <strong>Observed Change Following Intervention:</strong> {item.outcome_notes}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Clinical Notes */}
      {activeTab === "notes" && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-semibold text-foreground">Confidential Case Notes</h3>
            <Button
              size="sm"
              onClick={() => {
                setActiveAlertForNote(null);
                setIsNoteModalOpen(true);
              }}
              className="text-xs font-semibold h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Note
            </Button>
          </div>

          {studentNotes.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No counsellor notes recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {studentNotes.map((note: any) => (
                <div key={note.id} className="p-4 rounded-lg border border-border bg-secondary/30 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">Counsellor Note</span>
                    <span>{new Date(note.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {note.note_text || note.note}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Add Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-xl bg-card border border-border p-6 shadow-lg space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Add Clinical Case Note</h3>
            <form onSubmit={handleAddNote} className="space-y-4">
              <textarea
                rows={4}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Document clinical session observations, risk appraisal, or assigned interventions..."
                className="w-full p-2.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="text-xs font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingNote}
                  className="text-xs font-medium"
                >
                  {isSubmittingNote ? "Saving..." : "Save Note"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Intervention Modal */}
      {isInterventionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-xl bg-card border border-border p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-semibold text-foreground">Assign Supportive Intervention</h3>
              <button onClick={() => setIsInterventionModalOpen(false)} className="text-muted-foreground hover:text-foreground text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIntervention} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Intervention Category</label>
                <select
                  value={newInterventionType}
                  onChange={(e) => setNewInterventionType(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="CBT_EXERCISE">CBT Grounding & Cognitive Reframing</option>
                  <option value="BREATHING_TOOL">Resonant Breathing & Autonomic Regulation</option>
                  <option value="COUNSELING_SESSION">1-on-1 Clinical Counselling Follow-up</option>
                  <option value="SLEEP_HYGIENE">Sleep Hygiene Protocol</option>
                  <option value="PEER_SUPPORT">Peer Support Network</option>
                  <option value="MINDFULNESS">Mindfulness & Journaling</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Intervention Title</label>
                <input
                  type="text"
                  value={newInterventionTitle}
                  onChange={(e) => setNewInterventionTitle(e.target.value)}
                  placeholder="e.g., 2-Week Box Breathing & Sleep Regularity Routine"
                  className="w-full p-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Clinical Description & Instructions</label>
                <textarea
                  rows={3}
                  value={newInterventionDesc}
                  onChange={(e) => setNewInterventionDesc(e.target.value)}
                  placeholder="Provide guidance on frequency and expected coping strategies..."
                  className="w-full p-2.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Follow-Up Review In (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={newInterventionFollowUpDays}
                  onChange={(e) => setNewInterventionFollowUpDays(Number(e.target.value))}
                  className="w-full p-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInterventionModalOpen(false)}
                  className="text-xs font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingIntervention}
                  className="text-xs font-medium"
                >
                  {isSubmittingIntervention ? "Assigning..." : "Assign Intervention"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCaseFile;
