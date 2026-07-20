import type { Metadata } from 'next';
import { WebhooksTable } from '@/components/webhooks/webhooks-table';

export const metadata: Metadata = {
  title: 'Webhooks — Agentic CMS',
};

export default function WebhooksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
        <p className="text-muted-foreground">
          Notify external systems (e.g. a Next.js frontend) when content changes
          so they can rebuild or revalidate.
        </p>
      </div>

      <WebhooksTable />
    </div>
  );
}
