import type { Metadata } from 'next';
import { Suspense } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shared-ui';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Sign in — Agentic CMS',
};

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Agentic CMS</CardTitle>
        <CardDescription>Sign in to manage your content</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
