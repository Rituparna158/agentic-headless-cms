import { useNavigate } from 'react-router-dom';
import { Button } from '@repo/shared-ui';
import { ArrowLeft, Home, SearchX } from 'lucide-react';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-background p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <SearchX className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <p className="text-6xl font-bold tracking-tight text-foreground">404</p>
        <h1 className="text-xl font-semibold text-foreground">
          Page Not Found
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The page you are looking for doesn&apos;t exist or may have been
          moved. Check the URL or head back to the dashboard.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
          Go Back
        </Button>
        <Button onClick={() => navigate('/')}>
          <Home className="size-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};
