'use client';

import Link from 'next/link';
import { useDashboardOverview } from '@/lib/hooks/use-dashboard-overview';
import { formatRelativeTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function RecentActivity() {
  const { data, isLoading, isError } = useDashboardOverview();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : isError ? (
          <p role="alert" className="text-destructive text-sm">
            Failed to load recent activity.
          </p>
        ) : !data || data.recentActivity.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity yet.</p>
        ) : (
          <ul className="grid gap-3">
            {data.recentActivity.map((item) => (
              <li
                key={item.entryId}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <Link
                  href={`/content/${item.schemaSlug}/${item.entryId}`}
                  className="truncate hover:underline"
                >
                  <span className="text-muted-foreground">
                    {item.schemaName}:
                  </span>{' '}
                  {item.title}
                </Link>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {formatRelativeTime(item.updatedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
