'use client';

import Link from 'next/link';
import { useDashboardOverview } from '@/lib/hooks/use-dashboard-overview';
import { formatRelativeTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, Badge } from '@repo/shared-ui';
import { FileText, ArrowRight, Clock } from 'lucide-react';

export function RecentActivity() {
  const { data, isLoading, isError } = useDashboardOverview();

  return (
    <Card className="border border-border/70 shadow-xs flex flex-col justify-between w-full min-w-0 max-w-full overflow-hidden">
      <div className="w-full min-w-0">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 w-full min-w-0">
          <div className="space-y-0.5 min-w-0 flex-1">
            <h2 className="text-base font-semibold tracking-tight text-foreground leading-none truncate">
              Recent Activity
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              Chronological feed of latest content changes and updates.
            </p>
          </div>
          <Link
            href="/audit-log"
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1 transition-colors shrink-0"
          >
            <span>Audit log</span>
            <ArrowRight className="size-3" />
          </Link>
        </CardHeader>

        <CardContent
          aria-live="polite"
          className="pt-2 w-full min-w-0 max-w-full"
        >
          {isLoading ? (
            <p role="status" className="text-muted-foreground text-sm py-4">
              Loading…
            </p>
          ) : isError ? (
            <p role="alert" className="text-destructive text-sm py-4">
              Failed to load recent activity.
            </p>
          ) : !data || data.recentActivity.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="size-9 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
                <FileText className="size-4" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">
                No activity yet.
              </p>
              <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto">
                When editors create or update content entries, their activity
                will stream here automatically.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/40 w-full min-w-0 max-w-full">
              {data.recentActivity.map((item) => (
                <li
                  key={item.entryId}
                  className="py-2.5 px-1.5 rounded-lg hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 text-sm w-full min-w-0 max-w-full"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 w-full sm:w-auto">
                    <div className="size-7 rounded-md bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0">
                      <FileText className="size-3.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
                        <Link
                          href={`/content/${item.schemaSlug}/${item.entryId}`}
                          className="font-medium text-foreground hover:text-primary transition-colors truncate text-xs hover:underline outline-none min-w-0 flex-1"
                          title={item.title}
                        >
                          <span className="text-muted-foreground">
                            {item.schemaName}:
                          </span>{' '}
                          {item.title}
                        </Link>
                        {item.status && (
                          <Badge
                            variant={
                              item.status === 'published'
                                ? 'success'
                                : 'warning'
                            }
                            size="sm"
                            className="text-[10px] uppercase font-semibold tracking-wider py-0 px-1.5 shrink-0"
                          >
                            {item.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-muted-foreground shrink-0 text-xs font-mono pl-9 sm:pl-0">
                    <Clock className="size-3 text-muted-foreground/60" />
                    <span>{formatRelativeTime(item.updatedAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </div>

      <div className="p-3 border-t border-border/40 bg-muted/10 text-right rounded-b-xl w-full min-w-0">
        <Link
          href="/content"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          <span>Explore Content Manager</span>
          <ArrowRight className="size-3" />
        </Link>
      </div>
    </Card>
  );
}
