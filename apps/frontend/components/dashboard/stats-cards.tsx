'use client';

import { useDashboardOverview } from '@/lib/hooks/use-dashboard-overview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function StatsCards() {
  const { data, isLoading, isError } = useDashboardOverview();

  const stats = [
    { label: 'Total Entries', value: data?.totalEntries },
    { label: 'Published', value: data?.publishedEntries },
    { label: 'Drafts', value: data?.draftEntries },
    // No workflow/approvals concept exists in the backend yet (that's the
    // Workflows feature, a separate, later screen) — nothing to count, so
    // this is left as a placeholder rather than a fabricated number.
    { label: 'Pending Approvals', value: undefined },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {isError ? (
              <span className="text-destructive text-sm font-normal">
                Error
              </span>
            ) : isLoading ? (
              <span className="text-muted-foreground text-sm font-normal">
                Loading…
              </span>
            ) : (
              (stat.value ?? '—')
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
