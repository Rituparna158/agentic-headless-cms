import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const list = vi.hoisted(() => vi.fn());
vi.mock('@/features/posts/api/posts.api', async (orig) => ({
  ...(await orig<object>()),
  postsApi: { listCollections: list },
}));

import {
  useSiteInfo,
  siteInfoFrom,
} from '../../../../src/features/render/useSiteInfo';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

describe('siteInfoFrom', () => {
  it('uses the fallback name and no extras when the site is unknown', () => {
    expect(siteInfoFrom(undefined, 'fallback')).toEqual({
      name: 'fallback',
      logoUrl: undefined,
      seo: undefined,
      baseUrl: undefined,
    });
  });

  it('reads name, logo, seo and normalises the domain', () => {
    const info = siteInfoFrom(
      {
        name: 'Shop',
        metadata: {
          domain: ' http://shop.example.com ',
          logoUrl: 'file.png',
          seo: { title: 'T' },
        },
      } as never,
      'x',
    );
    expect(info.name).toBe('Shop');
    expect(info.baseUrl).toBe('https://shop.example.com');
    expect(info.logoUrl).toContain('file.png');
    expect(info.seo).toEqual({ title: 'T' });
  });

  it('ignores a blank domain and non-string logo', () => {
    const info = siteInfoFrom(
      { name: 'S', metadata: { domain: '  ', logoUrl: 3 } } as never,
      'x',
    );
    expect(info.baseUrl).toBeUndefined();
    expect(info.logoUrl).toBeUndefined();
  });
});

describe('useSiteInfo', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves the site by slug', async () => {
    list.mockResolvedValue([
      { id: '1', slug: 'shop', name: 'Shop', metadata: {} },
    ]);
    const { result } = renderHook(() => useSiteInfo('shop'), { wrapper });
    await waitFor(() => expect(result.current.name).toBe('Shop'));
  });

  it('falls back to the slug as the name', async () => {
    list.mockResolvedValue([]);
    const { result } = renderHook(() => useSiteInfo('ghost'), { wrapper });
    await waitFor(() => expect(list).toHaveBeenCalled());
    expect(result.current.name).toBe('ghost');
  });

  it('does not fetch without a slug', () => {
    renderHook(() => useSiteInfo(''), { wrapper });
    expect(list).not.toHaveBeenCalled();
  });
});
