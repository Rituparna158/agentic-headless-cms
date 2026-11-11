'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
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
import { AlertCircle, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
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
    resolver: zodResolver(loginSchema),
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
      setSubmitError(
        useAuthStore.getState().error ?? 'Login failed. Please try again.',
      );
    }
  }

  // Two-Factor Authentication Verification Step
  if (status === 'mfa_challenge_required') {
    return (
      <div className="space-y-5 animate-in fade-in-50">
        <div className="space-y-1 mb-5 text-left">
          <Typography
            variant="h2"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            Two-Factor Authentication
          </Typography>
          <p className="text-xs text-muted-foreground">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>

        <form
          method="POST"
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
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label htmlFor="mfa-code" className="sr-only">
              Security Code
            </label>
            <Input
              id="mfa-code"
              placeholder="000000"
              value={code}
              onChange={(val: string) =>
                setCode(val.replace(/\D/g, '').slice(0, 6))
              }
              className="text-center text-lg tracking-[0.4em] font-mono h-10"
              variant="default"
              autoFocus={true}
            />
          </div>

          {submitError ? (
            <div
              role="alert"
              className="flex items-center gap-2 p-2.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md justify-center"
            >
              <AlertCircle className="size-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={verifying || code.length !== 6}
            className="w-full h-9 font-medium text-xs"
          >
            {verifying ? (
              <div className="flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Verifying…</span>
              </div>
            ) : (
              'Verify'
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
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
            className="w-full text-xs text-muted-foreground"
          >
            Cancel
          </Button>

          <div className="flex flex-col items-center gap-1.5 pt-3 border-t border-border/60">
            <p className="text-xs text-muted-foreground text-center">
              Lost access to your authenticator?
            </p>
            {resetRequested ? (
              <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium py-0.5">
                <CheckCircle2 className="size-3.5" />
                <span>Reset request submitted.</span>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={resetting}
                className="text-xs h-7 px-2.5"
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
                {resetting ? 'Requesting…' : 'Request MFA Reset'}
              </Button>
            )}
            {resetError && (
              <p role="alert" className="text-xs text-destructive text-center">
                {resetError}
              </p>
            )}
          </div>
        </form>
      </div>
    );
  }

  function handleSsoLogin() {
    window.location.href = `${API_BASE_URL}${API_PATHS.AUTH.SSO}?redirectUrl=${encodeURIComponent(
      window.location.origin,
    )}&appId=HEADLESS_CMS`;
  }

  return (
    <Form spacing="comfortable">
      {/* Form Header */}
      <div className="space-y-1 mb-5 text-left">
        <Typography
          variant="h2"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          Sign in
        </Typography>
        <p className="text-xs text-muted-foreground">
          Enter your email and password to access your account.
        </p>
      </div>

      {urlError && (
        <div className="mb-4">
          <div
            role="alert"
            className="flex items-start gap-2 text-destructive text-xs p-2.5 bg-destructive/10 rounded-md border border-destructive/20"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{urlError}</span>
          </div>
        </div>
      )}

      <form
        method="POST"
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="space-y-4 text-left"
      >
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormField>
              <label htmlFor="email">
                <Typography
                  variant="label"
                  className="block mb-1 text-xs font-medium text-foreground"
                >
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
                autoComplete="email"
              />
            </FormField>
          )}
        />

        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <FormField>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password">
                  <Typography
                    variant="label"
                    className="text-xs font-medium text-foreground"
                  >
                    Password
                  </Typography>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary font-medium hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={field.value}
                onChange={(val: string) => field.onChange(val)}
                error={fieldState.error?.message}
                variant="default"
                placeholder="Enter your password"
                showPasswordToggle={true}
                autoComplete="current-password"
              />
            </FormField>
          )}
        />

        <Controller
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <FormField className="flex flex-row items-center gap-2 space-y-0 pt-0.5">
              <Checkbox checked={field.value} onChange={field.onChange} />
              <Typography
                variant="label"
                className="font-normal text-xs text-muted-foreground select-none"
              >
                Remember me
              </Typography>
            </FormField>
          )}
        />

        {submitError ? (
          <div
            role="alert"
            className="flex items-center gap-2 p-2.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
          >
            <AlertCircle className="size-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full h-9 font-medium text-xs"
        >
          {form.formState.isSubmitting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin" />
              <span>Signing in…</span>
            </div>
          ) : (
            'Sign in'
          )}
        </Button>

        <div className="relative my-2 py-0.5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/80" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-card px-2 text-muted-foreground font-medium">
              or
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleSsoLogin}
          className="w-full h-9 gap-2 text-xs font-medium"
        >
          <KeyRound className="size-3.5 text-muted-foreground" />
          <span>Sign in with SSO / OIDC</span>
        </Button>
      </form>
    </Form>
  );
}
