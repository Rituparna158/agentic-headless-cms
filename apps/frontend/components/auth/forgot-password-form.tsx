'use client';

import { useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { forgotPasswordSchema } from '@repo/validation';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { requestPasswordReset } from '@/lib/api/auth';

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setSubmitError(null);
    setSuccessMessage(null);
    try {
      const res = await requestPasswordReset(values.email);
      setSuccessMessage(
        res.message ||
          'If the email exists, a password reset link has been sent.',
      );
    } catch (error) {
      const err = error as Error;
      setSubmitError(
        err.message || 'Failed to request password reset. Please try again.',
      );
    }
  }

  return (
    <div className="grid gap-4">
      <div className="space-y-1 text-center mb-4">
        <p className="text-sm text-muted-foreground">
          Enter your email address and we will send you a link to reset your
          password.
        </p>
      </div>

      {successMessage ? (
        <div className="space-y-4 text-center">
          <p className="text-sm font-medium text-green-600">{successMessage}</p>
          <Button asChild className="w-full">
            <Link href="/login">Return to Sign In</Link>
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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

            {submitError ? (
              <p role="alert" className="text-destructive text-sm text-center">
                {submitError}
              </p>
            ) : null}

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? 'Sending Request...'
                : 'Send Reset Link'}
            </Button>

            <Link
              href="/login"
              className="text-muted-foreground text-center text-sm mt-2 hover:underline"
            >
              Back to Sign In
            </Link>
          </form>
        </Form>
      )}
    </div>
  );
}
