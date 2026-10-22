'use client';

import { useEffect } from 'react';
import { Button } from '@repo/shared-ui';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Dashboard Section Error:', error);
  }, [error]);

  return (
    <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
        Failed to load content
      </h2>
      <p className="max-w-md text-sm text-neutral-600 dark:text-neutral-400 mb-6">
        {error.message ||
          'An error occurred while loading this section. Please try again.'}
      </p>
      <Button
        variant="default"
        onClick={() => reset()}
        className="flex items-center gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}
