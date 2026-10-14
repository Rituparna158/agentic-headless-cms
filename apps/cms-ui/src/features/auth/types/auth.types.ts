import type { AuthenticatedUser } from '@repo/types';

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
