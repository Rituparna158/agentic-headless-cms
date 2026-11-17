'use client';

import { useQuery } from '@tanstack/react-query';
import { listMedia } from '@/lib/api/media';
import { useDashboardOverview } from '@/lib/hooks/use-dashboard-overview';
import { Card, CardContent } from '@repo/shared-ui';
import { FileText, CheckCircle2, FileEdit, ImageIcon } from 'lucide-react';

export function StatsCards() {
  const { data, isLoading, isError } = useDashboardOverview();
  const {
    data: mediaData,
    isLoading: isMediaLoading,
    isError: isMediaError,
  } = useQuery({
    queryKey: ['media', 'dashboard-count'],
    queryFn: () => listMedia({ page: 1, pageSize: 1 }),
  });

  const totalEntries = data?.totalEntries ?? 0;
  const publishedEntries = data?.publishedEntries ?? 0;
  const draftEntries = data?.draftEntries ?? 0;
  const mediaCount = mediaData?.meta.pagination.total ?? 0;

  const publishedPercentage =
    totalEntries > 0 ? Math.round((publishedEntries / totalEntries) * 100) : 0;

  const stats = [
    {
      label: 'Total Entries',
      value: totalEntries,
      loading: isLoading,
      error: isError,
      icon: FileText,
      iconStyle:
        'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20',
      description: 'Across all active content models',
    },
    {
      label: 'Published',
      value: publishedEntries,
      loading: isLoading,
      error: isError,
      icon: CheckCircle2,
      iconStyle:
        'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20',
      description: 'Live on public APIs and channels',
    },
    {
      label: 'Drafts',
      value: draftEntries,
      loading: isLoading,
      error: isError,
      icon: FileEdit,
      iconStyle:
        'bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20',
      description: 'Pending editorial review or edit',
    },
    {
      label: 'Media Assets',
      value: mediaCount,
      loading: isMediaLoading,
      error: isMediaError,
      icon: ImageIcon,
      iconStyle:
        'bg-sky-500/10 text-sky-500 dark:text-sky-400 border border-sky-500/20',
      description: 'Images, videos, and attachments',
    },
  ];

  return (
    <div className="space-y-4 w-full min-w-0 max-w-full">
      {/* 4 KPI Grid Cards */}
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full min-w-0 max-w-full">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="p-4 border border-border/70 hover:border-border transition-colors shadow-xs w-full min-w-0"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs font-medium">
                  {stat.label}
                </span>
                <div
                  className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${stat.iconStyle}`}
                >
                  <Icon className="size-4" />
                </div>
              </div>

              <CardContent
                className="p-0 pt-2 pb-1 text-2xl font-bold tracking-tight text-foreground tabular-nums"
                aria-live="polite"
              >
                {stat.error ? (
                  <span
                    role="alert"
                    className="text-destructive text-xs font-normal"
                  >
                    Error
                  </span>
                ) : stat.loading ? (
                  <span
                    role="status"
                    className="text-muted-foreground text-xs font-normal"
                  >
                    Loading…
                  </span>
                ) : (
                  stat.value
                )}
              </CardContent>

              <div className="text-[11px] text-muted-foreground/80 truncate">
                {stat.description}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Content Publication Health Bar */}
      {totalEntries > 0 && !isLoading && !isError && (
        <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs w-full min-w-0 max-w-full">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-foreground shrink-0">
              Publication Health:
            </span>
            <span className="text-muted-foreground truncate">
              {publishedPercentage}% of total entries are published live
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto min-w-0">
            <div className="w-full sm:w-48 h-2 rounded-full bg-muted overflow-hidden flex min-w-0">
              <div
                style={{ width: `${publishedPercentage}%` }}
                className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                title={`${publishedEntries} Published`}
              />
              <div
                style={{ width: `${100 - publishedPercentage}%` }}
                className="h-full bg-amber-500 rounded-r-full transition-all duration-500"
                title={`${draftEntries} Drafts`}
              />
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono shrink-0">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                <span>{publishedEntries} live</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-amber-500 inline-block" />
                <span>{draftEntries} draft</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
