import type { AuthenticatedUser } from '@repo/types';
import type { loginSchema } from '@repo/validation';
import type { z } from 'zod';

export type LoginInputValues = z.input<typeof loginSchema>;
export type LoginOutputValues = z.output<typeof loginSchema>;

export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'mfa_challenge_required';

export interface AuthState {
  user: AuthenticatedUser | null;
  status: AuthStatus;
  mfaToken: string | null;
  isAuthenticated: boolean; // Computed
  setAuthData: (user: AuthenticatedUser) => void;
  setMfaChallenge: (token: string) => void;
  setStatus: (status: AuthStatus) => void;
  clearAuth: () => void;
}
