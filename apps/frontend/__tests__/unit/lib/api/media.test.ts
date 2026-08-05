/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import {
  uploadMedia,
  listMedia,
  deleteMedia,
  mediaFileUrl,
} from '@/lib/api/media';
import { apiFetch, API_BASE_URL, ApiError } from '@/lib/api-client';
import { API_PATHS } from '@/lib/constants/api-paths';

vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return {
    ...actual,
    apiFetch: vi.fn(),
  };
});

describe('Media API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  describe('mediaFileUrl', () => {
    it('should prepend API_BASE_URL to the asset URL', () => {
      const asset = { url: '/media/file/test.png' } as any;
      expect(mediaFileUrl(asset)).toBe(`${API_BASE_URL}/media/file/test.png`);
    });
  });

  describe('listMedia', () => {
    it('should build query string and call apiFetch', async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce({ assets: [], meta: {} });

      await listMedia({ page: 2, pageSize: 10, folderId: 'folder-1' });

      expect(apiFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2&pageSize=10&folderId=folder-1'),
      );
    });

    it('should call apiFetch without query string if no options provided', async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce({ assets: [], meta: {} });

      await listMedia();

      expect(apiFetch).toHaveBeenCalledWith(API_PATHS.MEDIA.BASE(''));
    });
  });

  describe('deleteMedia', () => {
    it('should call apiFetch with DELETE method', async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce(undefined);

      await deleteMedia('asset-1');

      expect(apiFetch).toHaveBeenCalledWith(API_PATHS.MEDIA.BY_ID('asset-1'), {
        method: 'DELETE',
      });
    });
  });

  describe('uploadMedia', () => {
    it('should upload a file and return the created asset', async () => {
      const mockAsset = { id: 'asset-1', filename: 'test.png' };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockAsset }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const file = new File(['content'], 'test.png', { type: 'image/png' });
      const result = await uploadMedia(file, {
        altText: 'Alt',
        folderId: 'folder-1',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}${API_PATHS.MEDIA.BASE()}`,
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        }),
      );

      const fetchBody = mockFetch.mock.calls[0]![1]!.body as FormData;
      expect(fetchBody.get('file')).toBe(file);
      expect(fetchBody.get('altText')).toBe('Alt');
      expect(fetchBody.get('folderId')).toBe('folder-1');
      expect(result).toEqual(mockAsset);
    });

    it('should throw ApiError if fetch throws', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('Network failure')),
      );

      const file = new File(['content'], 'test.png', { type: 'image/png' });

      await expect(uploadMedia(file)).rejects.toThrow(ApiError);
      await expect(uploadMedia(file)).rejects.toThrow(
        'Unable to reach the server. Please try again shortly.',
      );
    });

    it('should throw ApiError with server message on bad response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({ error: { message: 'Invalid file type' } }),
        }),
      );

      const file = new File(['content'], 'test.png', { type: 'image/png' });

      await expect(uploadMedia(file)).rejects.toThrow(ApiError);
      await expect(uploadMedia(file)).rejects.toThrow('Invalid file type');
    });

    it('should throw ApiError with fallback statusText on non-JSON bad response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => {
            throw new Error('Not JSON');
          },
        }),
      );

      const file = new File(['content'], 'test.png', { type: 'image/png' });

      await expect(uploadMedia(file)).rejects.toThrow(ApiError);
      await expect(uploadMedia(file)).rejects.toThrow('Internal Server Error');
    });
  });
});
