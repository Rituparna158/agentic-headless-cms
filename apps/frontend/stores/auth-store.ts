import { create } from 'zustand';
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  verifyMfaChallenge as verifyMfaChallengeRequest,
} from '@/lib/api/auth';
import { AuthState } from '@/types/store.types';
import { ApiError } from '@/lib/api-client';
import type { AuthenticatedUser } from '@repo/types';

/**
 * No persist middleware here deliberately: the session itself lives in an
 * HttpOnly cookie (issue #12), which client-side JS can't read or write —
 * that's the point of HttpOnly, it's not readable by the frontend even if
 * XSS occurs elsewhere on the page. This store only caches the *profile*
 * for the current tab; on a fresh load, hydrate() re-derives it from the
 * server via the cookie, it isn't persisted to localStorage/sessionStorage.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  error: null,
  mfaToken: null,

  login: async (input) => {
    set({ status: 'loading', error: null, mfaToken: null });
    try {
      const res = await loginRequest(input);
      if (res && 'mfaRequired' in res && res.mfaRequired) {
        set({
          user: null,
          status: 'mfa_challenge_required',
          error: null,
          mfaToken: res.mfaToken,
        });
      } else {
        set({
          user: res as AuthenticatedUser,
          status: 'authenticated',
          error: null,
          mfaToken: null,
        });
      }
    } catch (error) {
      set({
        user: null,
        status: 'unauthenticated',
        error:
          error instanceof ApiError
            ? error.message
            : 'Login failed. Please try again.',
        mfaToken: null,
      });
      throw error;
    }
  },

  verifyMfaChallenge: async (code) => {
    const { mfaToken } = useAuthStore.getState();
    if (!mfaToken) {
      throw new Error('No active MFA challenge session');
    }
    set({ status: 'loading', error: null });
    try {
      const user = await verifyMfaChallengeRequest(mfaToken, code);
      set({ user, status: 'authenticated', error: null, mfaToken: null });
    } catch (error) {
      set({
        status: 'mfa_challenge_required',
        error:
          error instanceof ApiError
            ? error.message
            : 'MFA verification failed. Please try again.',
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await logoutRequest();
    } catch {
      // Ignore network/server errors during logout so client state is cleared regardless
    } finally {
      set({
        user: null,
        status: 'unauthenticated',
        error: null,
        mfaToken: null,
      });
    }
  },

  hydrate: async () => {
    set({ status: 'loading' });
    try {
      const user = await getCurrentUser();
      set({ user, status: 'authenticated', error: null, mfaToken: null });
    } catch {
      await logoutRequest().catch(() => {});
      set({
        user: null,
        status: 'unauthenticated',
        error: null,
        mfaToken: null,
      });
    }
  },
}));
