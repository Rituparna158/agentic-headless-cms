import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Dashboard — Agentic CMS',
};

const stats = [
  { label: 'Total Entries', value: '—' },
  { label: 'Published', value: '—' },
  { label: 'Drafts', value: '—' },
  { label: 'Pending Approvals', value: '—' },
];

export default function DashboardPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {stat.value}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          This is the admin dashboard shell. Content, media, and workflow data
          will appear here once the corresponding APIs are implemented.
        </CardContent>
      </Card>
    </div>
  );
}
