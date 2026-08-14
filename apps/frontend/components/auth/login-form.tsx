'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { loginSchema } from '@repo/validation';
import { type LoginInput } from '@repo/types';

import {
  Button,
  Input,
  Checkbox,
  Form,
  FormField,
  Typography,
} from '@repo/shared-ui';
import { Controller } from 'react-hook-form';
import { API_BASE_URL } from '@/lib/api-client';
import { API_PATHS } from '@/lib/constants/api-paths';
import { useAuthStore } from '@/stores/auth-store';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');
  const login = useAuthStore((state) => state.login);
  const status = useAuthStore((state) => state.status);
  const verifyMfaChallenge = useAuthStore((state) => state.verifyMfaChallenge);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [resetRequested, setResetRequested] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(loginSchema) as any,
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  async function onSubmit(values: LoginInput) {
    setSubmitError(null);
    try {
      await login(values);
      if (useAuthStore.getState().status === 'authenticated') {
        router.push('/');
      }
    } catch {
      // useAuthStore already recorded a user-facing message; read it back
      // rather than duplicating the error-shaping logic here.
      setSubmitError(
        useAuthStore.getState().error ?? 'Login failed. Please try again.',
      );
    }
  }

  if (status === 'mfa_challenge_required') {
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
        <form
          onSubmit={async (e: React.FormEvent) => {
            e.preventDefault();
            setSubmitError(null);
            setVerifying(true);
            try {
              await verifyMfaChallenge(code);
              router.push('/');
            } catch {
              setSubmitError(
                useAuthStore.getState().error ??
                  'MFA verification failed. Please try again.',
              );
            } finally {
              setVerifying(false);
            }
          }}
          className="grid gap-4"
        >
          <div className="space-y-2">
            <Input
              placeholder="000000"
              value={code}
              onChange={(val: string) => setCode(val.replace(/\D/g, ''))}
              className="text-center text-lg tracking-widest font-mono"
              variant="default"
            />
          </div>

          {submitError ? (
            <p role="alert" className="text-destructive text-sm text-center">
              {submitError}
            </p>
          ) : null}

          <Button type="submit" disabled={verifying || code.length !== 6}>
            {verifying ? 'Verifying…' : 'Verify'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              useAuthStore.setState({
                status: 'unauthenticated',
                mfaToken: null,
                error: null,
              });
              setCode('');
              setSubmitError(null);
              setResetRequested(false);
              setResetError(null);
            }}
          >
            Cancel and Sign In Again
          </Button>

          <div className="flex flex-col items-center gap-2 mt-4 border-t pt-4">
            <p className="text-sm text-muted-foreground text-center">
              Lost access to your authenticator app?
            </p>
            {resetRequested ? (
              <p className="text-sm text-green-600 text-center font-medium">
                Reset request sent to administrators.
              </p>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={resetting}
                onClick={async () => {
                  setResetError(null);
                  setResetting(true);
                  try {
                    const res = await fetch(
                      `${API_BASE_URL}${API_PATHS.AUTH.MFA_RESET_REQUEST}`,
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email: form.getValues('email'),
                        }),
                      },
                    );
                    if (!res.ok) {
                      throw new Error('Failed to request reset');
                    }
                    setResetRequested(true);
                  } catch (_e) {
                    setResetError(
                      'Failed to request MFA reset. Please try again.',
                    );
                  } finally {
                    setResetting(false);
                  }
                }}
              >
                {resetting ? 'Requesting...' : 'Request MFA Reset'}
              </Button>
            )}
            {resetError && (
              <p className="text-sm text-destructive text-center">
                {resetError}
              </p>
            )}
          </div>
        </form>
      </div>
    );
  }

  function handleSsoLogin() {
    window.location.href = `${API_BASE_URL}${API_PATHS.AUTH.SSO}?redirectUrl=${encodeURIComponent(window.location.origin)}&appId=HEADLESS_CMS`;
  }

  return (
    <Form spacing="comfortable">
      {urlError && (
        <div className="mb-4">
          <p
            role="alert"
            className="text-destructive text-sm p-3 bg-destructive/10 rounded-md border border-destructive/20"
          >
            {urlError}
          </p>
        </div>
      )}
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="grid gap-4"
      >
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormField>
              <label htmlFor="email">
                <Typography variant="label" className="block mb-1">
                  Email
                </Typography>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={field.value}
                onChange={(val: string) => field.onChange(val)}
                error={fieldState.error?.message}
                variant="default"
              />
            </FormField>
          )}
        />

        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <FormField>
              <label htmlFor="password">
                <Typography variant="label" className="block mb-1">
                  Password
                </Typography>
              </label>
              <Input
                id="password"
                type="password"
                value={field.value}
                onChange={(val: string) => field.onChange(val)}
                error={fieldState.error?.message}
                variant="default"
                placeholder="Enter your password"
              />
            </FormField>
          )}
        />

        <Controller
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <FormField className="flex flex-row items-center gap-2 space-y-0 mt-2">
              <Checkbox checked={field.value} onChange={field.onChange} />
              <Typography variant="label" className="font-normal">
                Remember me
              </Typography>
            </FormField>
          )}
        />

        {submitError ? (
          <p role="alert" className="text-destructive text-sm">
            {submitError}
          </p>
        ) : null}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>

        <div className="flex items-center gap-2 py-2">
          <hr className="flex-1 border-t" />
          <span className="text-muted-foreground text-xs">or</span>
          <hr className="flex-1 border-t" />
        </div>

        <Button type="button" variant="outline" onClick={handleSsoLogin}>
          Sign in with SSO / OIDC
        </Button>

        <Link
          href="/forgot-password"
          className="text-muted-foreground text-center text-sm hover:underline"
        >
          Forgot password?
        </Link>
      </form>
    </Form>
  );
}
