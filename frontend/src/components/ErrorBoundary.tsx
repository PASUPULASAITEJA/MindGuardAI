import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application runtime error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-md w-full p-6 rounded-2xl border border-border bg-card shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Something went wrong</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              An unexpected error occurred while rendering this view.
            </p>
            {this.state.error && (
              <pre className="text-[11px] p-3 rounded-lg bg-secondary text-muted-foreground overflow-x-auto text-left max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <div className="pt-2 flex justify-center gap-3">
              <Button
                size="sm"
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="text-xs font-semibold gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
