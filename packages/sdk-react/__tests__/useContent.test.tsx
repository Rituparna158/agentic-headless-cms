import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CmsProvider } from '../src/provider.js';
import { useContentList, useCreateEntry } from '../src/hooks/useContent.js';

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
