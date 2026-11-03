import { create } from 'zustand';
import type { AuthState, AuthStatus } from '../types/auth.types';

export type { AuthState, AuthStatus };
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  mfaToken: null,
  isAuthenticated: false,
  setAuthData: (user) => {
    set({
      user,
      status: 'authenticated',
      mfaToken: null,
      isAuthenticated: true,
    });
  },
  setMfaChallenge: (mfaToken) => {
    set({
      user: null,
      status: 'mfa_challenge_required',
      mfaToken,
      isAuthenticated: false,
    });
  },
  setStatus: (status) => {
    set({ status, isAuthenticated: status === 'authenticated' });
  },
  clearAuth: () => {
    set({
      user: null,
      status: 'unauthenticated',
      mfaToken: null,
      isAuthenticated: false,
    });
  },
}));
