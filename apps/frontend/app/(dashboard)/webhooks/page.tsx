'use client';

import { WebhooksTable } from '@/components/webhooks/webhooks-table';
import { useAuthStore } from '@/stores/auth-store';
import { ShieldAlert, Webhook } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shared-ui';

export default function WebhooksPage() {
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
              Webhooks are restricted to administrators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your role does not have permission to configure external webhooks
              or integrations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Webhook className="size-4" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Webhooks
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Notify external systems when content changes so they can rebuild or
          revalidate cache.
        </p>
      </div>

      <WebhooksTable />
    </div>
  );
}
