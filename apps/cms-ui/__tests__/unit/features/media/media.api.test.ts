import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mediaApi } from '../../../../src/features/media/api/media.api';
import { requestHandler } from '../../../../src/api/requestHandler';
import { apiClient } from '../../../../src/api/client';

vi.mock('../../../../src/api/requestHandler', () => ({
  requestHandler: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../../src/api/client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('mediaApi client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listMedia sends proper query parameters', async () => {
    const mockResult = {
      data: [
        {
          id: 'asset-1',
          filename: 'banner.png',
          mimeType: 'image/png',
          sizeBytes: 1024,
          width: 800,
          height: 600,
          url: '/api/v1/media/file/banner.png',
          altText: null,
          folderId: 'folder-1',
          createdAt: '2026-10-22T00:00:00Z',
          updatedAt: '2026-10-22T00:00:00Z',
        },
      ],
      meta: {
        pagination: { page: 1, pageSize: 20, total: 1, pageCount: 1 },
      },
    };

    vi.mocked(requestHandler.get).mockResolvedValueOnce({
      data: mockResult,
      success: true,
    });

    const result = await mediaApi.listMedia({
      page: 1,
      pageSize: 20,
      folderId: 'folder-1',
    });

    expect(requestHandler.get).toHaveBeenCalledWith(
      expect.stringContaining('page=1'),
      expect.anything(),
    );
    expect(requestHandler.get).toHaveBeenCalledWith(
      expect.stringContaining('folderId=folder-1'),
      expect.anything(),
    );
    expect(result).toEqual(mockResult);
  });

  it('uploadMedia calls apiClient.post with multipart form data', async () => {
    const mockAsset = {
      id: 'asset-new',
      filename: 'test.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 500,
      width: 400,
      height: 300,
      url: '/api/v1/media/file/test.jpg',
      altText: 'A test asset',
      folderId: null,
      createdAt: '2026-10-22T00:00:00Z',
      updatedAt: '2026-10-22T00:00:00Z',
    };

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { data: mockAsset },
    });

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const asset = await mediaApi.uploadMedia(file, {
      altText: 'A test asset',
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/media',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
    expect(asset).toEqual(mockAsset);
  });

  it('deleteMedia calls requestHandler.delete with media ID', async () => {
    vi.mocked(requestHandler.delete).mockResolvedValueOnce({
      data: undefined,
      success: true,
    });

    await mediaApi.deleteMedia('asset-123');

    expect(requestHandler.delete).toHaveBeenCalledWith(
      '/media/asset-123',
      expect.anything(),
    );
  });

  it('deleteBulkMedia calls requestHandler.post with bulk-delete endpoint', async () => {
    vi.mocked(requestHandler.post).mockResolvedValueOnce({
      data: undefined,
      success: true,
    });

    await mediaApi.deleteBulkMedia(['asset-1', 'asset-2']);

    expect(requestHandler.post).toHaveBeenCalledWith(
      '/media/bulk-delete',
      { ids: ['asset-1', 'asset-2'] },
      expect.anything(),
    );
  });

  it('listFolders calls requestHandler.get with parentFolderId if provided', async () => {
    const mockFolders = [
      {
        id: 'f-1',
        name: 'Blog Images',
        parentFolderId: null,
        createdAt: '2026-10-22T00:00:00Z',
        updatedAt: '2026-10-22T00:00:00Z',
      },
    ];

    vi.mocked(requestHandler.get).mockResolvedValueOnce({
      data: mockFolders,
      success: true,
    });

    const folders = await mediaApi.listFolders();
    expect(requestHandler.get).toHaveBeenCalledWith(
      '/media-folders',
      expect.anything(),
    );
    expect(folders).toEqual(mockFolders);
  });

  it('createFolder sends folder payload to endpoint', async () => {
    const mockCreated = {
      id: 'f-2',
      name: 'Hero Banners',
      parentFolderId: null,
      createdAt: '2026-10-22T00:00:00Z',
      updatedAt: '2026-10-22T00:00:00Z',
    };

    vi.mocked(requestHandler.post).mockResolvedValueOnce({
      data: mockCreated,
      success: true,
    });

    const folder = await mediaApi.createFolder({ name: 'Hero Banners' });
    expect(requestHandler.post).toHaveBeenCalledWith(
      '/media-folders',
      { name: 'Hero Banners' },
      expect.anything(),
    );
    expect(folder).toEqual(mockCreated);
  });
});
