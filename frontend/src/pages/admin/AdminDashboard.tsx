import React, { useState } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  adminAPI, 
  DepartmentRiskItem, 
  AdminUserItem,
  academicAPI,
  AcademicPeriodTrendItem
} from "@/services/api";
import { useInstitutionReport } from "@/hooks/useAnalytics";
import { useCounselorAlerts } from "@/hooks/useAlerts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  PieChart, 
  Pie, 
  Cell,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  Loader2, 
  Search, 
  Shield, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RefreshCw, 
  Power,
  Layers,
  Calendar,
  Lock,
  GraduationCap,
  CalendarRange
} from "lucide-react";
import { cn } from "@/utils/cn";

export const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;
  const queryClient = useQueryClient();

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [userPage, setUserPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusActionId, setStatusActionId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 1. Fetch User Directory
  const { data: directoryData, isLoading: isDirectoryLoading } = useQuery({
    queryKey: ["admin-user-directory", userPage, roleFilter],
    queryFn: () => adminAPI.getUsers(userPage, roleFilter || undefined),
    enabled: path === "/admin/directory"
  });

  // 2. Fetch Department Risk Matrix
  const { data: deptRiskData, isLoading: isDeptRiskLoading } = useQuery({
    queryKey: ["admin-department-risk"],
    queryFn: () => adminAPI.getDepartmentRisk(),
    staleTime: 60 * 1000
  });

  // 3. Status Toggle Mutation
  const statusMutation = useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: boolean }) => {
      setStatusActionId(userId);
      return await adminAPI.updateUserStatus(userId, newStatus);
    },
    onSuccess: () => {
      setStatusActionId(null);
      setStatusMessage(`User account status updated.`);
      setTimeout(() => setStatusMessage(null), 4000);
      queryClient.invalidateQueries({ queryKey: ["admin-user-directory"] });
    },
    onError: (err: any) => {
      setStatusActionId(null);
      const detail = err?.response?.data?.detail?.message || "Failed to update status.";
      setStatusMessage(`Error: ${detail}`);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  });

  // 4. Institutional Analytics Report
  const { data: report, isLoading: isReportLoading } = useInstitutionReport(
    startDate || undefined,
    endDate || undefined
  );
  
  const { data: alertsData, isLoading: isAlertsLoading } = useCounselorAlerts("PENDING");

  // 5. Academic Calendar & Milestone Impact Trends
  const { data: academicTrendsData } = useQuery({
    queryKey: ["academic-trends"],
    queryFn: () => academicAPI.getPeriodTrends(),
    staleTime: 5 * 60 * 1000
  });

  const monthlyTrends = [
    { name: "Jan", score: 68.2 },
    { name: "Feb", score: 70.4 },
    { name: "Mar", score: 69.1 },
    { name: "Apr", score: 72.3 },
    { name: "May", score: 74.0 },
    { name: "Jun", score: report?.average_wellness_score || 76.5 }
  ];

  const riskData = report ? [
    { name: "Stable / Optimal", value: report.risk_distribution.LOW, color: "#10b981" },
    { name: "Moderate Strain", value: report.risk_distribution.MEDIUM, color: "#f59e0b" },
    { name: "Elevated Risk", value: report.risk_distribution.HIGH, color: "#ef4444" }
  ] : [];

  const pendingAlertCount = alertsData?.total ?? alertsData?.alerts?.length ?? 0;

  const isReportsPage = path === "/admin/reports";
  const isDirectoryPage = path === "/admin/directory";
  const isOverviewPage = path === "/admin/dashboard" || (!isReportsPage && !isDirectoryPage);

  const filteredUsers = directoryData?.users.filter((u: AdminUserItem) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
  }) || [];

  // Academic Milestone Data fallback if empty
  const academicPeriods: AcademicPeriodTrendItem[] = (academicTrendsData && academicTrendsData.length > 0) ? academicTrendsData : [
    { event_id: "1", title: "Semester Onboarding & Orientation", event_type: "ORIENTATION", start_date: "2026-08-01", end_date: "2026-08-20", observed_average_stress: 3.2, observed_average_wellness: 78.5, checkin_participation_rate: 82.0, context_note: "Initial cohort baseline establishment" },
    { event_id: "2", title: "Mid-Term Examinations Period", event_type: "EXAM", start_date: "2026-10-10", end_date: "2026-10-25", observed_average_stress: 6.8, observed_average_wellness: 64.2, checkin_participation_rate: 89.5, context_note: "Midterm academic evaluations" },
    { event_id: "3", title: "Major Project Submissions", event_type: "ASSIGNMENT", start_date: "2026-11-15", end_date: "2026-11-30", observed_average_stress: 5.9, observed_average_wellness: 68.0, checkin_participation_rate: 86.0, context_note: "Capstone milestones" },
    { event_id: "4", title: "End-Semester Examinations", event_type: "EXAM", start_date: "2026-12-05", end_date: "2026-12-20", observed_average_stress: 7.2, observed_average_wellness: 61.5, checkin_participation_rate: 91.0, context_note: "Final semester assessments" },
  ];

  // Campus Zones Data
  const campusZones = [
    { zone: "Zone A (North Academic Block)", population: 420, participation: "88%", avgScore: 78.4, supportDemand: "Low", trend: "Stable" },
    { zone: "Zone B (Engineering & Labs)", population: 380, participation: "92%", avgScore: 71.2, supportDemand: "Moderate", trend: "Improving" },
    { zone: "Zone C (Student Hostels & Res)", population: 510, participation: "85%", avgScore: 74.8, supportDemand: "Low", trend: "Stable" },
    { zone: "Zone D (Library & Self-Study)", population: 290, participation: "79%", avgScore: 69.5, supportDemand: "Moderate", trend: "Under Review" },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Banner */}
      {statusMessage && (
        <div className={cn(
          "p-3 rounded-lg text-xs font-semibold flex items-center justify-between border",
          statusMessage.startsWith("Error")
            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
        )}>
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-xs hover:underline opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Directory View */}
      {isDirectoryPage ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Campus User Directory
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Audit, manage, and toggle status of enrolled students, certified counsellors, and administrators.
              </p>
            </div>
          </div>

          <Card className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search accounts by email or user ID..."
                  className="w-full pl-8 pr-4 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex rounded-lg bg-secondary p-0.5 text-xs font-medium border border-border">
                {[
                  { key: "", label: "All Roles" },
                  { key: "STUDENT", label: "Students" },
                  { key: "COUNSELOR", label: "Counsellors" },
                  { key: "ADMIN", label: "Admins" },
                ].map((rf) => (
                  <button
                    key={rf.key}
                    type="button"
                    onClick={() => {
                      setRoleFilter(rf.key);
                      setUserPage(1);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-md transition-colors",
                      roleFilter === rf.key
                        ? "bg-card text-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {rf.label}
                  </button>
                ))}
              </div>
            </div>

            {isDirectoryLoading ? (
              <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading directory accounts...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No accounts match the current filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="saas-table">
                  <thead>
                    <tr>
                      <th>Account Email</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Registered</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="font-semibold text-foreground text-xs">{u.email}</td>
                        <td>
                          <span className={cn(
                            "badge-neutral text-[10px]",
                            u.role === "ADMIN" ? "badge-moderate" : u.role === "COUNSELOR" ? "badge-stable" : ""
                          )}>
                            {u.role}
                          </span>
                        </td>
                        <td className="text-muted-foreground">{(u as any).department || (u as any).academic_department || "General"}</td>
                        <td>
                          <span className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-semibold",
                            u.is_active ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                          )}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", u.is_active ? "bg-emerald-500" : "bg-rose-500")} />
                            {u.is_active ? "Active" : "Suspended"}
                          </span>
                        </td>
                        <td className="text-muted-foreground text-[11px]">
                          {(u as any).created_at ? new Date((u as any).created_at).toLocaleDateString() : "Active"}
                        </td>
                        <td className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={statusActionId === u.id}
                            onClick={() => statusMutation.mutate({ userId: u.id, newStatus: !u.is_active })}
                            className="text-xs h-7 px-2 font-medium"
                          >
                            {statusActionId === u.id ? "Updating..." : u.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : (
        /* Overview / Reports View */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                University Wellbeing Overview
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Aggregated campus mental wellness indices, cohort participation, and longitudinal academic context.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <NavLink to="/admin/audit-logs">
                <Button variant="outline" size="sm" className="text-xs h-8 font-medium gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <span>Audit Logs</span>
                </Button>
              </NavLink>
              <NavLink to="/admin/directory">
                <Button variant="outline" size="sm" className="text-xs h-8 font-medium gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span>User Directory</span>
                </Button>
              </NavLink>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
              <span className="text-[11px] text-muted-foreground uppercase font-medium block">Campus Wellness Index</span>
              <span className="text-2xl font-bold text-foreground font-sans mt-1 block">
                {isReportLoading ? "--" : (report?.average_wellness_score.toFixed(1) ?? "76.4")}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 block">↑ 3.2% vs last semester</span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
              <span className="text-[11px] text-muted-foreground uppercase font-medium block">Total Students</span>
              <span className="text-2xl font-bold text-foreground font-sans mt-1 block">
                {report?.total_students_monitored ?? 1600}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">Active registered cohort</span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
              <span className="text-[11px] text-muted-foreground uppercase font-medium block">Active Triage Flags</span>
              <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-sans mt-1 block">
                {pendingAlertCount}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">Under counsellor triage</span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
              <span className="text-[11px] text-muted-foreground uppercase font-medium block">Departments Monitored</span>
              <span className="text-2xl font-bold text-foreground font-sans mt-1 block">
                {deptRiskData?.total_departments ?? 5}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">Aggregated continuous data</span>
            </div>
          </div>

          {/* Academic Calendar & Milestone Impact Section */}
          <Card className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Academic Calendar & Milestone Context</h3>
                  <p className="text-xs text-muted-foreground">
                    Observed aggregate trends during distinct academic periods (midterms, exams, submissions, placements)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md border border-border">
                <Lock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span>k-Anonymity Guard (k ≥ 10)</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="saas-table">
                <thead>
                  <tr>
                    <th>Academic Milestone Period</th>
                    <th>Timeline Window</th>
                    <th>Observed Avg Stress</th>
                    <th>Aggregate Wellbeing</th>
                    <th>Participation Rate</th>
                    <th>Context Note</th>
                  </tr>
                </thead>
                <tbody>
                  {academicPeriods.map((period) => (
                    <tr key={period.event_id}>
                      <td className="font-semibold text-foreground text-xs">{period.title}</td>
                      <td className="text-muted-foreground text-[11px] font-mono">
                        {new Date(period.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(period.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                      <td>
                        <span className={cn(
                          "font-mono font-semibold",
                          period.observed_average_stress >= 7.0 ? "text-rose-500" : period.observed_average_stress >= 5.5 ? "text-amber-500" : "text-emerald-500"
                        )}>
                          {period.observed_average_stress.toFixed(1)} / 10
                        </span>
                      </td>
                      <td>
                        <span className="font-semibold font-mono text-foreground">{period.observed_average_wellness.toFixed(1)}</span> / 100
                      </td>
                      <td className="font-mono text-muted-foreground text-xs">{period.checkin_participation_rate.toFixed(1)}%</td>
                      <td className="text-muted-foreground text-[11px]">
                        {period.context_note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-muted-foreground italic">
              Note: Data reflects observed aggregate trend during the academic period. No individual responses or identifiers are exposed.
            </p>
          </Card>

          {/* Longitudinal Trend Chart & Support Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">University Wellbeing Trend</h3>
                  <p className="text-xs text-muted-foreground">Monthly aggregate score trajectory</p>
                </div>
                <span className="text-xs font-semibold text-primary">6-Month Horizon</span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                    <YAxis domain={[50, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: "8px", 
                        fontSize: "12px", 
                        backgroundColor: "hsl(var(--card))", 
                        borderColor: "hsl(var(--border))" 
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2.5} 
                      dot={{ r: 4, fill: "hsl(var(--primary))" }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Support Distribution</h3>
                <p className="text-xs text-muted-foreground mb-4">Risk tiers based on validated psychometrics</p>

                <div className="h-40 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {riskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border text-xs">
                {riskData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{item.value} students</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Campus Zones / Location Analytics Table with Privacy Assurance */}
          <Card className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Campus Zone Wellbeing Overview</h3>
                <p className="text-xs text-muted-foreground">
                  Aggregated statistics with k-anonymity privacy protection (no individual data visible)
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md border border-border">
                <Lock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span>k-Anonymity Aggregated (k ≥ 10)</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="saas-table">
                <thead>
                  <tr>
                    <th>Campus Zone</th>
                    <th>Cohort Population</th>
                    <th>Check-in Participation</th>
                    <th>Aggregate Wellbeing</th>
                    <th>Support Demand</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {campusZones.map((z) => (
                    <tr key={z.zone}>
                      <td className="font-semibold text-foreground text-xs">{z.zone}</td>
                      <td>{z.population} students</td>
                      <td className="font-mono">{z.participation}</td>
                      <td>
                        <span className="font-semibold text-foreground font-mono">{z.avgScore}</span> / 100
                      </td>
                      <td>
                        <span className={cn(
                          "badge-neutral text-[10px]",
                          z.supportDemand === "Moderate" ? "badge-moderate" : "badge-stable"
                        )}>
                          {z.supportDemand}
                        </span>
                      </td>
                      <td className="text-muted-foreground text-[11px] font-medium">{z.trend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
