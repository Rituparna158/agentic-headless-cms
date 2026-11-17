import type { Metadata } from 'next';
import { LayoutDashboard } from 'lucide-react';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { DashboardResources } from '@/components/dashboard/dashboard-resources';

export const metadata: Metadata = {
  title: 'Dashboard — Headless CMS',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      {/* Header bar with page title and creation actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/50 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <LayoutDashboard className="size-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate">
              Dashboard
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 truncate">
            Operational status, content inventory, and recent workspace
            activity.
          </p>
        </div>
        <div className="shrink-0 w-full sm:w-auto min-w-0">
          <QuickActions />
        </div>
      </div>

      {/* Primary KPI Metric Cards and Publication Progress */}
      <StatsCards />

      {/* Main Content: Recent Activity (left) & Platform Modules (right) */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 items-start w-full min-w-0 max-w-full">
        <div className="lg:col-span-2 w-full min-w-0 max-w-full">
          <RecentActivity />
        </div>
        <div className="space-y-6 w-full min-w-0 max-w-full">
          <DashboardResources />
        </div>
      </div>
    </div>
  );
}
