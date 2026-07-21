import { AuthenticatedUser } from '@repo/shared-types';
import { LoginInput } from '@repo/shared-types';

export interface AuthState {
  user: AuthenticatedUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}
