'use client';

import { AuditLogTable } from '@/components/audit-log/audit-log-table';
import { useAuthStore } from '@/stores/auth-store';
import { ShieldAlert } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shared-ui';

export default function AuditLogPage() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const isAdmin =
    user?.roles?.some((role) =>
      ['admin', 'super_admin'].includes(role.toLowerCase()),
    ) || false;

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-muted-foreground text-sm">
        Checking permissions...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 bg-muted/10 h-full">
        <Card className="max-w-md text-center border-dashed">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <ShieldAlert className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Audit Log is restricted to administrators and compliance auditors.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your current role does not have permission to view governance
              audit trails.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
