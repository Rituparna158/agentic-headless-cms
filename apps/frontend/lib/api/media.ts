import { API_BASE_URL, ApiError, apiFetch } from '@/lib/api-client';
import { API_PATHS } from '@/lib/constants/api-paths';

import type {
  ListMediaOptions,
  ListMediaResult,
  MediaAsset,
  MediaFolder,
} from '@repo/types';

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
  return apiFetch<ListMediaResult>(API_PATHS.MEDIA.BASE(qs));
}

export function getMediaAsset(id: string): Promise<MediaAsset> {
  return apiFetch<MediaAsset>(API_PATHS.MEDIA.BY_ID(id));
}

export function deleteMedia(id: string): Promise<void> {
  return apiFetch<void>(API_PATHS.MEDIA.BY_ID(id), { method: 'DELETE' });
}

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
    response = await fetch(`${API_BASE_URL}${API_PATHS.MEDIA.BASE()}`, {
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

export function listMediaFolders(
  parentFolderId?: string,
): Promise<MediaFolder[]> {
  const qs = parentFolderId ? `?parentFolderId=${parentFolderId}` : '';
  return apiFetch<MediaFolder[]>(`/api/v1/media-folders${qs}`);
}

export function createMediaFolder(
  name: string,
  parentFolderId?: string,
): Promise<MediaFolder> {
  return apiFetch<MediaFolder>(`/api/v1/media-folders`, {
    method: 'POST',
    body: JSON.stringify({ name, parentFolderId }),
  });
}

export function deleteMediaFolder(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/media-folders/${id}`, { method: 'DELETE' });
}
