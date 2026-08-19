import { create } from 'zustand';
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
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: 'idle',
  mfaToken: null,
  get isAuthenticated() {
    return get().status === 'authenticated';
  },
  setAuthData: (user) => {
    set({
      user,
      status: 'authenticated',
      mfaToken: null,
    });
  },
  setMfaChallenge: (mfaToken) => {
    set({
      user: null,
      status: 'mfa_challenge_required',
      mfaToken,
    });
  },
  setStatus: (status) => {
    set({ status });
  },
  clearAuth: () => {
    set({
      user: null,
      status: 'unauthenticated',
      mfaToken: null,
    });
  },
}));
