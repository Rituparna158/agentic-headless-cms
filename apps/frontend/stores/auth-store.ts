import { create } from 'zustand';
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
} from '@/lib/api/auth';
import { AuthState } from '@/types/store.types';
import { ApiError } from '@/lib/api-client';

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

  login: async (input) => {
    set({ status: 'loading', error: null });
    try {
      const user = await loginRequest(input);
      set({ user, status: 'authenticated', error: null });
    } catch (error) {
      set({
        user: null,
        status: 'unauthenticated',
        error:
          error instanceof ApiError
            ? error.message
            : 'Login failed. Please try again.',
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await logoutRequest();
    } finally {
      set({ user: null, status: 'unauthenticated', error: null });
    }
  },

  hydrate: async () => {
    set({ status: 'loading' });
    try {
      const user = await getCurrentUser();
      set({ user, status: 'authenticated', error: null });
    } catch {
      await logoutRequest().catch(() => {});
      set({ user: null, status: 'unauthenticated', error: null });
    }
  },
}));
