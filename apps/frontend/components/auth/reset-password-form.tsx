'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { resetPasswordSchema } from '@repo/validation';
import { z } from 'zod';

import { Button, Input, Form, FormField, Typography } from '@repo/shared-ui';
import { Controller } from 'react-hook-form';
import { resetPassword } from '@/lib/api/auth';

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: '' },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setSubmitError(null);
    try {
      await resetPassword(values.token, values.password);
      setSuccess(true);
    } catch (error) {
      const err = error as Error;
      setSubmitError(
        err.message ||
          'Failed to reset password. The link might be expired or invalid.',
      );
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-destructive">
          Invalid password reset link. No token found in the URL.
        </p>
        <Button asChild className="w-full">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm font-medium text-green-600">
          Your password has been successfully reset.
        </p>
        <Button asChild className="w-full">
          <Link href="/login">Sign In Now</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="space-y-1 text-center mb-4">
        <p className="text-sm text-muted-foreground">
          Enter your new password below.
        </p>
      </div>

      <Form spacing="comfortable">
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormField>
                <Typography variant="label" className="block mb-1">
                  New Password
                </Typography>
                <Input
                  type="password"
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                  error={fieldState.error?.message}
                  variant="default"
                  placeholder="Enter new password"
                />
              </FormField>
            )}
          />

          {submitError ? (
            <p role="alert" className="text-destructive text-sm text-center">
              {submitError}
            </p>
          ) : null}

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
