import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@repo/shared-ui';
import { CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';
import { authApi } from '../../features/auth/api/auth.api';

export const MfaResetCompletePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCompleteReset() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await authApi.completeMfaReset(token);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to complete MFA reset. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <ShieldAlert className="size-12 text-destructive" />
        <h1 className="text-xl font-semibold tracking-tight text-destructive">
          Invalid Request
        </h1>
        <p className="text-sm text-muted-foreground">
          Missing reset token. Please check the link in your email.
        </p>
        <Link to="/login">
          <Button variant="outline" className="mt-4">
            Return to Sign In
          </Button>
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <CheckCircle2 className="size-12 text-emerald-600" />
        <h1 className="text-xl font-semibold tracking-tight">Reset Complete</h1>
        <p className="text-sm text-muted-foreground">
          Your two-factor authentication has been disabled. You can now log in
          with just your password and re-enroll in MFA from your account
          settings.
        </p>
        <Button className="w-full mt-4" onClick={() => navigate('/login')}>
          Go to Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 w-full sm:w-[350px] mx-auto">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Complete MFA Reset
        </h1>
        <p className="text-sm text-muted-foreground">
          Click the button below to complete the MFA reset process and disable
          two-factor authentication on your account.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <Button
        className="w-full"
        onClick={handleCompleteReset}
        disabled={loading}
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {loading ? 'Processing...' : 'Complete MFA Reset'}
      </Button>

      <Link
        to="/login"
        className="text-muted-foreground text-center text-sm hover:underline"
      >
        Return to Sign In
      </Link>
    </div>
  );
};
