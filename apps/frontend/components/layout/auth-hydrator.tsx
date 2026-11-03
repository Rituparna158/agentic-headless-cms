'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Hydrates the Auth store on the initial client-side load.
 * Calls GET `API_PATHS.AUTH.ME` once on mount to restore session state from
 * the HttpOnly cookie. Rendered once near the top of the app tree.
 * middleware.ts already blocks unauthenticated requests to dashboard routes
 * when there's no session cookie at all, but it can't verify the JWT itself -
 * so if the cookie is present but expired or invalid, the API returns 401
 * and we redirect from here instead.
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
