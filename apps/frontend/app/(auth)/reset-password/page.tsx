import type { Metadata } from 'next';
import { Suspense } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shared-ui';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = {
  title: 'Set New Password — Agentic CMS',
};

export default function ResetPasswordPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Set New Password</CardTitle>
        <CardDescription>
          Secure your account with a new password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense
          fallback={
            <div className="text-center text-sm text-muted-foreground p-4">
              Loading...
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
