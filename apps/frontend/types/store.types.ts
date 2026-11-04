import { AuthenticatedUser } from '@mindfiredigital/types';
import { LoginInput } from '@mindfiredigital/types';

export interface AuthState {
  user: AuthenticatedUser | null;
  status:
    | 'idle'
    | 'loading'
    | 'authenticated'
    | 'unauthenticated'
    | 'mfa_challenge_required';
  error: string | null;
  mfaToken: string | null;
  login: (input: LoginInput) => Promise<void>;
  verifyMfaChallenge: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}
