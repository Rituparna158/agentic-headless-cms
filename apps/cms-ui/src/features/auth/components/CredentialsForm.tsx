import { Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { loginSchema } from '@repo/validation';
import type { LoginInput } from '@repo/types';

import {
  Button,
  Input,
  Checkbox,
  Form,
  FormField,
  Typography,
} from '@repo/shared-ui';

import { useLoginMutation } from '../hooks/useAuthMutations';
import { authApi } from '../api/auth.api';

export function CredentialsForm() {
  const { mutate: login, isPending, error } = useLoginMutation();

  const form = useForm<LoginInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(loginSchema) as any,
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit = (values: LoginInput) => {
    login(values);
  };

  const handleSsoLogin = () => {
    window.location.href = authApi.getOidcLoginUrl();
  };

  return (
    <Form spacing="comfortable">
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
                onChange={field.onChange}
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
                onChange={field.onChange}
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

        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error instanceof Error
              ? error.message
              : 'Login failed. Please try again.'}
          </p>
        ) : null}

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Signing in…' : 'Sign in'}
        </Button>

        <div className="flex items-center gap-2 py-2">
          <hr className="flex-1 border-t border-border" />
          <span className="text-muted-foreground text-xs">or</span>
          <hr className="flex-1 border-t border-border" />
        </div>

        <Button type="button" variant="outline" onClick={handleSsoLogin}>
          Sign in with SSO / OIDC
        </Button>

        <Link
          to="/forgot-password"
          className="text-muted-foreground text-center text-sm hover:underline"
        >
          Forgot password?
        </Link>
      </form>
    </Form>
  );
}
