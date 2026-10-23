import { requestHandler } from '@/api/requestHandler';
import { apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type { RequestOptions } from '@/types/api';
import type {
  MediaAsset,
  ListMediaResult,
  MediaFolder,
  CreateMediaFolderInput,
  ListMediaOptions,
} from './../types/media.types';

export const mediaApi = {
  listMedia: async (
    options?: ListMediaOptions,
    requestOptions?: RequestOptions,
  ): Promise<ListMediaResult> => {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.pageSize)
      params.append('pageSize', options.pageSize.toString());
    if (options?.folderId) params.append('folderId', options.folderId);

    const url = params.toString()
      ? `${ENDPOINTS.MEDIA.BASE}?${params.toString()}`
      : ENDPOINTS.MEDIA.BASE;

    const res = await requestHandler.get<ListMediaResult>(url, {
      signal: requestOptions?.signal,
    });
    return res.data;
  },

  getMedia: async (
    id: string,
    requestOptions?: RequestOptions,
  ): Promise<MediaAsset> => {
    const res = await requestHandler.get<MediaAsset>(
      ENDPOINTS.MEDIA.BY_ID(id),
      {
        signal: requestOptions?.signal,
      },
    );
    return res.data;
  },

  uploadMedia: async (
    file: File,
    options?: {
      altText?: string;
      folderId?: string;
      onProgress?: (percent: number) => void;
    },
    requestOptions?: RequestOptions,
  ): Promise<MediaAsset> => {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.altText) {
      formData.append('altText', options.altText);
    }
    if (options?.folderId && options.folderId !== 'root') {
      formData.append('folderId', options.folderId);
    }

    const res = await apiClient.post<{ data: MediaAsset; message?: string }>(
      ENDPOINTS.MEDIA.BASE,
      formData,
      {
        signal: requestOptions?.signal,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && options?.onProgress) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            options.onProgress(percent);
          }
        },
      },
    );

    return res.data.data;
  },

  deleteMedia: async (
    id: string,
    requestOptions?: RequestOptions,
  ): Promise<void> => {
    await requestHandler.delete(ENDPOINTS.MEDIA.BY_ID(id), {
      signal: requestOptions?.signal,
    });
  },

  deleteBulkMedia: async (
    ids: string[],
    requestOptions?: RequestOptions,
  ): Promise<void> => {
    await requestHandler.post(
      ENDPOINTS.MEDIA.BULK_DELETE,
      { ids },
      {
        signal: requestOptions?.signal,
      },
    );
  },

  listFolders: async (
    parentFolderId?: string,
    requestOptions?: RequestOptions,
  ): Promise<MediaFolder[]> => {
    const params = new URLSearchParams();
    if (parentFolderId) params.append('parentFolderId', parentFolderId);

    const url = params.toString()
      ? `${ENDPOINTS.MEDIA_FOLDERS.BASE}?${params.toString()}`
      : ENDPOINTS.MEDIA_FOLDERS.BASE;

    const res = await requestHandler.get<MediaFolder[]>(url, {
      signal: requestOptions?.signal,
    });
    return Array.isArray(res.data) ? res.data : [];
  },

  createFolder: async (
    input: CreateMediaFolderInput,
    requestOptions?: RequestOptions,
  ): Promise<MediaFolder> => {
    const res = await requestHandler.post<MediaFolder>(
      ENDPOINTS.MEDIA_FOLDERS.BASE,
      input,
      {
        signal: requestOptions?.signal,
      },
    );
    return res.data;
  },

  deleteFolder: async (
    id: string,
    requestOptions?: RequestOptions,
  ): Promise<void> => {
    await requestHandler.delete(ENDPOINTS.MEDIA_FOLDERS.BY_ID(id), {
      signal: requestOptions?.signal,
    });
  },
};
