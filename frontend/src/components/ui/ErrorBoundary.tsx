"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
            <span className="mb-4 text-5xl" aria-hidden="true">
              !
            </span>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Something went wrong</h2>
            <p className="mb-4 max-w-sm text-sm text-gray-500">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() =>
                this.setState({
                  hasError: false,
                  error: null,
                })
              }
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
