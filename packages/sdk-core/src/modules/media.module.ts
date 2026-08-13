import { HttpTransport } from '../transport/http.js';
import { ApiResponse } from '../types/index.js';
import type {
  MediaAsset,
  ListMediaOptions,
  ListMediaResult,
} from '@repo/types';

import type { UploadMediaOptions } from '../types/index.js';

export class MediaModule {
  constructor(private transport: HttpTransport) {}

  public async list(options?: ListMediaOptions): Promise<ListMediaResult> {
    const res = await this.transport.request<ApiResponse<ListMediaResult>>(
      '/media',
      {
        params:
          (options as Record<string, string | number | boolean | undefined>) ||
          {},
      },
    );
    return res.data;
  }

  public async get(assetId: string): Promise<MediaAsset> {
    const res = await this.transport.request<ApiResponse<MediaAsset>>(
      `/media/${assetId}`,
    );
    return res.data;
  }

  public async delete(assetId: string): Promise<void> {
    await this.transport.request<void>(`/media/${assetId}`, {
      method: 'DELETE',
    });
  }

  public async upload(
    file: Blob | File,
    options?: UploadMediaOptions,
  ): Promise<MediaAsset> {
    const formData = new FormData();
    const filename =
      options?.filename || (file instanceof File ? file.name : 'blob');
    formData.append('file', file, filename);
    if (options?.altText) {
      formData.append('altText', options.altText);
    }
    if (options?.folderId) {
      formData.append('folderId', options.folderId);
    }

    const res = await this.transport.request<ApiResponse<MediaAsset>>(
      '/media',
      {
        method: 'POST',
        // The HttpTransport will avoid setting Content-Type to application/json

        body: formData as unknown as BodyInit,
      },
    );
    return res.data;
  }
}
