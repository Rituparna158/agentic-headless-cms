import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const listCollections = vi.fn();
vi.mock('@/features/posts/api/posts.api', async (orig) => ({
  ...(await orig<object>()),
  postsApi: { listCollections: (...a: unknown[]) => listCollections(...a) },
}));

import {
  useSiteConfig,
  normalizeUrlPrefix,
  DEFAULT_ARTICLE_SETTINGS,
} from '../../../src/hooks/useSiteConfig';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

describe('normalizeUrlPrefix', () => {
  it('trims slashes and prefixes one', () => {
    expect(normalizeUrlPrefix('//news/')).toBe('/news');
  });
  it('replaces invalid characters', () => {
    expect(normalizeUrlPrefix('my news!')).toBe('/my-news-');
  });
  it('falls back to /blog when empty', () => {
    expect(normalizeUrlPrefix('  ')).toBe('/blog');
  });
});

describe('useSiteConfig', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns defaults when the site is unknown', async () => {
    listCollections.mockResolvedValue([]);
    const { result } = renderHook(() => useSiteConfig(undefined), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.site).toBeNull();
    expect(result.current.domain).toBe('site.acme.com');
    expect(result.current.environment).toBe('live');
    expect(result.current.articlesEnabled).toBe(true);
    expect(result.current.maintenanceMode).toBe(false);
    expect(result.current.article).toEqual(DEFAULT_ARTICLE_SETTINGS);
  });

  it('reads configuration from site metadata', async () => {
    listCollections.mockResolvedValue([
      {
        id: 's1',
        slug: 'shop',
        metadata: {
          domain: 'shop.example.com',
          status: 'staging',
          hasArticles: false,
          maintenanceMode: true,
          articles: {
            sectionName: 'News',
            urlPrefix: '/news',
            defaultAuthor: 'Ann',
            categories: ['A'],
          },
        },
      },
    ]);
    const { result } = renderHook(() => useSiteConfig('shop'), { wrapper });
    await waitFor(() => expect(result.current.site).not.toBeNull());
    expect(result.current.domain).toBe('shop.example.com');
    expect(result.current.environment).toBe('staging');
    expect(result.current.articlesEnabled).toBe(false);
    expect(result.current.maintenanceMode).toBe(true);
    expect(result.current.article).toEqual({
      sectionName: 'News',
      urlPrefix: '/news',
      defaultAuthor: 'Ann',
      categories: ['A'],
    });
  });

  it('falls back to default domain and categories', async () => {
    listCollections.mockResolvedValue([
      { id: 's2', slug: 'x', metadata: { articles: { categories: [] } } },
    ]);
    const { result } = renderHook(() => useSiteConfig('s2'), { wrapper });
    await waitFor(() => expect(result.current.site).not.toBeNull());
    expect(result.current.domain).toBe('s2.acme.com');
    expect(result.current.article.categories).toEqual(
      DEFAULT_ARTICLE_SETTINGS.categories,
    );
  });
});
