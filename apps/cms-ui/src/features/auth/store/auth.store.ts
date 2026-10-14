import { create } from 'zustand';
import type { AuthState, AuthStatus } from '../types/auth.types';

export type { AuthState, AuthStatus };
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
