import React, { useState, useEffect } from "react";
import { useLocation, NavLink, useNavigate } from "react-router-dom";
import { useCounselorAlerts, useUpdateAlertStatus, useAssignAlert, useAddAlertNote, AlertItem } from "@/hooks/useAlerts";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  X, 
  ChevronRight, 
  User as UserIcon, 
  Loader2, 
  Users, 
  Calendar, 
  FileEdit,
  Search,
  Filter,
  ShieldCheck,
  Activity,
  ArrowRight,
  PhoneCall,
  Target,
  TrendingUp,
  Brain
} from "lucide-react";
import { appointmentsAPI, AppointmentItem, alertsAPI, interventionsAPI, InterventionSummary } from "@/services/api";
import { cn } from "@/utils/cn";

export const CounselorDashboard: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // 1. Fetching Alerts Queue & Booked Appointments
  const { data: alertsData, isLoading: isAlertsLoading } = useCounselorAlerts(statusFilter);
  const { data: allAlertsData } = useCounselorAlerts("");
  const updateStatusMutation = useUpdateAlertStatus(statusFilter);
  const assignAlertMutation = useAssignAlert(statusFilter);
  const addNoteMutation = useAddAlertNote();

  // Alert Note Modal state
  const [activeNoteAlert, setActiveNoteAlert] = useState<AlertItem | null>(null);
  const [alertNoteText, setAlertNoteText] = useState("");
  const [isSubmittingAlertNote, setIsSubmittingAlertNote] = useState(false);

  // Appointments
  const [appointmentsList, setAppointmentsList] = useState<AppointmentItem[]>([]);
  const [isAppointmentsLoading, setIsAppointmentsLoading] = useState(false);

  // Interventions summary
  const [interventionSummary, setInterventionSummary] = useState<InterventionSummary | null>(null);

  const fetchAppointments = React.useCallback(async () => {
    setIsAppointmentsLoading(true);
    try {
      const data = await appointmentsAPI.getMyAppointments();
      setAppointmentsList(data.appointments || []);
    } catch (e) {
      // Handled silently
    } finally {
      setIsAppointmentsLoading(false);
    }
  }, []);

  const fetchInterventionSummary = React.useCallback(async () => {
    try {
      const data = await interventionsAPI.getCounselorSummary();
      setInterventionSummary(data);
    } catch (e) {
      // Handled silently
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchInterventionSummary();
  }, [fetchAppointments, fetchInterventionSummary]);

  const handleUpdateAppointment = async (appId: string, status: string) => {
    try {
      await appointmentsAPI.updateStatus(appId, status);
      toast({
        title: "Session Updated",
        description: `Marked session as ${status}.`,
        variant: "success",
      });
      fetchAppointments();
    } catch (e) {
      toast({
        title: "Update Failed",
        description: "Could not update session status.",
        variant: "destructive",
      });
    }
  };

  // Parse unique student list
  const uniqueStudents = React.useMemo(() => {
    if (!allAlertsData?.alerts) return [];
    const studentMap = new Map<string, { studentId: string; lastAlert: string; alertCount: number; severity: string }>();
    allAlertsData.alerts.forEach((alert) => {
      const existing = studentMap.get(alert.student_id);
      if (existing) {
        existing.alertCount += 1;
        if (new Date(alert.created_at) > new Date(existing.lastAlert)) {
          existing.lastAlert = alert.created_at;
          existing.severity = alert.severity || "LOW";
        }
      } else {
        studentMap.set(alert.student_id, {
          studentId: alert.student_id,
          lastAlert: alert.created_at,
          alertCount: 1,
          severity: alert.severity || "LOW"
        });
      }
    });
    return Array.from(studentMap.values());
  }, [allAlertsData]);

  const handleStatusChange = async (alertId: string, newStatus: "PENDING" | "REVIEWED" | "RESOLVED") => {
    try {
      await alertsAPI.updateAlertStatus(alertId, newStatus);
      toast({
        title: "Status Updated",
        description: `Alert marked as ${newStatus}.`,
        variant: "success",
      });
      fetchAppointments();
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err?.response?.data?.message || "Could not update status.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAlertNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNoteAlert || !alertNoteText.trim()) return;
    setIsSubmittingAlertNote(true);
    try {
      await addNoteMutation.mutateAsync({
        alertId: activeNoteAlert.id,
        note: alertNoteText.trim(),
      });
      toast({
        title: "Clinical Note Recorded",
        description: "Your case note has been saved with timestamp.",
        variant: "success",
      });
      setAlertNoteText("");
      setActiveNoteAlert(null);
    } catch (err: any) {
      toast({
        title: "Failed to Save Note",
        description: err?.response?.data?.message || "Could not record clinical note.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingAlertNote(false);
    }
  };

  const isAlertsPage = path === "/counselor/alerts";
  const isStudentsPage = path === "/counselor/students";

  const criticalAlertsCount = React.useMemo(() => {
    return (allAlertsData?.alerts || []).filter(
      (a) => a.severity === "CRITICAL" && a.status === "PENDING"
    ).length;
  }, [allAlertsData]);

  const pendingAlerts = (allAlertsData?.alerts || []).filter((a) => a.status === "PENDING");
  const reviewedAlerts = (allAlertsData?.alerts || []).filter((a) => a.status === "REVIEWED");
  const resolvedAlerts = (allAlertsData?.alerts || []).filter((a) => a.status === "RESOLVED");

  // Filter alerts by student search query
  const filteredAlerts = (alertsData?.alerts || []).filter((a) =>
    a.student_id.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    ((a as any).reason || a.severity || "").toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Critical Alert Banner if Active SOS */}
      {criticalAlertsCount > 0 && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500 text-white rounded-lg">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500 text-white">
                  Immediate SOS Attention
                </span>
                <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                  {criticalAlertsCount} {criticalAlertsCount === 1 ? "Active Emergency Distress Signal" : "Active Emergency Distress Signals"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Urgent student distress detected via Tele-MANAS escalation or direct student SOS trigger.
              </p>
            </div>
          </div>
          <NavLink
            to="/counselor/alerts"
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold whitespace-nowrap transition-colors"
          >
            Review Critical Queue
          </NavLink>
        </div>
      )}

      {/* 1. Header & Top Metrics */}
      <div className="space-y-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            {isStudentsPage ? "Student Case Directory" : isAlertsPage ? "Support & Triage Queue" : "Counsellor Clinical Dashboard"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Student Mental Wellness Detection and Early Intervention • Practitioner Case Management
          </p>
        </div>

        {/* 4 Executive KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase tracking-wider">Cases Requiring Review</span>
              <AlertCircle className="h-4 w-4 text-rose-500" />
            </div>
            <span className="text-2xl font-bold text-foreground font-sans mt-1 block">
              {pendingAlerts.length}
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">Pending triage flags</span>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase tracking-wider">Active Interventions</span>
              <Target className="h-4 w-4 text-primary" />
            </div>
            <span className="text-2xl font-bold text-foreground font-sans mt-1 block">
              {interventionSummary?.total_active ?? reviewedAlerts.length}
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              {interventionSummary?.follow_ups_due_today ?? 0} follow-ups due today
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase tracking-wider">Consultations Scheduled</span>
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
            <span className="text-2xl font-bold text-foreground font-sans mt-1 block">
              {appointmentsList.filter((a) => a.status === "CONFIRMED" || a.status === "PENDING").length}
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">Upcoming 1-on-1 sessions</span>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase tracking-wider">Observed Outcomes</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="text-2xl font-bold text-foreground font-sans mt-1 block">
              {interventionSummary ? `${interventionSummary.observed_improvement_rate}%` : `${resolvedAlerts.length}`}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 block">
              Observed post-intervention improvement
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Content Split: Support Queue Table + Sessions/Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Support Queue Column (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {isStudentsPage ? "All Monitored Students" : "Support Triage Queue"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Real-time early warning flags and student check-in alerts
                </p>
              </div>

              {/* Status Filter Tabs */}
              {!isStudentsPage && (
                <div className="flex rounded-lg bg-secondary p-0.5 text-xs font-medium border border-border">
                  {[
                    { key: "PENDING", label: "Pending" },
                    { key: "REVIEWED", label: "Under Review" },
                    { key: "RESOLVED", label: "Resolved" },
                    { key: "", label: "All" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setStatusFilter(tab.key)}
                      className={cn(
                        "px-2.5 py-1 rounded-md transition-colors",
                        statusFilter === tab.key
                          ? "bg-card text-foreground font-semibold shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                placeholder="Search by student identifier or reason..."
                className="w-full pl-8 pr-4 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Student Cases or Alerts Table */}
            {isStudentsPage ? (
              <div className="overflow-x-auto">
                <table className="saas-table">
                  <thead>
                    <tr>
                      <th>Student Identifier</th>
                      <th>Last Flagged</th>
                      <th>Severity</th>
                      <th>Total Flags</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueStudents.map((st) => (
                      <tr key={st.studentId}>
                        <td className="font-semibold text-foreground font-mono">
                          {st.studentId.substring(0, 14)}...
                        </td>
                        <td className="text-muted-foreground">
                          {new Date(st.lastAlert).toLocaleDateString()}
                        </td>
                        <td>
                          <span className={cn(
                            "badge-neutral text-[10px]",
                            st.severity === "CRITICAL" ? "badge-elevated" : st.severity === "HIGH" ? "badge-moderate" : "badge-stable"
                          )}>
                            {st.severity}
                          </span>
                        </td>
                        <td>{st.alertCount} events</td>
                        <td className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/counselor/students/${st.studentId}/casefile`)}
                            className="text-xs h-7 px-2.5 font-medium gap-1"
                          >
                            <span>Open Case</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : isAlertsLoading ? (
              <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading triage queue...</span>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-1">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                <p className="font-medium text-foreground">No alerts currently pending triage.</p>
                <p className="text-[11px]">All student check-ins are currently operating within stable parameters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="saas-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Support Level</th>
                      <th>Reason / Signal</th>
                      <th>Logged Date</th>
                      <th className="text-right">Triage Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.map((alert) => (
                      <tr key={alert.id}>
                        <td>
                          <button
                            onClick={() => navigate(`/counselor/students/${alert.student_id}/casefile`)}
                            className="font-mono text-xs font-semibold text-primary hover:underline block text-left"
                          >
                            {alert.student_id.substring(0, 10)}...
                          </button>
                          <span className="text-[10px] text-muted-foreground">ID: #{alert.id.substring(0, 6)}</span>
                        </td>
                        <td>
                          <span className={cn(
                            "badge-neutral text-[10px]",
                            alert.severity === "CRITICAL" ? "badge-elevated" : alert.severity === "HIGH" ? "badge-moderate" : "badge-stable"
                          )}>
                            {alert.severity}
                          </span>
                        </td>
                        <td className="max-w-[180px] truncate text-muted-foreground" title={(alert as any).reason || alert.severity}>
                          {(alert as any).reason || `Elevated ${alert.severity} triage signal`}
                        </td>
                        <td className="text-muted-foreground text-[11px]">
                          {new Date(alert.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setActiveNoteAlert(alert);
                                setAlertNoteText((alert as any).counselor_notes || "");
                              }}
                              className="text-xs h-7 px-2 font-medium"
                              title="Add Clinical Note"
                            >
                              <FileEdit className="h-3 w-3 mr-1" />
                              Note
                            </Button>

                            {alert.status === "PENDING" && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusChange(alert.id, "REVIEWED")}
                                className="text-xs h-7 px-2.5 font-medium bg-primary text-primary-foreground"
                              >
                                Review
                              </Button>
                            )}

                            {alert.status === "REVIEWED" && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusChange(alert.id, "RESOLVED")}
                                className="text-xs h-7 px-2.5 font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                Resolve
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Appointments & Schedule Column (Right 1 col) */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Scheduled Consultations</h3>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {appointmentsList.length} total
              </span>
            </div>

            {isAppointmentsLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Loading appointments...
              </div>
            ) : appointmentsList.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <Calendar className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1" />
                <p>No student counselling appointments booked yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {appointmentsList.slice(0, 5).map((app) => (
                  <div key={app.id} className="p-3 rounded-lg border border-border bg-secondary/30 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold text-foreground block">
                          Student #{app.student_id.substring(0, 8)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(app.scheduled_time).toLocaleDateString()} at {new Date(app.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded border",
                        app.status === "CONFIRMED" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                        app.status === "CANCELLED" ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                        "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      )}>
                        {app.status}
                      </span>
                    </div>

                    {app.notes && (
                      <p className="text-[11px] text-muted-foreground italic truncate">
                        "{app.notes}"
                      </p>
                    )}

                    {app.status === "PENDING" && (
                      <div className="flex gap-1.5 pt-1 border-t border-border/50">
                        <button
                          onClick={() => handleUpdateAppointment(app.id, "CONFIRMED")}
                          className="text-[11px] font-semibold text-emerald-600 hover:underline"
                        >
                          Confirm
                        </button>
                        <span className="text-muted-foreground">•</span>
                        <button
                          onClick={() => handleUpdateAppointment(app.id, "CANCELLED")}
                          className="text-[11px] font-semibold text-rose-600 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Case Note Modal */}
      {activeNoteAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-xl bg-card border border-border p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Record Clinical Case Note</h3>
                <p className="text-xs text-muted-foreground">
                  Case ID: #{activeNoteAlert.id.substring(0, 8)} • Student #{activeNoteAlert.student_id.substring(0, 8)}
                </p>
              </div>
              <button
                onClick={() => setActiveNoteAlert(null)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAlertNote} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Clinical Assessment & Plan
                </label>
                <textarea
                  rows={4}
                  value={alertNoteText}
                  onChange={(e) => setAlertNoteText(e.target.value)}
                  placeholder="Record intervention notes, student contact outcome, or recommended follow-up steps..."
                  className="w-full p-2.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveNoteAlert(null)}
                  className="text-xs font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingAlertNote}
                  className="text-xs font-medium"
                >
                  {isSubmittingAlertNote ? "Saving..." : "Save Note"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CounselorDashboard;
