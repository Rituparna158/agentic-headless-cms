'use client';

import { useQuery } from '@tanstack/react-query';
import { listMedia } from '@/lib/api/media';
import { useDashboardOverview } from '@/lib/hooks/use-dashboard-overview';
import { Card, CardContent, CardHeader } from '@repo/shared-ui';

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

  const stats = [
    {
      label: 'Total Entries',
      value: data?.totalEntries,
      loading: isLoading,
      error: isError,
    },
    {
      label: 'Published',
      value: data?.publishedEntries,
      loading: isLoading,
      error: isError,
    },
    {
      label: 'Drafts',
      value: data?.draftEntries,
      loading: isLoading,
      error: isError,
    },
    {
      label: 'Media Assets',
      value: mediaData?.meta.pagination.total,
      loading: isMediaLoading,
      error: isMediaError,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader>
            <h2 className="text-muted-foreground text-sm leading-none font-medium">
              {stat.label}
            </h2>
          </CardHeader>
          <CardContent className="text-2xl font-semibold" aria-live="polite">
            {stat.error ? (
              <span
                role="alert"
                className="text-destructive text-sm font-normal"
              >
                Error
              </span>
            ) : stat.loading ? (
              <span
                role="status"
                className="text-muted-foreground text-sm font-normal"
              >
                Loading…
              </span>
            ) : (
              (stat.value ?? 0)
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
