import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const list = vi.hoisted(() => vi.fn());
vi.mock('@/features/posts/api/posts.api', async (orig) => ({
  ...(await orig<object>()),
  postsApi: { listPagesForCollection: list },
}));

import { useBlogPages } from '../../../../src/features/blog/hooks/useBlogPages';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

describe('useBlogPages', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is idle without a site', () => {
    const { result } = renderHook(() => useBlogPages(undefined), { wrapper });
    expect(list).not.toHaveBeenCalled();
    expect(result.current.blogPages).toEqual([]);
  });

  it('derives blog pages and counts legacy posts', async () => {
    list.mockResolvedValue([
      {
        id: 'b1',
        slug: '/blog',
        data: {
          isBlogPage: true,
          blogTypeId: 'news',
          _schemas: [
            {
              id: 's',
              name: 'S',
              slug: 's',
              entryType: 'multi',
              items: [{ id: 'l1', title: 'Old' }, { id: 'l2' }],
            },
          ],
        },
      },
      { id: 'plain', data: {} },
    ]);
    const { result } = renderHook(() => useBlogPages('shop'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(list).toHaveBeenCalledWith('shop');
    expect(result.current.pages).toHaveLength(2);
    expect(result.current.blogPages).toHaveLength(1);
    expect(result.current.legacyCount).toBe(2);
  });
});
