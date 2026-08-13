import React, { useState } from 'react';
import { Button, Input } from '@repo/shared-ui';
import { useAuthStore } from '../store/auth.store';
import { useVerifyMfaMutation } from '../hooks/useAuthMutations';

export function MfaChallengeForm() {
  const [code, setCode] = useState('');
  const mfaToken = useAuthStore((state) => state.mfaToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const { mutate: verifyMfa, isPending, error } = useVerifyMfaMutation();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaToken) {
      verifyMfa({ mfaToken, code });
    }
  };

  const onCancel = () => {
    clearAuth();
  };

  return (
    <div className="grid gap-4">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-semibold tracking-tight">
          Two-Factor Authentication
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code from your authenticator app to complete your
          sign in.
        </p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="space-y-2">
          <Input
            placeholder="000000"
            value={code}
            onChange={(value) => setCode(value.replace(/\D/g, ''))}
            className="text-center text-lg tracking-widest font-mono"
            variant="default"
          />
        </div>

        {error ? (
          <p role="alert" className="text-destructive text-sm text-center">
            {error instanceof Error
              ? error.message
              : 'MFA verification failed. Please try again.'}
          </p>
        ) : null}

        <Button type="submit" disabled={isPending || code.length !== 6}>
          {isPending ? 'Verifying…' : 'Verify'}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel and Sign In Again
        </Button>
      </form>
    </div>
  );
}
