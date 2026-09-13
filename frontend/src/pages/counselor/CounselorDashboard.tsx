import React, { useState } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useCounselorAlerts, useUpdateAlertStatus } from "@/hooks/useAlerts";
import { useMoodHistory } from "@/hooks/useMood";
import { useLatestAssessment } from "@/hooks/usePredictions";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from "recharts";
import { 
  AlertCircle, CheckCircle2, Clock, X, ChevronRight, User as UserIcon, Loader2, Users, Calendar,
  ShieldAlert, Activity, ArrowUpRight, HelpCircle, FileText, Check, AlertTriangle, Stethoscope, Sparkles, Filter, ExternalLink
} from "lucide-react";
import { appointmentsAPI, AppointmentItem } from "@/services/api";

export const CounselorDashboard: React.FC = () => {
  const { toast } = useToast();
  const location = useLocation();
  const path = location.pathname;
  
  // Sidebar/Filter state
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // 1. Fetching Alerts Queue & Booked Appointments
  const { data: alertsData, isLoading: isAlertsLoading } = useCounselorAlerts(statusFilter);
  const { data: allAlertsData } = useCounselorAlerts("");
  const updateStatusMutation = useUpdateAlertStatus(statusFilter);

  const [appointmentsList, setAppointmentsList] = useState<AppointmentItem[]>([]);
  const [isAppointmentsLoading, setIsAppointmentsLoading] = useState(false);

  const fetchAppointments = React.useCallback(async () => {
    setIsAppointmentsLoading(true);
    try {
      const data = await appointmentsAPI.getMyAppointments();
      setAppointmentsList(data.appointments || []);
    } catch (e) {
      // Ignored
    } finally {
      setIsAppointmentsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleUpdateAppointment = async (appId: string, status: string) => {
    try {
      await appointmentsAPI.updateStatus(appId, status);
      toast({
        title: "Appointment Status Updated",
        description: `Session marked as ${status}.`,
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
    const studentMap = new Map<string, { studentId: string; lastAlert: string; alertCount: number }>();
    allAlertsData.alerts.forEach((alert) => {
      const existing = studentMap.get(alert.student_id);
      if (existing) {
        existing.alertCount += 1;
        if (new Date(alert.created_at) > new Date(existing.lastAlert)) {
          existing.lastAlert = alert.created_at;
        }
      } else {
        studentMap.set(alert.student_id, {
          studentId: alert.student_id,
          lastAlert: alert.created_at,
          alertCount: 1
        });
      }
    });
    return Array.from(studentMap.values());
  }, [allAlertsData]);

  // 2. Perform status transitions optimistically
  const handleStatusChange = async (alertId: string, newStatus: "PENDING" | "REVIEWED" | "RESOLVED") => {
    try {
      await updateStatusMutation.mutateAsync({ id: alertId, status: newStatus });
      toast({
        title: "Alert Status Updated",
        description: `Alert successfully marked as ${newStatus}.`,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Status Update Failed",
        description: "Failed to sync status changes to the database.",
        variant: "destructive",
      });
    }
  };

  const isAlertsPage = path === "/counselor/alerts";
  const isStudentsPage = path === "/counselor/students";
  const isOverviewPage = path === "/counselor/dashboard" || (!isAlertsPage && !isStudentsPage);

  // Filter student list by search query
  const filteredStudents = uniqueStudents.filter((s) =>
    s.studentId.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  const pendingAlerts = allAlertsData?.alerts.filter((a) => a.status === "PENDING") || [];
  const reviewedAlerts = allAlertsData?.alerts.filter((a) => a.status === "REVIEWED") || [];
  const resolvedAlerts = allAlertsData?.alerts.filter((a) => a.status === "RESOLVED") || [];

  return (
    <div className="relative space-y-6 min-h-[calc(100vh-80px)] text-foreground pb-12">
      
      {/* CLINICAL TRIAGE HEADER: Who needs attention? -> Why? -> What action should I take? */}
      <div className="rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card to-primary/5 p-5 md:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold tracking-wide uppercase mb-2">
              <Activity className="h-3 w-3 animate-pulse" />
              <span>Campus Clinical Triage Hub</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
              Counselor Triage & Student Support
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Real-time campus mental wellness telemetry. Prioritize interventions using validated screeners, behavioral risk signals, and sentiment shifts.
            </p>
          </div>

          {/* 3 Core Triage Questions Quick Glance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 lg:w-auto shrink-0">
            <div className="p-3 rounded-xl bg-background/60 border border-border/70 flex flex-col">
              <span className="text-[10px] font-extrabold uppercase text-rose-500 tracking-wider">1. Who Needs Care</span>
              <span className="text-sm font-bold text-foreground mt-0.5">
                {pendingAlerts.length} Urgent Flag{pendingAlerts.length === 1 ? "" : "s"}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">Awaiting counselor claim</span>
            </div>

            <div className="p-3 rounded-xl bg-background/60 border border-border/70 flex flex-col">
              <span className="text-[10px] font-extrabold uppercase text-amber-500 tracking-wider">2. Primary Drivers</span>
              <span className="text-sm font-bold text-foreground mt-0.5">PHQ-9 & Sleep Spikes</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">Late-night app patterns</span>
            </div>

            <div className="p-3 rounded-xl bg-background/60 border border-border/70 flex flex-col">
              <span className="text-[10px] font-extrabold uppercase text-emerald-500 tracking-wider">3. Immediate Action</span>
              <span className="text-sm font-bold text-foreground mt-0.5">
                {pendingAlerts.length > 0 ? "Triage Top Alert" : "All Caught Up"}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">Review dossier & claim</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. OVERVIEW VIEW */}
      {isOverviewPage && (
        <div className="space-y-6">
          {/* Summary metrics row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="wellness-card border-l-4 border-l-rose-500 p-5 flex flex-col justify-between shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">Active Alerts Queue</span>
                  <h4 className="text-3xl font-black text-rose-500 mt-1 tracking-tight">
                    {pendingAlerts.length}
                  </h4>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <AlertCircle className="h-5 w-5 animate-pulse" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 font-medium">Urgent flags awaiting counselor assessment</p>
            </Card>

            <Card className="wellness-card border-l-4 border-l-amber-500 p-5 flex flex-col justify-between shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">Under Active Review</span>
                  <h4 className="text-3xl font-black text-amber-500 mt-1 tracking-tight">
                    {reviewedAlerts.length}
                  </h4>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 font-medium">Claimed cases actively being triaged</p>
            </Card>

            <Card className="wellness-card border-l-4 border-l-emerald-500 p-5 flex flex-col justify-between shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">Resolved Cases</span>
                  <h4 className="text-3xl font-black text-emerald-500 mt-1 tracking-tight">
                    {resolvedAlerts.length}
                  </h4>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 font-medium">Interventions successfully concluded</p>
            </Card>
          </div>

          {/* Quick links header */}
          <div className="flex justify-between items-center border-b border-border/50 pb-3">
            <div>
              <h3 className="text-foreground text-sm md:text-base font-extrabold flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />
                High-Priority Student Intervention Queue
              </h3>
              <p className="text-muted-foreground text-xs md:text-sm mt-0.5">
                Students flagged by behavioral dips, low check-in scores, or distress screeners.
              </p>
            </div>
            <NavLink to="/counselor/alerts" className="text-xs md:text-sm font-bold text-primary hover:underline flex items-center gap-1">
              <span>View All Alerts</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </NavLink>
          </div>

          {/* Priority Alerts Queue Table */}
          <Card className="overflow-hidden border border-border/80 shadow-xs">
            <CardContent className="p-0">
              {isAlertsLoading ? (
                <div className="space-y-3 p-6">
                  <div className="h-10 rounded-xl bg-muted/40 animate-pulse" />
                  <div className="h-10 rounded-xl bg-muted/40 animate-pulse" />
                </div>
              ) : pendingAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-12">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-3">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-foreground font-bold text-sm">No Pending Warnings</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">All students are currently within baseline wellness parameters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-border/60 text-muted-foreground font-bold bg-muted/20">
                        <th className="p-3.5 uppercase tracking-wider">Who (Student)</th>
                        <th className="p-3.5 uppercase tracking-wider">Severity</th>
                        <th className="p-3.5 uppercase tracking-wider">Detected Risk Driver (Why)</th>
                        <th className="p-3.5 uppercase tracking-wider">Flagged At</th>
                        <th className="p-3.5 uppercase tracking-wider text-right">Intervention Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {pendingAlerts.slice(0, 6).map((alert) => (
                        <tr 
                          key={alert.id}
                          className="hover:bg-accent/20 cursor-pointer group transition-colors"
                          onClick={() => setSelectedStudentId(alert.student_id)}
                        >
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs">
                                ST
                              </div>
                              <div>
                                <span className="font-bold text-foreground group-hover:text-primary transition-colors block">
                                  Student #{alert.student_id.substring(0, 8)}
                                </span>
                                <span className="text-[11px] text-muted-foreground font-mono">
                                  ID: {alert.student_id.substring(0, 14)}...
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="badge-high-risk px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                              CRITICAL
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 text-xs text-foreground/80 font-medium">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              <span>Sustained Low Check-In Score / Behavioral Signal</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-muted-foreground text-xs">
                            {new Date(alert.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="p-3.5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(alert.id, "REVIEWED")}
                              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs h-7.5 px-3 rounded-lg shadow-xs"
                            >
                              Claim Case
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedStudentId(alert.student_id)}
                              className="text-xs h-7.5 px-2.5 rounded-lg border-border/80"
                            >
                              Dossier
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booked Appointments Table */}
          <div className="pt-4">
            <div className="flex justify-between items-center border-b border-border/50 pb-3 mb-3">
              <div>
                <h3 className="text-foreground text-sm md:text-base font-extrabold flex items-center gap-2">
                  <Calendar className="h-4.5 w-4.5 text-primary" />
                  Scheduled Student Appointments
                </h3>
                <p className="text-muted-foreground text-xs md:text-sm mt-0.5">1-on-1 virtual consultations and in-person intake requests</p>
              </div>
              <span className="text-xs font-bold text-primary px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                {appointmentsList.length} Sessions
              </span>
            </div>

            <Card className="overflow-hidden border border-border/80 shadow-xs">
              <CardContent className="p-0">
                {isAppointmentsLoading ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">Loading appointment queue...</div>
                ) : appointmentsList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-8">
                    <Calendar className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-xs text-muted-foreground font-medium">No student sessions currently scheduled.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs md:text-sm">
                      <thead>
                        <tr className="border-b border-border/50 text-muted-foreground font-bold bg-muted/20">
                          <th className="p-3.5 uppercase tracking-wider">Scheduled Date</th>
                          <th className="p-3.5 uppercase tracking-wider">Student ID</th>
                          <th className="p-3.5 uppercase tracking-wider">Format</th>
                          <th className="p-3.5 uppercase tracking-wider">Concern / Reason</th>
                          <th className="p-3.5 uppercase tracking-wider">Status</th>
                          <th className="p-3.5 uppercase tracking-wider text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {appointmentsList.map((app) => (
                          <tr key={app.id} className="hover:bg-accent/20 transition-colors">
                            <td className="p-3.5 text-foreground font-medium">
                              {new Date(app.scheduled_time).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="p-3.5 font-mono text-xs text-primary">
                              {app.student_id.substring(0, 8)}...
                            </td>
                            <td className="p-3.5">
                              <span className="text-xs font-medium px-2 py-0.5 rounded bg-accent/40 border border-border">
                                {app.appointment_type}
                              </span>
                            </td>
                            <td className="p-3.5 text-xs text-foreground/80 max-w-xs truncate">
                              {app.reason || "General Wellness"}
                            </td>
                            <td className="p-3.5">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide ${
                                app.status === "CONFIRMED"
                                  ? "badge-low-risk"
                                  : app.status === "PENDING"
                                  ? "badge-medium-risk"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {app.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-right space-x-2">
                              {app.status === "PENDING" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateAppointment(app.id, "CONFIRMED")}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-7 px-2.5 rounded-lg"
                                >
                                  Confirm
                                </Button>
                              )}
                              {app.status === "CONFIRMED" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateAppointment(app.id, "COMPLETED")}
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-7 px-2.5 rounded-lg"
                                >
                                  Mark Done
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 2. ALERTS DIRECTORY VIEW */}
      {isAlertsPage && (
        <div className="space-y-6">
          {/* Filters Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border/50 pb-4">
            <div>
              <h3 className="text-foreground text-base md:text-lg font-extrabold">Active Intervention Alerts</h3>
              <p className="text-muted-foreground text-xs md:text-sm mt-0.5">Triage high-risk clinical warnings flagged by student check-ins</p>
            </div>

            {/* Filter buttons */}
            <div className="flex bg-background/50 border border-border/70 p-0.5 rounded-lg">
              {(["PENDING", "REVIEWED", "RESOLVED", ""] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all duration-200 ${
                    statusFilter === filter
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {filter === "" ? "All Alerts" : filter}
                </button>
              ))}
            </div>
          </div>

          {/* Main Alerts Queue Table */}
          <Card className="border-border/60 bg-card overflow-hidden shadow-xs">
            <CardContent className="p-0">
              {isAlertsLoading ? (
                <div className="space-y-3 p-6">
                  <div className="h-10 rounded-xl bg-muted/40 animate-pulse" />
                  <div className="h-10 rounded-xl bg-muted/40 animate-pulse" />
                  <div className="h-10 rounded-xl bg-muted/40 animate-pulse" />
                </div>
              ) : !alertsData || alertsData.alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-16">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500/60 mb-3 animate-bounce" />
                  <h4 className="text-foreground font-bold text-sm">All caught up! No active warnings.</h4>
                  <p className="text-muted-foreground text-xs max-w-xs mt-1">There are no alerts matching the selected status filter.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-border/60 text-muted-foreground font-bold bg-muted/20">
                        <th className="p-4 uppercase tracking-wider">Created At</th>
                        <th className="p-4 uppercase tracking-wider">Student Reference</th>
                        <th className="p-4 uppercase tracking-wider">Risk Severity</th>
                        <th className="p-4 uppercase tracking-wider">Assessment ID</th>
                        <th className="p-4 uppercase tracking-wider">Workflow Status</th>
                        <th className="p-4 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {alertsData.alerts.map((alert) => (
                        <tr 
                          key={alert.id}
                          className="hover:bg-accent/20 cursor-pointer group transition-colors"
                          onClick={() => setSelectedStudentId(alert.student_id)}
                        >
                          <td className="p-4 text-muted-foreground">
                            {new Date(alert.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="p-4 font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                            <UserIcon className="h-3.5 w-3.5 text-muted-foreground/60" />
                            {alert.student_id.substring(0, 8)}...
                          </td>
                          <td className="p-4">
                            <span className="badge-high-risk px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
                              HIGH RISK
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground font-mono text-xs">{alert.assessment_id.substring(0, 12)}...</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 font-bold ${
                              alert.status === "PENDING" 
                                ? "text-red-500" 
                                : alert.status === "REVIEWED" 
                                ? "text-amber-500" 
                                : "text-emerald-500"
                            }`}>
                              {alert.status === "PENDING" && <Clock className="h-3.5 w-3.5" />}
                              {alert.status === "REVIEWED" && <Clock className="h-3.5 w-3.5 animate-spin" />}
                              {alert.status === "RESOLVED" && <CheckCircle2 className="h-3.5 w-3.5" />}
                              {alert.status}
                            </span>
                          </td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2 justify-end">
                              {alert.status === "PENDING" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusChange(alert.id, "REVIEWED")}
                                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs h-8 px-3 rounded-lg"
                                >
                                  Claim Alert
                                </Button>
                              )}
                              {alert.status !== "RESOLVED" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusChange(alert.id, "RESOLVED")}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-8 px-3 rounded-lg"
                                >
                                  Close Alert
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedStudentId(alert.student_id)}
                                className="text-muted-foreground hover:text-foreground h-8 px-2 text-xs flex items-center"
                              >
                                Profile <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. STUDENT DIRECTORY / RECORDS VIEW */}
      {isStudentsPage && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border/50 pb-4">
            <div>
              <h3 className="text-foreground text-base md:text-lg font-extrabold">Student Wellness Directory</h3>
              <p className="text-muted-foreground text-xs md:text-sm mt-0.5">Explore active clinical case folders matching institutional alerts</p>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search Student ID..."
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
              className="h-8.5 w-52 rounded-xl border border-border/70 bg-background/50 px-3 text-xs md:text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Student Grid */}
          {isAlertsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-32 rounded-xl bg-muted/40 animate-pulse border border-border/70" />
              <div className="h-32 rounded-xl bg-muted/40 animate-pulse border border-border/70" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <h4 className="text-foreground font-semibold text-xs md:text-sm">No student case files found</h4>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => (
                <Card 
                  key={student.studentId}
                  onClick={() => setSelectedStudentId(student.studentId)}
                  className="border-border/60 bg-card hover:bg-accent/30 cursor-pointer transition-all p-5 rounded-2xl hover:border-primary/30 hover:shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xs md:text-sm border border-primary/20">
                        ST
                      </div>
                      <div>
                        <h4 className="font-extrabold text-foreground text-xs md:text-sm leading-snug">Student Case Dossier</h4>
                        <p className="text-muted-foreground text-xs font-mono">ID: {student.studentId.substring(0, 12)}...</p>
                      </div>
                    </div>

                    <div className="border-t border-border/50 pt-2.5 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Alert Incidents:</span>
                        <span className="font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                          {student.alertCount} Flag{student.alertCount === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Incident:</span>
                        <span className="text-foreground font-medium">{new Date(student.lastAlert).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-primary font-bold mt-4 tracking-wider uppercase flex items-center gap-1 group">
                    <span>Open Case Dossier</span>
                    <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Slide-out Student Profile Detail Panel (Right Sidebar Sheet) */}
      {selectedStudentId && (
        <StudentDetailSheet 
          studentId={selectedStudentId} 
          onClose={() => setSelectedStudentId(null)} 
        />
      )}
    </div>
  );
};

// Sub-component rendering the student profile modal (slide-out Sheet details)
interface StudentDetailSheetProps {
  studentId: string;
  onClose: () => void;
}

const StudentDetailSheet: React.FC<StudentDetailSheetProps> = ({ studentId, onClose }) => {
  const { theme } = useTheme();
  // 1. Load details using react-query hooks
  const { data: latestAssessment, isLoading: isProfileLoading } = useLatestAssessment(studentId);
  const { data: moodHistory, isLoading: isHistoryLoading } = useMoodHistory("7d", studentId);

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200" 
        onClick={onClose} 
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-card border-l border-border shadow-2xl z-50 flex flex-col justify-between animate-in slide-in-from-right duration-300 text-foreground">
      
      {/* Header */}
      <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm md:text-base text-foreground">Student Clinical Dossier</h4>
            <p className="text-muted-foreground text-xs font-mono">ID: {studentId.substring(0, 18)}...</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body details */}
      <div className="flex-1 p-5 md:p-6 space-y-5 overflow-y-auto">
        {isProfileLoading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-xs md:text-sm text-muted-foreground">Loading student clinical indicators...</p>
          </div>
        ) : !latestAssessment ? (
          <div className="p-8 text-center text-muted-foreground text-xs">
            No assessment records found for this student.
          </div>
        ) : (
          <>
            {/* Clinical Breakdown: "Why was this student flagged?" */}
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2.5">
              <Stethoscope className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-foreground">Clinical Explainability</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                  Flagged due to multi-modal indicators: PHQ-9 screener score, self-reported negative affect, or irregular nighttime app activity.
                </p>
              </div>
            </div>

            {/* Risk details block */}
            <div className="grid grid-cols-2 gap-3.5">
              <Card className="border-border/60 bg-muted/10 p-4 rounded-xl">
                <p className="text-muted-foreground text-[10px] font-extrabold uppercase tracking-wider">Mental Wellness Score</p>
                <h5 className="text-2xl font-extrabold text-foreground mt-1">
                  {Number(latestAssessment.mental_wellness_score).toFixed(1)}
                </h5>
                <p className="text-muted-foreground text-[11px] mt-0.5">Scale: 0.0 - 100.0</p>
              </Card>

              <Card className="border-border/60 bg-muted/10 p-4 rounded-xl">
                <p className="text-muted-foreground text-[10px] font-extrabold uppercase tracking-wider">Risk Classification</p>
                <h5 className="text-2xl font-extrabold text-foreground mt-1 flex items-center gap-1.5">
                  <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                  <span className="text-rose-500">{latestAssessment.risk_level}</span>
                </h5>
                <p className="text-muted-foreground text-[11px] mt-0.5">Action: Clinical Intake</p>
              </Card>
            </div>

            {/* Emotions detected */}
            <Card className="border-border/60 bg-card p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <p className="text-muted-foreground text-[11px] font-extrabold uppercase tracking-wider">NLP Sentiment & Emotion Probabilities</p>
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="space-y-2.5">
                {Object.entries(latestAssessment.emotions_detected).map(([emotion, prob]) => (
                  <div key={emotion} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="capitalize text-foreground/90">{emotion}</span>
                      <span className="text-muted-foreground">{(prob * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(prob * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recharts history chart */}
            <Card className="border-border/60 bg-card p-4 rounded-xl shadow-xs">
              <p className="text-muted-foreground text-[11px] font-extrabold uppercase tracking-wider mb-3">
                7-Day Self-Reported Trajectory
              </p>
              <div className="h-44">
                {isHistoryLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={moodHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="logged_at" stroke={theme === "dark" ? "#475569" : "#94a3b8"} fontSize={9} tickFormatter={(str) => {
                        try {
                          return new Date(str).toLocaleDateString([], { month: "short", day: "numeric" });
                        } catch {
                          return str;
                        }
                      }} />
                      <YAxis stroke={theme === "dark" ? "#475569" : "#94a3b8"} fontSize={9} domain={[1, 10]} />
                      <Tooltip contentStyle={{ backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "11px" }} />
                      <Line type="monotone" dataKey="self_reported_score" name="Score" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/20 text-center">
        <Button 
          onClick={onClose}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs md:text-sm py-2.5 rounded-xl transition-all shadow-xs"
        >
          Close Case Dossier
        </Button>
      </div>
    </div>
    </>
  );
};

export default CounselorDashboard;

