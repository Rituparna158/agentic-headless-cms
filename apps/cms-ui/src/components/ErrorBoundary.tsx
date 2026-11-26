import { Component, type ErrorInfo, type ReactNode } from 'react';
import { browserLogger } from '@repo/logger/browser';
import type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
} from '../types/error-boundary.types';

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    browserLogger.error('Uncaught error:', { error, errorInfo });
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = import.meta.env.DEV;
      return (
        <div
          role="alert"
          className="flex min-h-screen flex-col items-center justify-center p-6 bg-background text-foreground"
        >
          <div className="w-full max-w-md rounded-xl border border-destructive/30 bg-card p-6 shadow-lg text-center">
            <h1 className="text-xl font-bold text-destructive mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              {isDev && this.state.error?.message
                ? this.state.error.message
                : 'An unexpected application error occurred. Please reload or contact support.'}
            </p>
            {isDev && this.state.error?.stack && (
              <pre className="mb-4 max-h-40 overflow-auto rounded bg-muted p-2 text-left text-xs text-muted-foreground font-mono">
                {this.state.error.stack}
              </pre>
            )}
            <button
              type="button"
              onClick={() =>
                this.setState({ hasError: false, error: undefined })
              }
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
