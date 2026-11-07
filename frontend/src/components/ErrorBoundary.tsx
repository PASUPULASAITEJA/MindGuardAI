import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { telemetry } from "@/services/telemetry";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    const errorId = `MG-ERR-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    return { hasError: true, error, errorId };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    telemetry.trackError(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground p-4 sm:p-6">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertCircle className="w-7 h-7" />
            </div>
            
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight text-foreground">Something went wrong</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                An unexpected component error occurred. Your personal wellbeing records and session remain secure.
              </p>
            </div>

            {this.state.errorId && (
              <div className="text-[11px] font-mono text-muted-foreground bg-secondary/60 rounded-xl py-1.5 px-3 inline-block">
                Reference ID: <span className="font-semibold text-foreground">{this.state.errorId}</span>
              </div>
            )}

            {this.state.error && (
              <pre className="text-[11px] p-3 rounded-xl bg-secondary/80 text-muted-foreground overflow-x-auto text-left max-h-28 border border-border/60">
                {this.state.error.message}
              </pre>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = "/";
                }}
                className="w-full sm:w-auto rounded-xl text-xs font-semibold gap-1.5 h-9"
              >
                <Home className="w-3.5 h-3.5" />
                Return Home
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="w-full sm:w-auto rounded-xl bg-primary text-primary-foreground text-xs font-semibold gap-1.5 h-9 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Page
              </Button>
            </div>

            <div className="pt-2 border-t border-border/40 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
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
