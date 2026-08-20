import { Button } from '@repo/shared-ui';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export const GeneralErrorPage = () => {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-background p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">
          Something went wrong
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          An unexpected error occurred while loading this page. Please try
          again, or return to the dashboard.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="size-4" />
          Try Again
        </Button>
        <Button variant="outline" onClick={() => window.location.assign('/')}>
          <Home className="size-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};
