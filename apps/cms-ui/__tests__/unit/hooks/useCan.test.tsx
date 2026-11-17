import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const listCollections = vi.fn();
vi.mock('@/features/posts/api/posts.api', async (orig) => ({
  ...(await orig<object>()),
  postsApi: { listCollections: (...a: unknown[]) => listCollections(...a) },
}));

import { useAuthStore } from '../../../src/features/auth/store/auth.store';
import { useCan, useSiteAccess } from '../../../src/hooks/useCan';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

const setUser = (user: unknown) => useAuthStore.setState({ user } as never);

describe('useSiteAccess / useCan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listCollections.mockResolvedValue([{ id: 'site-1', slug: 'shop' }]);
  });

  it('is ready immediately without a site and denies anonymous users', () => {
    setUser(null);
    const { result } = renderHook(() => useSiteAccess(), { wrapper });
    expect(result.current.ready).toBe(true);
    expect(result.current.can('manage_media')).toBe(false);
    expect(listCollections).not.toHaveBeenCalled();
  });

  it('becomes ready after the site list loads', async () => {
    setUser({ id: 'u', roles: [], permissions: [] });
    const { result } = renderHook(() => useSiteAccess('shop'), { wrapper });
    expect(result.current.ready).toBe(false);
    await waitFor(() => expect(result.current.ready).toBe(true));
  });

  it('checks capabilities scoped to the resolved site', async () => {
    setUser({
      id: 'u',
      roles: [],
      permissions: [
        {
          effect: 'allow',
          action: 'x',
          schemaId: 'site-1',
          condition: { capability: 'manage_media' },
        },
      ],
    });
    const { result } = renderHook(() => useCan('shop'), { wrapper });
    await waitFor(() => expect(listCollections).toHaveBeenCalled());
    await waitFor(() => expect(result.current('manage_media')).toBe(true));
    expect(result.current('manage_settings')).toBe(false);
  });
});
