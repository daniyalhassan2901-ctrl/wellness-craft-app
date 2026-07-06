import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message ?? "Something went wrong" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", this.props.label ?? "", error, info);
  }

  reset = () => this.setState({ hasError: false, message: undefined });

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <div className="flex items-center gap-2 font-medium text-destructive">
            <AlertTriangle className="h-4 w-4" /> {this.props.label ?? "Section unavailable"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground break-words">
            {this.state.message ?? "This section failed to load. Other admin sections still work."}
          </p>
          <button
            onClick={this.reset}
            className="mt-3 inline-flex items-center gap-1 rounded-full glass px-3 py-1.5 text-xs font-medium"
          >
            <RotateCcw className="h-3 w-3" /> Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
