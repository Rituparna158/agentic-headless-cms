import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Form, FormField, Typography } from '@repo/shared-ui';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema } from '@repo/validation';
import { authApi } from '../../features/auth/api/auth.api';
export const ForgotPasswordPage = () => {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<{ email: string }>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(forgotPasswordSchema) as any,
    defaultValues: { email: '' },
  });
  const onSubmit = async (values: { email: string }) => {
    setError(null);
    try {
      await authApi.forgotPassword(values.email);
      setSuccess(true);
    } catch (err) {
      const e = err as {
        response?: { data?: { error?: { message?: string } } };
        message?: string;
      };
      setError(
        e.response?.data?.error?.message ||
          e.message ||
          'Failed to request password reset',
      );
    }
  };
  return (
    <div className="flex flex-col space-y-6 w-full sm:w-[350px] mx-auto">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Forgot Password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email to receive a password reset link
        </p>
      </div>
      {success ? (
        <div className="space-y-4">
          <p
            role="alert"
            className="text-sm p-3 bg-green-50 text-green-900 border border-green-200 rounded-md text-center"
          >
            Check your email for a link to reset your password. If it
            doesn&apos;t appear within a few minutes, check your spam folder.
          </p>
          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:underline"
            >
              Return to sign in
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <p
              role="alert"
              className="text-destructive text-sm p-3 bg-destructive/10 rounded-md border border-destructive/20 text-center"
            >
              {error}
            </p>
          )}
          <Form spacing="comfortable">
            <form
              onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
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
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                      variant="default"
                    />
                  </FormField>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'Sending link...'
                  : 'Send reset link'}
              </Button>
            </form>
          </Form>
          <div className="text-center mt-4">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:underline"
            >
              Back to login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
