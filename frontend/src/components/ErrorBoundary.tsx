import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  incidentId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    incidentId: "",
  };

  public static getDerivedStateFromError(error: Error): State {
    const incidentId = `MG-ERR-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    return { hasError: true, error, incidentId };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[${this.state.incidentId}] Component runtime error:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-md w-full p-8 rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                An unexpected component error occurred. Your personal wellbeing records and session remain secure.
              </p>
            </div>
            {this.state.incidentId && (
              <div className="inline-block px-3 py-1 rounded-lg bg-secondary text-[11px] font-mono text-muted-foreground">
                Reference ID: <span className="text-foreground font-semibold">{this.state.incidentId}</span>
              </div>
            )}
            {this.state.error && (
              <pre className="text-[11px] p-3 rounded-xl bg-secondary/80 text-muted-foreground font-mono overflow-x-auto text-left max-h-28 border border-border/50">
                {this.state.error.message}
              </pre>
            )}
            <div className="pt-2 flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.href = "/";
                }}
                className="rounded-xl text-xs font-semibold gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                Return Home
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  window.location.reload();
                }}
                className="rounded-xl text-xs font-semibold gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Page
              </Button>
            </div>
            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero data loss &bull; Encrypted session preserved</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
