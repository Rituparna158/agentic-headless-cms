import { Plus, Sparkles } from 'lucide-react';

import type { EmptyStateCardProps } from './types';

export type { EmptyStateCardProps };

export function EmptyStateCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon = Plus,
  secondaryActionLabel,
  onSecondaryAction,
  tip,
  className = '',
}: EmptyStateCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-dashed border-border bg-gradient-to-b from-card/80 to-card/40 p-12 text-center shadow-sm backdrop-blur-sm transition-all hover:border-border/80 ${className}`}
    >
      {/* Decorative ambient background blur */}
      <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 size-48 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto flex flex-col items-center max-w-md">
        {/* Modern elevated icon container */}
        <div className="mb-5 flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-lg shadow-primary/5 ring-4 ring-primary/5 transition-transform duration-300 hover:scale-105">
          <Icon className="size-8 stroke-[1.75]" />
        </div>

        <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h3>

        <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>

        {tip && (
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary/90 font-medium">
            <Sparkles className="size-3 text-primary animate-pulse" />
            <span>{tip}</span>
          </div>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {onAction && actionLabel && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
            >
              <ActionIcon className="size-4" />
              <span>{actionLabel}</span>
            </button>
          )}

          {onSecondaryAction && secondaryActionLabel && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted active:scale-95 transition-all shadow-sm"
            >
              <span>{secondaryActionLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
