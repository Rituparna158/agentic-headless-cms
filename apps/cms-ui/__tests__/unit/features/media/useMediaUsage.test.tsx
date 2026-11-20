import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const api = vi.hoisted(() => ({
  listCollections: vi.fn(),
  listPagesForCollection: vi.fn(),
  listEntries: vi.fn(),
}));
vi.mock('@/features/posts/api/posts.api', () => ({ postsApi: api }));

import { useMediaUsage } from '../../../../src/features/media/hooks/useMediaUsage';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

describe('useMediaUsage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('finds the sites whose content references an asset', async () => {
    api.listCollections.mockResolvedValue([
      { id: '1', name: 'Shop', slug: 'shop' },
      { id: '2', name: '', slug: 'blog' },
    ]);
    api.listPagesForCollection.mockImplementation(async (slug: string) =>
      slug === 'shop' ? [{ body: 'https://cdn/hero.png' }] : [],
    );
    api.listEntries.mockResolvedValue({ entries: [] });
    const { result } = renderHook(() => useMediaUsage(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.siteCollections).toHaveLength(2);
    expect(
      result.current.getAssetSites({
        id: 'zzz',
        url: 'https://cdn/hero.png',
      } as never),
    ).toEqual(['Shop']);
    expect(
      result.current.getAssetSites({
        id: 'zzz',
        filename: 'nope.png',
      } as never),
    ).toEqual([]);
    expect(result.current.getAssetSites(undefined as never)).toEqual([]);
  });

  it('tolerates per-site failures', async () => {
    api.listCollections.mockResolvedValue([
      { id: '1', name: 'Shop', slug: 'shop' },
    ]);
    api.listPagesForCollection.mockRejectedValue(new Error('x'));
    api.listEntries.mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useMediaUsage(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.siteCollections).toHaveLength(1);
  });

  it('returns empty data when listing collections fails', async () => {
    api.listCollections.mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useMediaUsage(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.siteCollections).toEqual([]);
    expect(result.current.getAssetSites({ id: '1' } as never)).toEqual([]);
  });
});
