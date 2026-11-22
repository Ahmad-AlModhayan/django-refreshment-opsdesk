/**
 * Lifecycle Stage: Runtime Fault Containment -> React Error Boundary
 * Production Invariant (🔴): Isolates unexpected render exceptions so the shell degrades gracefully instead of white-screening.
 * Trap Prevented (⚠️): Uncaught null-dereference errors crashing the entire SPA with zero recovery action.
 */
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    errorMessage: "",
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || "Unexpected rendering failure.",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("OpsDesk ErrorBoundary caught error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-zinc-950">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  Workspace view encountered an error
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  The fault was isolated by the root ErrorBoundary.
                </p>
              </div>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-rose-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-rose-400">
              {this.state.errorMessage}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-indigo-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reload workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
