"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";
import { ErrorFallback } from "./ErrorFallback";
import { isChunkLoadError, handleChunkLoadError } from "@/lib/chunk-error";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Auto-reload on ChunkLoadError (stale deployment chunks)
    if (isChunkLoadError(error)) {
      handleChunkLoadError();
      return;
    }
    console.error("SectionErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          title={this.props.fallbackTitle ?? "This section encountered an error"}
          description={
            this.props.fallbackDescription ??
            "Try refreshing the page. If the problem persists, contact support."
          }
          reset={() => this.setState({ hasError: false, error: null })}
          compact
        />
      );
    }
    return this.props.children;
  }
}
