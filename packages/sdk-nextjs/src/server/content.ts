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
    draft?: boolean;
  },
): Promise<ListContentEntriesResult> {
  const {
    nextTags,
    revalidate,
    draft = false,
    ...queryOptions
  } = options ?? {};

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

  const result = await cmsServerFetch<ListContentEntriesResult>(
    `/api/v1/content/${schemaSlug}`,
    nextOptions,
    params,
  );

  if (!draft) {
    // Filter out unpublished items and map data to publishedData
    const publishedEntries = result.data
      .filter((entry) => entry.publishedData !== null)
      .map((entry) => ({
        ...entry,
        status: 'published' as const,
        data: entry.publishedData!,
      }));

    return {
      ...result,
      data: publishedEntries,
    };
  }

  return result;
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
    draft?: boolean;
  },
): Promise<ContentEntryRecord> {
  const { nextTags, revalidate, locale, draft = false } = options ?? {};

  const nextOptions: NextFetchOptions = {
    tags: nextTags ?? contentEntryTags(schemaSlug, entryId),
    ...(revalidate !== undefined ? { revalidate } : {}),
  };

  const entry = await cmsServerFetch<ContentEntryRecord>(
    `/api/v1/content/${schemaSlug}/${entryId}`,
    nextOptions,
    locale ? { locale } : undefined,
  );

  if (!draft) {
    if (!entry.publishedData) {
      throw new Error(
        `[sdk-nextjs] 404: Entry not found or not published (${entryId})`,
      );
    }
    return {
      ...entry,
      status: 'published',
      data: entry.publishedData,
    };
  }

  return entry;
}
