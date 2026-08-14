'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@repo/shared-ui';

import { Suspense } from 'react';

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const message =
    searchParams.get('message') ||
    'You do not have permission to access this application.';

  return (
    <div className="flex flex-col items-center justify-center space-y-6 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-destructive">
          Access Denied
        </h1>
        <p className="text-muted-foreground">{message}</p>
      </div>

      <Button asChild variant="default">
        <Link href="/login">Return to Login</Link>
      </Button>
    </div>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AccessDeniedContent />
    </Suspense>
  );
}
