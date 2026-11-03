import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CmsProvider } from '../src/provider.js';
import {
  useContentList,
  useCreateEntry,
  useContentEntry,
  useUnpublishEntry,
} from '../src/hooks/useContent.js';
import { contentKeys } from '../src/constants.js';

// We could use msw, but vi.mock is simpler for direct class mocking if needed.
// However, CmsProvider uses createClient, which instantiates AgenticCmsClient.
// We can mock the fetch global.
const mockFetch = vi.fn();
global.fetch = mockFetch;

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <CmsProvider baseUrl="http://localhost:3000" apiToken="test-token">
      {children}
    </CmsProvider>
  </QueryClientProvider>
);

describe('useContentList', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    queryClient.clear();
  });

  it('fetches a list of content entries', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { data: [{ id: '1', title: 'Test Entry' }], meta: { total: 1 } },
      }),
    });

    const { result } = renderHook(() => useContentList('articles'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      data: [{ id: '1', title: 'Test Entry' }],
      meta: { total: 1 },
    });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/content/articles'),
      expect.anything(),
    );
  });
});

describe('useContentEntry', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    queryClient.clear();
  });

  it('fetches a single entry with locale and separates cache keys', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { id: '1', title: 'Entrada en español' },
      }),
    });

    const { result } = renderHook(
      () => useContentEntry('articles', '1', { locale: 'es' }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      id: '1',
      title: 'Entrada en español',
    });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/content/articles/1?locale=es'),
      expect.anything(),
    );

    // Verify cache key differentiation
    const esKey = contentKeys.detail('articles', '1', 'es');
    const enKey = contentKeys.detail('articles', '1', 'en');
    expect(esKey).not.toEqual(enKey);
  });
});

describe('useCreateEntry', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    queryClient.clear();
  });

  it('creates an entry and invalidates the list query', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { id: '2', title: 'New Entry' },
      }),
    });

    const { result } = renderHook(() => useCreateEntry('articles'), {
      wrapper,
    });

    result.current.mutate({ title: 'New Entry' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ id: '2', title: 'New Entry' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/content/articles'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

describe('useUnpublishEntry', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    queryClient.clear();
  });

  it('unpublishes an entry and invalidates queries', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { id: '1', status: 'draft' },
      }),
    });

    const { result } = renderHook(() => useUnpublishEntry('articles'), {
      wrapper,
    });

    result.current.mutate({ entryId: '1', locale: 'es' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ id: '1', status: 'draft' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/content/articles/1/unpublish?locale=es'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
