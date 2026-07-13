'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Calls GET /api/v1/auth/me once on mount to restore session state from
 * the HttpOnly cookie (if any). Deliberately does NOT redirect to /login
 * on failure yet — issue #12 (the route this calls) doesn't exist, so
 * every hydrate() call fails today, and redirecting on that would make
 * the dashboard shell impossible to view before #12 ships. Add the
 * redirect here once #12 lands: `if (status === 'unauthenticated') router.replace('/login')`.
 */
export function AuthHydrator() {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return null;
}
