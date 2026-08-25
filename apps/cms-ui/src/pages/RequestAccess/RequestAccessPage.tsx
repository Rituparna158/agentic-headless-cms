import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Mail,
  ArrowLeft,
} from 'lucide-react';
import { Button, Input, Typography } from '@repo/shared-ui';
import { authApi } from '../../features/auth/api/auth.api';

export const RequestAccessPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authApi.requestMfaReset(email);
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to request MFA reset',
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col space-y-6 w-full sm:w-[350px] mx-auto text-center">
        <div className="mx-auto w-fit rounded-full bg-emerald-500/15 p-4">
          <CheckCircle2 className="size-8 text-emerald-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Request Submitted
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Your MFA reset request has been sent to the administrators. You will
            receive an email once it has been reviewed and approved.
          </p>
        </div>
        <Link to="/login">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="size-4" />
            Back to Sign In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 w-full sm:w-[350px] mx-auto">
      <div className="flex flex-col space-y-2 text-center">
        <div className="mx-auto w-fit rounded-full bg-primary/10 p-3">
          <ShieldAlert className="size-6 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Lost Access to Your Authenticator?
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          If you removed your account from your authenticator app or lost your
          device, request a reset. An administrator will review your request
          before access is restored.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="space-y-2">
          <Typography variant="label" className="block mb-1">
            Account Email
          </Typography>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(val: string) => setEmail(val)}
            icon={Mail}
            variant="default"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="text-destructive text-sm p-3 bg-destructive/10 rounded-md border border-destructive/20"
          >
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading || !email}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? 'Requesting...' : 'Request Access'}
        </Button>

        <Link
          to="/login"
          className="text-muted-foreground text-center text-sm hover:underline"
        >
          Return to Sign In
        </Link>
      </form>
    </div>
  );
};
