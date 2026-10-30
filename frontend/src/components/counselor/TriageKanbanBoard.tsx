import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertItem } from "@/hooks/useAlerts";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileEdit,
  Eye,
  ShieldAlert,
  Sparkles,
  User,
  ChevronRight,
  Activity,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { motion } from "motion/react";

interface TriageKanbanBoardProps {
  alerts: AlertItem[];
  onStatusChange: (alertId: string, newStatus: "PENDING" | "REVIEWED" | "RESOLVED") => void;
  onOpenNote: (alert: AlertItem) => void;
  isLoading?: boolean;
}

interface ColumnConfig {
  id: "PENDING" | "REVIEWED" | "RESOLVED";
  title: string;
  description: string;
  colorClass: string;
  badgeClass: string;
  icon: React.FC<{ className?: string }>;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: "PENDING",
    title: "Pending Triage",
    description: "New signals awaiting clinical review",
    colorClass: "border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/10",
    badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
    icon: AlertCircle,
  },
  {
    id: "REVIEWED",
    title: "Under Clinical Review",
    description: "Active assessments and interventions",
    colorClass: "border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/10",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: Clock,
  },
  {
    id: "RESOLVED",
    title: "Resolved & Closed",
    description: "Addressed and post-intervention cases",
    colorClass: "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: CheckCircle2,
  },
];

export const TriageKanbanBoard: React.FC<TriageKanbanBoardProps> = ({
  alerts,
  onStatusChange,
  onOpenNote,
  isLoading,
}) => {
  const navigate = useNavigate();

  const getAlertSeverityBadge = (severity?: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold";
      case "HIGH":
        return "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30 font-medium";
      case "MEDIUM":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
      default:
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[420px]">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className="rounded-xl border border-border bg-card/50 p-4 space-y-3 animate-pulse"
          >
            <div className="h-6 w-32 bg-secondary rounded" />
            <div className="h-28 bg-secondary/50 rounded-lg" />
            <div className="h-28 bg-secondary/50 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map((column) => {
        const colAlerts = alerts.filter((a) => {
          if (column.id === "PENDING") return a.status === "PENDING" || !a.status;
          return a.status === column.id;
        });
        const Icon = column.icon;

        return (
          <div
            key={column.id}
            className={cn(
              "flex flex-col rounded-xl border p-3.5 transition-colors duration-200",
              column.colorClass
            )}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "p-1.5 rounded-lg border flex items-center justify-center",
                    column.badgeClass
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground tracking-wide flex items-center gap-1.5">
                    {column.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground">{column.description}</p>
                </div>
              </div>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border",
                  column.badgeClass
                )}
              >
                {colAlerts.length}
              </span>
            </div>

            {/* Column Cards Container */}
            <div className="flex-1 space-y-3 min-h-[300px]">
              {colAlerts.length === 0 ? (
                <div className="h-44 border border-dashed border-border/70 rounded-lg flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 mb-1.5 opacity-40 text-emerald-500" />
                  <span className="text-xs font-medium">No alerts in this stage</span>
                  <span className="text-[10px] opacity-70">Queue is clear</span>
                </div>
              ) : (
                colAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="group relative rounded-lg border border-border bg-card p-3 shadow-xs hover:shadow-md transition-all hover:border-primary/40 space-y-2.5"
                  >
                    {/* Card Header: Student & Severity */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <button
                          onClick={() =>
                            navigate(`/counselor/students/${alert.student_id}/casefile`)
                          }
                          className="font-mono text-xs font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span>{alert.student_id.substring(0, 10)}...</span>
                        </button>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ID: #{alert.id.substring(0, 6)}
                        </span>
                      </div>

                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-medium uppercase border",
                          getAlertSeverityBadge(alert.severity)
                        )}
                      >
                        {alert.severity}
                      </span>
                    </div>

                    {/* Card Body: Reason & Context */}
                    <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">
                      {(alert as any).reason || `Elevated ${alert.severity} triage anomaly signal`}
                    </p>

                    {/* Metadata Footer */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(alert.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      {/* Triage Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenNote(alert)}
                          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="Add / View Clinical Note"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                        </button>

                        {column.id === "PENDING" && (
                          <button
                            type="button"
                            onClick={() => onStatusChange(alert.id, "REVIEWED")}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/15 hover:bg-primary/25 text-primary text-[10px] font-semibold transition-colors"
                          >
                            <span>Review</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        )}

                        {column.id === "REVIEWED" && (
                          <button
                            type="button"
                            onClick={() => onStatusChange(alert.id, "RESOLVED")}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold transition-colors"
                          >
                            <span>Resolve</span>
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/counselor/students/${alert.student_id}/casefile`)
                          }
                          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="Open Student Clinical Casefile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TriageKanbanBoard;
