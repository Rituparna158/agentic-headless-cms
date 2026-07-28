'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Calls GET /api/v1/auth/me once on mount to restore session state from
 * the HttpOnly cookie (if any). middleware.ts already blocks unauthenticated
 * requests to dashboard routes when there's no session cookie at all, but it
 * can't verify the JWT itself - so if the cookie is present but expired or
 * invalid, /auth/me returns 401 and we redirect from here instead.
 */
export function AuthHydrator() {
  const router = useRouter();
  const hydrate = useAuthStore((state) => state.hydrate);
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  return null;
}
