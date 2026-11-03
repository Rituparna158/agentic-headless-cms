import { AlertCircle, RotateCw, ArrowLeft } from 'lucide-react';

import type { InlineErrorAlertProps } from './types';

export type { InlineErrorAlertProps };

export function InlineErrorAlert({
  title = 'Failed to load content',
  message,
  onRetry,
  isRetrying = false,
  onBack,
  backText = 'Go Back',
  className = '',
}: InlineErrorAlertProps) {
  const errorMessage =
    typeof message === 'string'
      ? message
      : message instanceof Error
        ? message.message
        : 'An unexpected network error occurred while communicating with the server.';

  return (
    <div
      role="alert"
      className={`rounded-2xl border border-destructive/30 bg-destructive/10 p-6 backdrop-blur-md transition-all shadow-sm ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/20 text-destructive border border-destructive/30 shadow-inner">
            <AlertCircle className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground tracking-tight">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
              {errorMessage}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-border bg-background hover:bg-muted text-foreground transition-colors shadow-sm"
            >
              <ArrowLeft className="size-3.5" />
              {backText}
            </button>
          )}

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <RotateCw
                className={`size-3.5 ${isRetrying ? 'animate-spin' : ''}`}
              />
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
