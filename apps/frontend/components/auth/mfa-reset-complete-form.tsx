'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api-client';
import { API_PATHS } from '@/lib/constants/api-paths';
import { toast } from 'sonner';
import { CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function MfaResetCompleteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h3 className="text-lg font-medium text-destructive">
          Invalid Request
        </h3>
        <p className="text-sm text-muted-foreground">
          Missing reset token. Please check the link in your email.
        </p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/login">Return to Login</Link>
        </Button>
      </div>
    );
  }

  const handleCompleteReset = async () => {
    try {
      setLoading(true);
      setError(null);
      await apiFetch(API_PATHS.AUTH.MFA_RESET_COMPLETE, {
        method: 'POST',
        body: JSON.stringify({ token }),
      });

      setSuccess(true);
      toast.success('MFA has been successfully disabled on your account.');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to complete reset';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <h3 className="text-lg font-medium text-foreground">Reset Complete</h3>
        <p className="text-sm text-muted-foreground">
          Your two-factor authentication has been disabled. You can now log in
          with just your password and re-enroll in MFA from your account
          settings.
        </p>
        <Button className="w-full mt-4" onClick={() => router.push('/login')}>
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Click the button below to complete the MFA reset process and disable
          two-factor authentication on your account.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button
        className="w-full"
        onClick={handleCompleteReset}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Complete MFA Reset'
        )}
      </Button>
    </div>
  );
}
