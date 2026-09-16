import React, { useState } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  adminAPI, 
  DepartmentRiskItem, 
  AdminUserItem 
} from "@/services/api";
import { useInstitutionReport } from "@/hooks/useAnalytics";
import { useCounselorAlerts } from "@/hooks/useAlerts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell 
} from "recharts";
import { 
  Users, Activity, AlertTriangle, Sparkles, Loader2, Plus, Search, 
  UserCheck, Shield, Building2, CheckCircle2, XCircle, ArrowRight, RefreshCw, Power
} from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [userPage, setUserPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusActionId, setStatusActionId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 1. Fetch User Directory
  const { data: directoryData, isLoading: isDirectoryLoading, refetch: refetchUsers } = useQuery({
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
    onSuccess: (updatedUser) => {
      setStatusActionId(null);
      setStatusMessage(`User account status successfully updated.`);
      setTimeout(() => setStatusMessage(null), 4000);
      queryClient.invalidateQueries({ queryKey: ["admin-user-directory"] });
    },
    onError: (err: any) => {
      setStatusActionId(null);
      const detail = err?.response?.data?.detail?.message || "Failed to update account status. You cannot deactivate your own admin account.";
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

  // Fallback monthly data for bar chart
  const monthlyTrends = [
    { name: "Jan", score: 65.4 },
    { name: "Feb", score: 66.8 },
    { name: "Mar", score: 64.5 },
    { name: "Apr", score: 67.2 },
    { name: "May", score: 68.0 },
    { name: "Jun", score: report?.average_wellness_score || 68.4 }
  ];

  // Pie chart risk distribution formatting
  const riskData = report ? [
    { name: "Low Risk", value: report.risk_distribution.LOW, color: "#10b981" },
    { name: "Medium Risk", value: report.risk_distribution.MEDIUM, color: "#f59e0b" },
    { name: "High Risk", value: report.risk_distribution.HIGH, color: "#ef4444" }
  ] : [];

  const pendingAlertCount = alertsData?.total ?? alertsData?.alerts.length ?? 0;

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  const isReportsPage = path === "/admin/reports";
  const isDirectoryPage = path === "/admin/directory";
  const isOverviewPage = path === "/admin/dashboard" || (!isReportsPage && !isDirectoryPage);

  // Filtered users for search query
  const filteredUsers = directoryData?.users.filter((u: AdminUserItem) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
  }) || [];

  return (
    <div className="space-y-6 min-h-[calc(100vh-80px)] text-foreground">
      {/* Toast / Status banner */}
      {statusMessage && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
          statusMessage.startsWith("Error")
            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.startsWith("Error") ? (
              <XCircle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs hover:underline opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* 1. OVERVIEW VIEW */}
      {isOverviewPage && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border/50 pb-4">
            <div>
              <h3 className="text-foreground text-base md:text-lg font-extrabold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Institutional Wellness & Governance Overview
              </h3>
              <p className="text-muted-foreground text-xs md:text-sm mt-0.5">
                Macro-level dashboard showing aggregated student wellness indices, academic departmental health, and compliance.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <NavLink to="/admin/audit-logs">
                <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5 border-border/70 hover:bg-accent/20">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  Audit Trail
                </Button>
              </NavLink>
              <NavLink to="/admin/directory">
                <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5 border-border/70 hover:bg-accent/20">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  User Directory
                </Button>
              </NavLink>
            </div>
          </div>

          {/* Quick Info Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="wellness-card border-l-4 border-l-primary p-5 flex flex-col justify-between shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">Campus Wellness Index</span>
                  <h4 className="text-3xl font-black text-primary mt-1 tracking-tight">
                    {isReportLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : (
                      report?.average_wellness_score.toFixed(1) ?? "0.0"
                    )}
                  </h4>
                </div>
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Activity className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 font-medium">Aggregated continuous wellness score</p>
            </Card>

            <Card className="wellness-card border-l-4 border-l-rose-500 p-5 flex flex-col justify-between shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">Active Alerts Queue</span>
                  <h4 className="text-3xl font-black text-rose-500 mt-1 tracking-tight">
                    {isAlertsLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
                    ) : (
                      pendingAlertCount
                    )}
                  </h4>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <AlertTriangle className="h-5 w-5 animate-pulse" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 font-medium">Elevated risk cases awaiting counselor triage</p>
            </Card>

            <Card className="wellness-card border-l-4 border-l-indigo-500 p-5 flex flex-col justify-between shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">Monitored Students</span>
                  <h4 className="text-3xl font-black text-foreground mt-1 tracking-tight">
                    {isReportLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      report?.total_students_monitored ?? 0
                    )}
                  </h4>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 font-medium">Active enrolled student cohort accounts</p>
            </Card>

            <Card className="wellness-card border-l-4 border-l-emerald-500 p-5 flex flex-col justify-between shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">Academic Departments</span>
                  <h4 className="text-3xl font-black text-emerald-500 mt-1 tracking-tight">
                    {isDeptRiskLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                    ) : (
                      deptRiskData?.total_departments ?? 5
                    )}
                  </h4>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 font-medium">Departments under continuous telemetry</p>
            </Card>
          </div>

          {/* Risk distribution Breakdown + Triage instructions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 p-6 flex flex-col justify-between wellness-card shadow-xs">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <h4 className="font-extrabold text-sm md:text-base text-foreground">Governance & Clinical Safety</h4>
                </div>
                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
                  MindGuardAI evaluates longitudinal check-ins and screening metrics under strict HIPAA/FERPA guidelines. 
                  Administrators monitor aggregated macro patterns while clinical details are restricted to licensed counselors with explicit student consent.
                </p>
              </div>
              <div className="border-t border-border/50 pt-4 mt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Engine</span>
                  <span className="text-emerald-500 font-bold">Operational (v1.0.4)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ML Explainability (SHAP)</span>
                  <span className="text-primary font-bold">Enabled</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Compliance Logging</span>
                  <span className="text-emerald-500 font-bold">Auditing Active</span>
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-2 overflow-hidden wellness-card shadow-xs">
              <CardHeader>
                <CardTitle className="text-foreground text-sm md:text-base font-extrabold">Campus Risk Distribution</CardTitle>
                <CardDescription className="text-muted-foreground text-xs md:text-sm">Distribution of monitored students across risk tiers.</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px] flex flex-col justify-between">
                <div className="flex-1 min-h-[180px]">
                  {isReportLoading ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={riskData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {riskData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ 
                            backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff", 
                            border: "1px solid var(--border)", 
                            borderRadius: "12px" 
                          }}
                          itemStyle={{ fontSize: "12px", color: "var(--foreground)" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Legend List */}
                <div className="flex justify-around border-t border-border/40 pt-3 pb-1">
                  {riskData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <div className="text-left">
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{item.name}</p>
                        <p className="text-xs md:text-sm font-black text-foreground">{item.value}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Departmental Risk & Wellness Breakdown Matrix */}
          <Card className="wellness-card overflow-hidden shadow-xs">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-4">
              <div>
                <CardTitle className="text-foreground text-sm md:text-base font-extrabold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Academic Department Wellness & Risk Heatmap
                </CardTitle>
                <CardDescription className="text-muted-foreground text-xs md:text-sm">
                  Comparative analysis of student cohorts across faculties to target preventative campus wellness initiatives.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isDeptRiskLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !deptRiskData || deptRiskData.departments.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No departmental records found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-border/50 text-muted-foreground font-bold bg-background/30">
                        <th className="p-4 uppercase tracking-wider">Department Name</th>
                        <th className="p-4 uppercase tracking-wider">Students Monitored</th>
                        <th className="p-4 uppercase tracking-wider">Avg Wellness Score</th>
                        <th className="p-4 uppercase tracking-wider">Risk Composition</th>
                        <th className="p-4 uppercase tracking-wider text-right">High Risk Alert Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {deptRiskData.departments.map((dept: DepartmentRiskItem, idx: number) => {
                        const total = dept.student_count || 1;
                        const lowPct = Math.round((dept.low_risk_count / total) * 100);
                        const medPct = Math.round((dept.medium_risk_count / total) * 100);
                        const highPct = Math.max(0, 100 - lowPct - medPct);

                        return (
                          <tr key={idx} className="hover:bg-accent/10 transition-colors">
                            <td className="p-4 font-bold text-foreground">
                              {dept.department}
                            </td>
                            <td className="p-4 font-semibold text-muted-foreground">
                              {dept.student_count}
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                dept.average_wellness_score >= 70
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : dept.average_wellness_score >= 50
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              }`}>
                                <Activity className="h-3 w-3" />
                                {dept.average_wellness_score.toFixed(1)} / 100
                              </span>
                            </td>
                            <td className="p-4 min-w-[180px]">
                              <div className="space-y-1">
                                <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden flex">
                                  <div style={{ width: `${lowPct}%` }} className="bg-emerald-500 h-full" title={`Low: ${lowPct}%`} />
                                  <div style={{ width: `${medPct}%` }} className="bg-amber-500 h-full" title={`Med: ${medPct}%`} />
                                  <div style={{ width: `${highPct}%` }} className="bg-rose-500 h-full" title={`High: ${highPct}%`} />
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                                  <span>L: {dept.low_risk_count}</span>
                                  <span>M: {dept.medium_risk_count}</span>
                                  <span>H: {dept.high_risk_count}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              {dept.high_risk_count > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                                  <AlertTriangle className="h-3 w-3" />
                                  {dept.high_risk_count} Elevated
                                </span>
                              ) : (
                                <span className="text-xs text-emerald-500 font-semibold flex items-center justify-end gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Nominal
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. REPORTS VIEW */}
      {isReportsPage && (
        <div className="space-y-6">
          {/* Top Banner / Filter Area */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/50 pb-4">
            <div>
              <h3 className="text-foreground text-base md:text-lg font-extrabold">Campus Stress Indices & Longitudinal Trendlines</h3>
              <p className="text-muted-foreground text-xs md:text-sm mt-0.5">Macro-level dashboard showing longitudinal wellness trajectories filtered by timeline.</p>
            </div>

            {/* Date Filters Form */}
            <div className="flex flex-wrap items-end gap-3 bg-background/40 p-3 rounded-xl border border-border/70">
              <div className="space-y-1">
                <Label htmlFor="start-date" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 text-xs md:text-sm bg-background border-border/70 text-foreground w-36"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="end-date" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 text-xs md:text-sm bg-background border-border/70 text-foreground w-36"
                />
              </div>
              {(startDate || endDate) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-8 text-xs md:text-sm text-muted-foreground hover:text-foreground border-border/70 bg-background"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Bar Chart wellness scores monthly trends */}
          <Card className="wellness-card overflow-hidden shadow-xs">
            <CardHeader>
              <CardTitle className="text-foreground text-sm md:text-base font-extrabold">Aggregated Monthly Trajectory</CardTitle>
              <CardDescription className="text-muted-foreground text-xs md:text-sm">Institutional average Mental Wellness Score (0-100) trend over recent semester checkpoints.</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              {isReportLoading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" stroke={theme === "dark" ? "#475569" : "#94a3b8"} fontSize={10} />
                    <YAxis stroke={theme === "dark" ? "#475569" : "#94a3b8"} fontSize={10} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff", 
                        border: "1px solid var(--border)", 
                        borderRadius: "12px" 
                      }} 
                      labelStyle={{ color: "var(--muted-foreground)", fontSize: "11px", fontWeight: "bold" }}
                      itemStyle={{ fontSize: "12px", color: "var(--foreground)" }}
                    />
                    <Bar dataKey="score" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. USER DIRECTORY VIEW */}
      {isDirectoryPage && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border/50 pb-4">
            <div>
              <h3 className="text-foreground text-base md:text-lg font-extrabold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Institution User Directory & Access Governance
              </h3>
              <p className="text-muted-foreground text-xs md:text-sm mt-0.5">
                Audit and manage all student, counselor, and administrator platform accounts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <NavLink to="/admin/audit-logs">
                <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5 border-border/70">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  Audit Logs
                </Button>
              </NavLink>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchUsers()}
                className="h-8 text-xs font-semibold gap-1.5 border-border/70"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters Bar: Search & Role Filters */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 items-center bg-background/40 p-3 rounded-xl border border-border/70">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by email or UUID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-background border-border/70 text-foreground"
              />
            </div>

            {/* Role filter buttons */}
            <div className="flex bg-background/60 border border-border/70 p-0.5 rounded-lg shrink-0">
              {([
                { label: "All Roles", value: "" },
                { label: "Students", value: "STUDENT" },
                { label: "Counselors", value: "COUNSELOR" },
                { label: "Admins", value: "ADMIN" }
              ] as const).map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => {
                    setRoleFilter(filter.value);
                    setUserPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all duration-200 ${
                    roleFilter === filter.value
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* User Table card */}
          <Card className="wellness-card overflow-hidden shadow-xs">
            <CardContent className="p-0">
              {isDirectoryLoading ? (
                <div className="space-y-3 p-6">
                  <div className="h-10 rounded-xl bg-muted/40 animate-pulse" />
                  <div className="h-10 rounded-xl bg-muted/40 animate-pulse" />
                  <div className="h-10 rounded-xl bg-muted/40 animate-pulse" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <h4 className="text-foreground font-semibold text-xs">No registered accounts found matching criteria</h4>
                </div>
              ) : (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs md:text-sm">
                      <thead>
                        <tr className="border-b border-border/50 text-muted-foreground font-bold bg-background/30">
                          <th className="p-4 uppercase tracking-wider">User Reference</th>
                          <th className="p-4 uppercase tracking-wider">Email Address</th>
                          <th className="p-4 uppercase tracking-wider">Access Role</th>
                          <th className="p-4 uppercase tracking-wider">Account State</th>
                          <th className="p-4 uppercase tracking-wider text-right">Governance Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {filteredUsers.map((user: AdminUserItem) => {
                          const isProcessing = statusActionId === user.id;

                          return (
                            <tr key={user.id} className="hover:bg-accent/10 transition-colors">
                              <td className="p-4 font-mono text-muted-foreground text-xs">
                                {user.id.substring(0, 18)}...
                              </td>
                              <td className="p-4 font-bold text-foreground">{user.email}</td>
                              <td className="p-4">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${
                                  user.role === "STUDENT" 
                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                    : user.role === "COUNSELOR"
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                    : "bg-primary/10 text-primary border border-primary/20"
                                }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1 font-bold ${
                                  user.is_active ? "text-emerald-500" : "text-rose-500"
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${
                                    user.is_active ? "bg-emerald-500" : "bg-rose-500"
                                  }`} />
                                  {user.is_active ? "Active" : "Disabled"}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isProcessing}
                                  onClick={() => statusMutation.mutate({ userId: user.id, newStatus: !user.is_active })}
                                  className={`h-7 px-3 text-xs font-semibold rounded-lg transition-all ${
                                    user.is_active
                                      ? "text-rose-500 hover:bg-rose-500/10 border-rose-500/30"
                                      : "text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/30"
                                  }`}
                                >
                                  {isProcessing ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  ) : (
                                    <Power className="h-3 w-3 mr-1" />
                                  )}
                                  {user.is_active ? "Deactivate" : "Activate"}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {directoryData && directoryData.total_pages > 1 && (
                    <div className="flex justify-between items-center border-t border-border/40 p-4 bg-background/20 text-xs">
                      <Button
                        disabled={userPage === 1}
                        onClick={() => setUserPage(userPage - 1)}
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        Previous
                      </Button>
                      <span className="text-muted-foreground font-semibold">
                        Page {directoryData.page} of {directoryData.total_pages}
                      </span>
                      <Button
                        disabled={userPage >= directoryData.total_pages}
                        onClick={() => setUserPage(userPage + 1)}
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
