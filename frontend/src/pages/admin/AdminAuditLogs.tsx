import React, { useState, useEffect } from "react";
import { 
  Shield, ShieldCheck, ShieldAlert, Clock, User, ArrowLeft, RefreshCw, 
  Search, Filter, ChevronLeft, ChevronRight, Eye, Code, FileText, Activity 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { auditAPI, AuditLogItem } from "@/services/api";

export const AdminAuditLogs: React.FC = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedMeta, setSelectedMeta] = useState<Record<string, any> | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await auditAPI.getAuditLogs({
        page,
        page_size: pageSize,
        action: actionFilter || undefined,
        actor_role: roleFilter || undefined,
      });
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err: any) {
      toast({
        title: "Error Loading Audit Logs",
        description: err.response?.data?.message || "Failed to retrieve audit trail records.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize, actionFilter, roleFilter]);

  const totalPages = Math.ceil(total / pageSize) || 1;

  const getActionBadge = (action: string) => {
    switch (action) {
      case "VIEW_STUDENT_CASEFILE":
        return "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30";
      case "GRANT_CONSENT":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "REVOKE_CONSENT":
        return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
      case "DISPATCH_EMERGENCY_SOS":
        return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40 font-black animate-pulse";
      case "UPDATE_ALERT_STATUS":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "CREATE_COUNSELOR_NOTE":
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30";
      default:
        return "bg-muted text-muted-foreground border-border/70";
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30";
      case "COUNSELOR":
        return "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30";
      case "STUDENT":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      default:
        return "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      {/* Top Header */}
      <div className="border-b border-border/60 bg-card/40 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h1 className="text-lg sm:text-xl font-bold text-foreground">
                Institutional Security & Compliance Audit Log
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Immutable forensic trail of clinical case reads, consent modifications, and crisis alerts.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
            className="h-9 px-3 text-xs border-border/70 hover:bg-accent flex items-center gap-1.5 self-end sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Audit Feed
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/70 bg-card/50 backdrop-blur-sm p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Audited Events
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-foreground mt-1">
              {total.toLocaleString()}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1">
              Immutable audit ledger
            </p>
          </Card>

          <Card className="border-border/70 bg-card/50 backdrop-blur-sm p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Filters
            </p>
            <h3 className="text-base sm:text-lg font-bold text-foreground mt-1 truncate">
              {actionFilter ? actionFilter : (roleFilter ? `Role: ${roleFilter}` : "All Records")}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1">
              {logs.length} visible in view
            </p>
          </Card>

          <Card className="border-border/70 bg-card/50 backdrop-blur-sm p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Compliance Standard
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                FERPA / HIPAA Guarded
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Append-only access ledger
            </p>
          </Card>

          <Card className="border-border/70 bg-card/50 backdrop-blur-sm p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Current Page
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-foreground mt-1">
              {page} <span className="text-xs text-muted-foreground font-normal">/ {totalPages}</span>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1">
              {pageSize} rows per page
            </p>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <Card className="border-border/70 bg-card/40 backdrop-blur-sm p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">Action:</span>
                <select
                  value={actionFilter}
                  onChange={(e) => {
                    setActionFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 rounded-lg border border-border/70 bg-background/50 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Actions</option>
                  <option value="VIEW_STUDENT_CASEFILE">VIEW_STUDENT_CASEFILE</option>
                  <option value="GRANT_CONSENT">GRANT_CONSENT</option>
                  <option value="REVOKE_CONSENT">REVOKE_CONSENT</option>
                  <option value="UPDATE_ALERT_STATUS">UPDATE_ALERT_STATUS</option>
                  <option value="CREATE_COUNSELOR_NOTE">CREATE_COUNSELOR_NOTE</option>
                  <option value="DISPATCH_EMERGENCY_SOS">DISPATCH_EMERGENCY_SOS</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 rounded-lg border border-border/70 bg-background/50 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Roles</option>
                  <option value="COUNSELOR">COUNSELOR</option>
                  <option value="STUDENT">STUDENT</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SYSTEM">SYSTEM</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-muted-foreground">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 rounded-lg border border-border/70 bg-background/50 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Audit Log Table */}
        <Card className="border-border/70 bg-card/50 backdrop-blur-md overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground">Loading forensic audit trail...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <h4 className="text-sm font-semibold text-foreground">No audit entries matching filter</h4>
                <p className="text-xs text-muted-foreground">Try clearing your filters or refreshing the table.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground font-bold bg-muted/20">
                      <th className="p-3.5 uppercase tracking-wider">Timestamp</th>
                      <th className="p-3.5 uppercase tracking-wider">Actor</th>
                      <th className="p-3.5 uppercase tracking-wider">Action</th>
                      <th className="p-3.5 uppercase tracking-wider">Target Subject</th>
                      <th className="p-3.5 uppercase tracking-wider">Resource</th>
                      <th className="p-3.5 uppercase tracking-wider text-right">Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-accent/20 transition-colors">
                        <td className="p-3.5 font-mono text-muted-foreground whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                          })}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getRoleBadge(log.actor_role)}`}>
                              {log.actor_role}
                            </span>
                            <span className="font-semibold text-foreground">
                              {log.actor_name || "System"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getActionBadge(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3.5 text-foreground whitespace-nowrap">
                          {log.target_user_name ? (
                            <span className="font-medium">{log.target_user_name}</span>
                          ) : log.target_user_id ? (
                            <span className="font-mono text-muted-foreground">{log.target_user_id.substring(0, 10)}...</span>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </td>
                        <td className="p-3.5 text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                          {log.target_resource_type}
                          {log.target_resource_id && ` #${log.target_resource_id.substring(0, 8)}`}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          {log.metadata_json && Object.keys(log.metadata_json).length > 0 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedMeta(log.metadata_json || null)}
                              className="h-7 px-2 text-[11px] text-primary hover:text-primary hover:bg-primary/10 gap-1"
                            >
                              <Code className="w-3 h-3" />
                              View JSON
                            </Button>
                          ) : (
                            <span className="text-muted-foreground/40 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {total > 0 && (
              <div className="border-t border-border/60 p-3.5 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} entries
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="h-7 w-7 p-0 rounded-lg border-border/70"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <span className="px-2 text-xs font-semibold text-foreground">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="h-7 w-7 p-0 rounded-lg border-border/70"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Metadata JSON Modal */}
      {selectedMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">Audit Event Metadata</h3>
              </div>
              <button 
                onClick={() => setSelectedMeta(null)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-accent/30 border border-border/60 text-xs font-mono text-foreground overflow-x-auto max-h-80">
              {JSON.stringify(selectedMeta, null, 2)}
            </pre>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMeta(null)}
                className="h-8 px-4 text-xs rounded-lg"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminAuditLogs;
