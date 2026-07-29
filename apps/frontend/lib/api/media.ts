import { API_BASE_URL, ApiError, apiFetch } from '@/lib/api-client';

import type {
  ListMediaOptions,
  ListMediaResult,
  MediaAsset,
} from '@repo/shared-types';

/** The asset `url` the backend returns (e.g. "/media/file/<key>") is relative to the API host, not the frontend's. */
export function mediaFileUrl(asset: MediaAsset): string {
  return `${API_BASE_URL}${asset.url}`;
}

function buildQueryString(options: ListMediaOptions): string {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('pageSize', String(options.pageSize));
  if (options.folderId) params.set('folderId', options.folderId);
  return params.toString();
}

export function listMedia(
  options: ListMediaOptions = {},
): Promise<ListMediaResult> {
  const qs = buildQueryString(options);
  return apiFetch<ListMediaResult>(`/api/v1/media${qs ? `?${qs}` : ''}`);
}

export function deleteMedia(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/media/${id}`, { method: 'DELETE' });
}

/**
 * Uploads bypass `apiFetch` entirely — it unconditionally sets
 * `Content-Type: application/json`, which is wrong for `FormData` (the
 * browser needs to set its own `multipart/form-data; boundary=...` header
 * based on the actual body it's sending).
 */
export async function uploadMedia(
  file: File,
  options?: { altText?: string; folderId?: string },
): Promise<MediaAsset> {
  const formData = new FormData();
  formData.set('file', file);
  if (options?.altText) formData.set('altText', options.altText);
  if (options?.folderId) formData.set('folderId', options.folderId);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/media`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
  } catch (cause) {
    throw new ApiError(
      'Unable to reach the server. Please try again shortly.',
      0,
      cause,
    );
  }

  if (!response.ok) {
    let body: { error?: { message?: string; details?: unknown } } = {};
    try {
      body = await response.json();
    } catch {
      // not JSON — fall back below
    }
    throw new ApiError(
      body.error?.message ?? response.statusText ?? 'Upload failed',
      response.status,
      body.error?.details,
    );
  }

  const { data } = (await response.json()) as { data: MediaAsset };
  return data;
}
