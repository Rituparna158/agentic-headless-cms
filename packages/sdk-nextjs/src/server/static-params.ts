import type { ListContentEntriesResult } from '@repo/types';
import { cmsServerFetch } from '../fetch.js';
import { CMS_TAG } from '../constants.js';
import { contentTag } from '../cache.js';

/**
 * Generates the `generateStaticParams()` array for a Next.js dynamic route
 * backed by a CMS content type.
 */
export async function generateCmsStaticParams<TKey extends string = 'slug'>(
  schemaSlug: string,
  options?: {
    paramKey?: TKey;
    locale?: string;
    pageSize?: number;
    idAsSlug?: boolean;
  },
): Promise<Array<Record<TKey, string>>> {
  const paramKey = (options?.paramKey ?? 'slug') as TKey;
  const pageSize = options?.pageSize ?? 1000;
  const locale = options?.locale;
  const idAsSlug = options?.idAsSlug ?? false;

  const result = await cmsServerFetch<ListContentEntriesResult>(
    `/api/v1/content/${schemaSlug}`,
    { tags: [CMS_TAG, contentTag(schemaSlug)] },
    { pageSize, locale },
  );

  return result.data.map((entry) => {
    const entrySlug = entry.data?.['slug'];
    const paramValue =
      !idAsSlug && typeof entrySlug === 'string' && entrySlug.length > 0
        ? entrySlug
        : entry.id;

    return {
      [paramKey]: paramValue,
    } as Record<TKey, string>;
  });
}
