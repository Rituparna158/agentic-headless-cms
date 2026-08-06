import { AuthenticatedUser } from '@repo/types';
import { LoginInput } from '@repo/types';

export interface AuthState {
  user: AuthenticatedUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}
