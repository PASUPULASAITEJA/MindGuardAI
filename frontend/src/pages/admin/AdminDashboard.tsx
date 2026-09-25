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

  // 2. Fetch Department Risk Matrix (Real Database Data)
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

  // 4. Institutional Analytics Report (Real Database Data)
  const { data: report, isLoading: isReportLoading } = useInstitutionReport(
    startDate || undefined,
    endDate || undefined
  );
  
  const { data: alertsData, isLoading: isAlertsLoading } = useCounselorAlerts("PENDING");

  // 5. Academic Calendar & Milestone Impact Trends (Real Database Data)
  const { data: academicTrendsData, isLoading: isAcademicTrendsLoading } = useQuery({
    queryKey: ["academic-trends"],
    queryFn: () => academicAPI.getPeriodTrends(),
    staleTime: 5 * 60 * 1000
  });

  const riskData = report ? [
    { name: "Stable / Optimal", value: report.risk_distribution.LOW, color: "#10b981" },
    { name: "Moderate Strain", value: report.risk_distribution.MEDIUM, color: "#f59e0b" },
    { name: "Elevated Risk", value: report.risk_distribution.HIGH, color: "#ef4444" }
  ].filter(r => r.value > 0) : [];

  const pendingAlertCount = alertsData?.total ?? alertsData?.alerts?.length ?? 0;

  const isReportsPage = path === "/admin/reports";
  const isDirectoryPage = path === "/admin/directory";
  const isOverviewPage = path === "/admin/dashboard" || (!isReportsPage && !isDirectoryPage);

  const filteredUsers = directoryData?.users.filter((u: AdminUserItem) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
  }) || [];

  const academicPeriods: AcademicPeriodTrendItem[] = academicTrendsData || [];
  const departmentsList: DepartmentRiskItem[] = deptRiskData?.departments || [];

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
                {isReportLoading ? "--" : (report?.average_wellness_score ? report.average_wellness_score.toFixed(1) : "--")}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">Aggregated campus metric</span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
              <span className="text-[11px] text-muted-foreground uppercase font-medium block">Total Students</span>
              <span className="text-2xl font-bold text-foreground font-sans mt-1 block">
                {report?.total_students_monitored ?? 0}
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
                {departmentsList.length}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">Active cohort departments</span>
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
                    Observed aggregate trends during distinct academic periods
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md border border-border">
                <Lock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span>k-Anonymity Guard (k ≥ 10)</span>
              </div>
            </div>

            {isAcademicTrendsLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Loading academic trends...</div>
            ) : academicPeriods.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                <CalendarRange className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1" />
                <p className="font-medium text-foreground">No academic calendar periods logged yet.</p>
                <p className="text-[11px]">Academic events registered in the system will correlate aggregate wellbeing changes during exams and milestones.</p>
              </div>
            ) : (
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
                            {period.observed_average_stress > 0 ? `${period.observed_average_stress.toFixed(1)} / 10` : "No data"}
                          </span>
                        </td>
                        <td>
                          {period.observed_average_wellness > 0 ? (
                            <span><span className="font-semibold font-mono text-foreground">{period.observed_average_wellness.toFixed(1)}</span> / 100</span>
                          ) : (
                            <span className="text-muted-foreground">No data</span>
                          )}
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
            )}
            <p className="text-[11px] text-muted-foreground italic">
              Note: Data reflects observed aggregate trend during the academic period. No individual responses or identifiers are exposed.
            </p>
          </Card>

          {/* Department Analytics Table with Privacy Threshold */}
          <Card className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Academic Department Risk & Wellbeing Breakdown</h3>
                <p className="text-xs text-muted-foreground">
                  Aggregated department statistics with strict k-anonymity privacy protection (k ≥ 10 threshold)
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md border border-border">
                <Lock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span>k-Anonymity Aggregated (k ≥ 10)</span>
              </div>
            </div>

            {isDeptRiskLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Loading department data...</div>
            ) : departmentsList.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                <Building2 className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1" />
                <p className="font-medium text-foreground">No student assessment data recorded by department yet.</p>
                <p className="text-[11px]">Department wellness aggregations will appear as students submit validated check-ins.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="saas-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Cohort Population</th>
                      <th>Aggregate Wellbeing</th>
                      <th>Low Strain</th>
                      <th>Moderate Strain</th>
                      <th>Elevated Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentsList.map((d) => {
                      const isCohortTooSmall = d.student_count < 10;
                      return (
                        <tr key={d.department}>
                          <td className="font-semibold text-foreground text-xs">{d.department}</td>
                          <td>{d.student_count} students</td>
                          <td>
                            {isCohortTooSmall ? (
                              <span className="text-xs text-muted-foreground italic">Insufficient data for aggregate display (k &lt; 10)</span>
                            ) : (
                              <span><span className="font-semibold text-foreground font-mono">{d.average_wellness_score}</span> / 100</span>
                            )}
                          </td>
                          <td>
                            {isCohortTooSmall ? (
                              <span className="text-muted-foreground">--</span>
                            ) : (
                              <span className="badge-stable text-[10px]">{d.low_risk_count}</span>
                            )}
                          </td>
                          <td>
                            {isCohortTooSmall ? (
                              <span className="text-muted-foreground">--</span>
                            ) : (
                              <span className="badge-moderate text-[10px]">{d.medium_risk_count}</span>
                            )}
                          </td>
                          <td>
                            {isCohortTooSmall ? (
                              <span className="text-muted-foreground">--</span>
                            ) : (
                              <span className="badge-elevated text-[10px]">{d.high_risk_count}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
