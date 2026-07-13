import { z } from 'zod';

/**
 * Shared between the admin UI's login form and the backend's POST
 * /api/v1/auth/login handler (once implemented — see issue #12), so both
 * sides validate the exact same shape instead of two hand-maintained
 * copies drifting apart.
 */
// `rememberMe` is a plain required boolean, not `.default(false)` — a
// schema-level default makes Zod's *input* type (what react-hook-form's
// useForm<T> needs) diverge from its *output* type (boolean vs
// boolean | undefined), which zodResolver's types don't reconcile cleanly.
// The form supplies the default via useForm's own `defaultValues` instead,
// so the field is never actually missing in practice.
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Shape returned by POST /api/v1/auth/login once #12 is implemented. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
}
