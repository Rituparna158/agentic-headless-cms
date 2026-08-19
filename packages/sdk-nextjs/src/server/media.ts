import type { MediaAsset, ListMediaResult } from '@repo/types';
import { cmsServerFetch, type NextFetchOptions } from '../fetch.js';
import { CMS_TAG } from '../constants.js';
import { mediaTag, mediaListTag } from '../cache.js';

/**
 * Fetches a single media asset by ID.
 */
export async function getMediaAsset(
  id: string,
  options?: {
    nextTags?: string[];
    revalidate?: number | false;
  },
): Promise<MediaAsset> {
  const { nextTags, revalidate } = options ?? {};

  const nextOptions: NextFetchOptions = {
    tags: nextTags ?? [CMS_TAG, mediaListTag(), mediaTag(id)],
    ...(revalidate !== undefined ? { revalidate } : {}),
  };

  return cmsServerFetch<MediaAsset>(`/api/v1/media/${id}`, nextOptions);
}

/**
 * Fetches a paginated list of media assets.
 */
export async function getMediaList(options?: {
  page?: number;
  pageSize?: number;
  folderId?: string;
  nextTags?: string[];
  revalidate?: number | false;
}): Promise<ListMediaResult> {
  const { nextTags, revalidate, page, pageSize, folderId } = options ?? {};

  const nextOptions: NextFetchOptions = {
    tags: nextTags ?? [CMS_TAG, mediaListTag()],
    ...(revalidate !== undefined ? { revalidate } : {}),
  };

  return cmsServerFetch<ListMediaResult>('/api/v1/media', nextOptions, {
    page,
    pageSize,
    folderId,
  });
}
