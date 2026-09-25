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
  ChevronRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { casefileAPI, notesAPI, alertsAPI, StudentCasefile, CasefileTimelineEvent } from "@/services/api";
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
  const [activeTab, setActiveTab] = useState<"overview" | "trends" | "timeline" | "ai_factors" | "notes">("overview");

  // Note Modal state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [activeAlertForNote, setActiveAlertForNote] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [studentNotes, setStudentNotes] = useState<any[]>([]);

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

  useEffect(() => {
    fetchCasefile();
  }, [studentId, timeframe]);

  const handleUpdateAlertStatus = async (alertId: string, status: "PENDING" | "REVIEWED" | "RESOLVED") => {
    try {
      await alertsAPI.updateAlertStatus(alertId, status);
      toast({
        title: "Status Updated",
        description: `Alert marked as ${status}.`,
        variant: "success",
      });
      fetchCasefile();
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.response?.data?.message || "Could not update alert status.",
        variant: "destructive",
      });
    }
  };

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
            onClick={() => navigate("/counselor/students")}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium -ml-1 mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Student Directory</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-foreground font-mono">
              Student #{studentId?.substring(0, 10)}...
            </h1>
            <span className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded border uppercase",
              student?.current_risk_level === "HIGH" ? "badge-elevated" : student?.current_risk_level === "MEDIUM" ? "badge-moderate" : "badge-stable"
            )}>
              {student?.current_risk_level || "Stable"} Risk
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Department: {student?.academic_department || "General"} • Assessments: {summary?.total_assessments ?? 0}
          </p>
        </div>

        <div className="flex items-center gap-2">
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
      <div className="flex border-b border-border text-xs font-medium gap-6">
        {[
          { key: "overview", label: "Overview & Status" },
          { key: "trends", label: "Longitudinal Trends" },
          { key: "timeline", label: `Activity Timeline (${timeline.length})` },
          { key: "ai_factors", label: "AI Decision Support" },
          { key: "notes", label: `Clinical Notes (${studentNotes.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={cn(
              "pb-2.5 transition-colors border-b-2 -mb-px",
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
              <span className="text-[11px] text-muted-foreground uppercase font-medium block">Scheduled Sessions</span>
              <span className="text-2xl font-bold text-foreground font-sans mt-1 block">
                {summary?.total_appointments ?? 0}
              </span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">1-on-1 consultations</span>
            </div>
          </div>

          {/* Student Case Summary Card */}
          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Clinical Profile & Support Context</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <p><strong>Student Name:</strong> {student?.full_name || "Anonymized"}</p>
                <p className="mt-1"><strong>Email:</strong> {student?.email || "Encrypted"}</p>
                <p className="mt-1"><strong>Consent Level:</strong> {student?.consent_status || "Active"}</p>
              </div>
              <div>
                <p><strong>Current Triage Level:</strong> {student?.current_risk_level || "Low"}</p>
                <p className="mt-1"><strong>Timeline Events:</strong> {summary?.timeline_events_count ?? timeline.length}</p>
                <p className="mt-1"><strong>Monitoring Horizon:</strong> {casefile?.timeframe_days || "90"} Days</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Trends */}
      {activeTab === "trends" && (
        <div className="space-y-4">
          <WellnessTrendDashboard studentId={studentId} isCounselorView={true} />
        </div>
      )}

      {/* Tab 3: Timeline */}
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

      {/* Tab 4: AI Factors */}
      {activeTab === "ai_factors" && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-lg border border-border bg-secondary/30 text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Clinical Decision Support Disclaimer:</strong> AI model attributions and SHAP feature importance factors are provided solely to support counsellor triage. They do not constitute a formal diagnosis or clinical treatment prescription.
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

      {/* Tab 5: Clinical Notes */}
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
    </div>
  );
};

export default StudentCaseFile;
