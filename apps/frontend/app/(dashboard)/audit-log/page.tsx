import type { Metadata } from 'next';
import { AuditLogTable } from '@/components/audit-log/audit-log-table';

export const metadata: Metadata = {
  title: 'Audit Log — Agentic CMS',
};

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">
          Track and inspect administrative actions, content mutations, and
          system events across the CMS.
        </p>
      </div>

      <AuditLogTable />
    </div>
  );
}
