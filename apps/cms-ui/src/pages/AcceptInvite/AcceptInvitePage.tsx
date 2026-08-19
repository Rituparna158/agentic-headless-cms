import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Input, Form, FormField, Typography } from '@repo/shared-ui';
import { useForm, Controller } from 'react-hook-form';
import { authApi } from '../../features/auth/api/auth.api';
export const AcceptInvitePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState<string | null>(null);
  const form = useForm({
    defaultValues: { password: '', confirmPassword: '', name: '' },
  });
  const onSubmit = async (values: {
    password: string;
    confirmPassword: string;
    name: string;
  }) => {
    if (!token) {
      setError('Invalid or missing invitation token.');
      return;
    }
    if (values.password !== values.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (values.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    setError(null);
    try {
      await authApi.acceptInvite({
        token,
        password: values.password,
        name: values.name,
      });
      navigate('/login');
    } catch (err) {
      const e = err as {
        response?: { data?: { error?: { message?: string } } };
        message?: string;
      };
      setError(
        e.response?.data?.error?.message ||
          e.message ||
          'Failed to accept invitation',
      );
    }
  };
  if (!token) {
    return (
      <div className="flex flex-col space-y-6 w-full sm:w-[350px] mx-auto text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-destructive">
          Invalid Invitation
        </h1>
        <p className="text-sm text-muted-foreground">
          This invitation link is invalid or missing the token.
        </p>
        <Link to="/login">
          <Button variant="outline" className="w-full">
            Return to sign in
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col space-y-6 w-full sm:w-[350px] mx-auto">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Accept Invitation
        </h1>
        <p className="text-sm text-muted-foreground">
          Welcome! Please set a password to activate your account.
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
              name="name"
              render={({ field }) => (
                <FormField>
                  <label htmlFor="name">
                    <Typography variant="label" className="block mb-1">
                      Full Name
                    </Typography>
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Jane Doe"
                    value={field.value}
                    onChange={field.onChange}
                    variant="default"
                  />
                </FormField>
              )}
            />
            <Controller
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormField>
                  <label htmlFor="password">
                    <Typography variant="label" className="block mb-1">
                      Password
                    </Typography>
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={field.value}
                    onChange={field.onChange}
                    variant="default"
                  />
                </FormField>
              )}
            />
            <Controller
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormField>
                  <label htmlFor="confirmPassword">
                    <Typography variant="label" className="block mb-1">
                      Confirm Password
                    </Typography>
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    value={field.value}
                    onChange={field.onChange}
                    variant="default"
                  />
                </FormField>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? 'Activating...'
                : 'Activate Account'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};
