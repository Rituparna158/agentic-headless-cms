'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { loginSchema } from '@repo/validation';
import { type LoginInput } from '@repo/types';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { API_BASE_URL } from '@/lib/api-client';
import { API_PATHS } from '@/lib/constants/api-paths';
import { useAuthStore } from '@/stores/auth-store';

export function LoginForm() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const status = useAuthStore((state) => state.status);
  const verifyMfaChallenge = useAuthStore((state) => state.verifyMfaChallenge);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

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
          onSubmit={async (e) => {
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
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-lg tracking-widest font-mono"
              required
              autoFocus
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
            }}
          >
            Cancel and Sign In Again
          </Button>
        </form>
      </div>
    );
  }

  function handleSsoLogin() {
    // Route issue #12 (or a later SSO/OIDC-specific issue — the SRS's
    // FR-AC-4 scopes SSO separately from #12's JWT-only auth) is planned
    // to add: GET /api/v1/auth/sso, which redirects to the configured
    // identity provider.
    window.location.href = `${API_BASE_URL}${API_PATHS.AUTH.SSO}`;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="grid gap-4"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">Remember me</FormLabel>
            </FormItem>
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

        <div className="flex items-center gap-2">
          <Separator className="flex-1" />
          <span className="text-muted-foreground text-xs">or</span>
          <Separator className="flex-1" />
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
