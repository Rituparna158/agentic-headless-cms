import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const api = vi.hoisted(() => ({
  listMedia: vi.fn(),
  listFolders: vi.fn(),
  uploadMedia: vi.fn(),
  deleteMedia: vi.fn(),
  deleteBulkMedia: vi.fn(),
  createFolder: vi.fn(),
  deleteFolder: vi.fn(),
}));
vi.mock('../../../../src/features/media/api/media.api', () => ({
  mediaApi: api,
}));

import {
  useInfiniteMedia,
  useMediaFolders,
  useUploadMedia,
  useDeleteMedia,
  useDeleteBulkMedia,
  useCreateFolder,
  useDeleteFolder,
} from '../../../../src/features/media/hooks/useMediaQueries';

let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

describe('media query hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it('useInfiniteMedia paginates until the last page', async () => {
    api.listMedia
      .mockResolvedValueOnce({
        data: [1],
        meta: { pagination: { page: 1, pageCount: 2 } },
      })
      .mockResolvedValueOnce({
        data: [2],
        meta: { pagination: { page: 2, pageCount: 2 } },
      });
    const { result } = renderHook(
      () => useInfiniteMedia({ folderId: 'f', pageSize: 5 }),
      {
        wrapper,
      },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.listMedia.mock.calls[0]![0]).toEqual({
      page: 1,
      pageSize: 5,
      folderId: 'f',
    });
    expect(result.current.hasNextPage).toBe(true);
    await act(() => result.current.fetchNextPage());
    await waitFor(() => expect(result.current.hasNextPage).toBe(false));
  });

  it('useInfiniteMedia defaults the page size', async () => {
    api.listMedia.mockResolvedValue({
      data: [],
      meta: { pagination: { page: 1, pageCount: 1 } },
    });
    renderHook(() => useInfiniteMedia(), { wrapper });
    await waitFor(() => expect(api.listMedia).toHaveBeenCalled());
    expect(api.listMedia.mock.calls[0]![0].pageSize).toBe(24);
  });

  it('useMediaFolders lists folders for a parent', async () => {
    api.listFolders.mockResolvedValue([]);
    renderHook(() => useMediaFolders('p1'), { wrapper });
    await waitFor(() => expect(api.listFolders).toHaveBeenCalled());
    expect(api.listFolders.mock.calls[0]![0]).toBe('p1');
  });

  it.each([
    [
      'useUploadMedia',
      useUploadMedia,
      'uploadMedia',
      { file: new File(['x'], 'a.png') },
      ['media'],
    ],
    ['useDeleteMedia', useDeleteMedia, 'deleteMedia', 'id1', ['media']],
    [
      'useDeleteBulkMedia',
      useDeleteBulkMedia,
      'deleteBulkMedia',
      ['a', 'b'],
      ['media'],
    ],
    [
      'useCreateFolder',
      useCreateFolder,
      'createFolder',
      { name: 'n' },
      ['media-folders'],
    ],
    [
      'useDeleteFolder',
      useDeleteFolder,
      'deleteFolder',
      'f1',
      ['media-folders', 'media'],
    ],
  ] as const)(
    '%s calls the API and invalidates caches',
    async (_n, hook, method, arg, keys) => {
      (api as Record<string, ReturnType<typeof vi.fn>>)[
        method
      ]!.mockResolvedValue({});
      const spy = vi.spyOn(client, 'invalidateQueries');
      const { result } = renderHook(
        () =>
          (hook as () => { mutateAsync: (a: unknown) => Promise<unknown> })(),
        {
          wrapper,
        },
      );
      await act(() => result.current.mutateAsync(arg));
      expect(
        (api as Record<string, ReturnType<typeof vi.fn>>)[method],
      ).toHaveBeenCalled();
      const invalidated = spy.mock.calls.map(
        (c) => (c[0] as { queryKey: string[] }).queryKey[0],
      );
      expect(invalidated).toEqual(keys);
    },
  );
});
