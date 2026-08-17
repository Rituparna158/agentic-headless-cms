import type {
  ContentEntryRecord,
  ListContentEntriesOptions,
  ListContentEntriesResult,
} from '@repo/types';
import { cmsServerFetch, type NextFetchOptions } from '../fetch.js';
import { contentListTags, contentEntryTags } from '../cache.js';

/**
 * Fetches a paginated list of content entries for a given schema slug.
 */
export async function getContentList(
  schemaSlug: string,
  options?: ListContentEntriesOptions & {
    nextTags?: string[];
    revalidate?: number | false;
  },
): Promise<ListContentEntriesResult> {
  const { nextTags, revalidate, ...queryOptions } = options ?? {};

  const nextOptions: NextFetchOptions = {
    tags: nextTags ?? contentListTags(schemaSlug),
    ...(revalidate !== undefined ? { revalidate } : {}),
  };

  const params: Record<string, string | number | boolean | undefined> = {};
  if (queryOptions.page !== undefined) params['page'] = queryOptions.page;
  if (queryOptions.pageSize !== undefined)
    params['pageSize'] = queryOptions.pageSize;
  if (queryOptions.locale) params['locale'] = queryOptions.locale;
  if (queryOptions.sort) params['sort'] = queryOptions.sort;

  return cmsServerFetch<ListContentEntriesResult>(
    `/api/v1/content/${schemaSlug}`,
    nextOptions,
    params,
  );
}

/**
 * Fetches a single content entry by ID.
 */
export async function getContentEntry(
  schemaSlug: string,
  entryId: string,
  options?: {
    locale?: string;
    nextTags?: string[];
    revalidate?: number | false;
  },
): Promise<ContentEntryRecord> {
  const { nextTags, revalidate, locale } = options ?? {};

  const nextOptions: NextFetchOptions = {
    tags: nextTags ?? contentEntryTags(schemaSlug, entryId),
    ...(revalidate !== undefined ? { revalidate } : {}),
  };

  return cmsServerFetch<ContentEntryRecord>(
    `/api/v1/content/${schemaSlug}/${entryId}`,
    nextOptions,
    locale ? { locale } : undefined,
  );
}
