import React, { Suspense, Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ThreeErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("3D WebGL render notice:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface LazyCanvasWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

export const LazyCanvasWrapper: React.FC<LazyCanvasWrapperProps> = ({
  children,
  fallback = (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-24 w-24 rounded-full bg-primary/10 animate-pulse border border-primary/20" />
    </div>
  ),
  className = "",
}) => {
  return (
    <ThreeErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <div className={className}>{children}</div>
      </Suspense>
    </ThreeErrorBoundary>
  );
};

export default LazyCanvasWrapper;
