'use client';

import { ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { ShieldAlert } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shared-ui';

export function RoleGuard({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);

  if (status !== 'authenticated' || !user) {
    return <>{children}</>;
  }

  if (user.roles.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 bg-muted/10 h-full">
        <Card className="max-w-md text-center border-dashed">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <ShieldAlert className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle>Pending Access</CardTitle>
            <CardDescription>
              Your account has been created successfully, but you do not have
              any roles assigned yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please contact your administrator to assign you a role. Once
              assigned, simply refresh this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
