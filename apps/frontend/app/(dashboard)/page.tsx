import type { Metadata } from 'next';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { QuickActions } from '@/components/dashboard/quick-actions';

export const metadata: Metadata = {
  title: 'Dashboard — Agentic CMS',
};

export default function DashboardPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <StatsCards />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <RecentActivity />
        <div className="grid gap-2">
          <h2 className="text-sm font-medium">Quick Actions</h2>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
