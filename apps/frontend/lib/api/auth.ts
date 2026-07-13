import type { AuthenticatedUser, LoginInput } from '@repo/shared-types';
import { apiFetch } from '@/lib/api-client';

/**
 * Calls the route issue #12 (JWT Authentication & RBAC) is planned to add:
 * POST /api/v1/auth/login, issuing an HttpOnly session cookie on success.
 * Until that lands, this will reject with an ApiError (0 = unreachable, or
 * 404 once the server responds but the route doesn't exist yet) — the
 * calling store/UI already handles that as a normal error state, so no
 * further changes are needed here once the backend route exists.
 */
export function login(input: LoginInput): Promise<AuthenticatedUser> {
  return apiFetch<AuthenticatedUser>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Calls the route issue #12 is planned to add: POST /api/v1/auth/logout. */
export function logout(): Promise<void> {
  return apiFetch<void>('/api/v1/auth/logout', { method: 'POST' });
}

/**
 * Calls the route issue #12 is planned to add: GET /api/v1/auth/me —
 * returns the current session's user based on the HttpOnly cookie, or a
 * 401 if there isn't one. Used to restore auth state on page load, since
 * the frontend can't read the HttpOnly cookie itself to know if a session
 * already exists.
 */
export function getCurrentUser(): Promise<AuthenticatedUser> {
  return apiFetch<AuthenticatedUser>('/api/v1/auth/me');
}
