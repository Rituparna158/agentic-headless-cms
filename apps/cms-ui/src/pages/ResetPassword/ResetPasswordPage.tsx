import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Input, Form, FormField, Typography } from '@repo/shared-ui';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema } from '@repo/validation';
import { authApi } from '../../features/auth/api/auth.api';
export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState<string | null>(null);
  const form = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(resetPasswordSchema) as any,
    defaultValues: { token: token || '', password: '' },
  });
  const onSubmit = async (values: { password: string }) => {
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }
    setError(null);
    try {
      await authApi.resetPassword({ token, password: values.password });
      navigate('/login');
    } catch (err) {
      const e = err as {
        response?: { data?: { error?: { message?: string } } };
        message?: string;
      };
      setError(
        e.response?.data?.error?.message ||
          e.message ||
          'Failed to reset password',
      );
    }
  };
  if (!token) {
    return (
      <div className="flex flex-col space-y-6 w-full sm:w-[350px] mx-auto text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-destructive">
          Invalid Link
        </h1>
        <p className="text-sm text-muted-foreground">
          This password reset link is invalid or missing the reset token.
        </p>
        <Link to="/forgot-password">
          <Button variant="outline" className="w-full">
            Request new link
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col space-y-6 w-full sm:w-[350px] mx-auto">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Set New Password
        </h1>
        <p className="text-sm text-muted-foreground">
          Please enter your new password below.
        </p>
      </div>
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
              name="password"
              render={({ field, fieldState }) => (
                <FormField>
                  <label htmlFor="password">
                    <Typography variant="label" className="block mb-1">
                      New Password
                    </Typography>
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                    variant="default"
                  />
                </FormField>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};
