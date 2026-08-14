import type { ListContentEntriesResult } from '@repo/types';
import { cmsServerFetch } from '../fetch.js';
import { CMS_TAG } from '../constants.js';
import { contentTag } from '../cache.js';

/**
 * Generates the `generateStaticParams()` array for a Next.js dynamic route
 * backed by a CMS content type.
 */
export async function generateCmsStaticParams(
  schemaSlug: string,
  options?: {
    paramKey?: string;
    locale?: string;
    pageSize?: number;
    idAsSlug?: boolean;
  },
): Promise<Record<string, string>[]> {
  const paramKey = options?.paramKey ?? 'slug';
  const pageSize = options?.pageSize ?? 1000;
  const locale = options?.locale;
  const idAsSlug = options?.idAsSlug ?? false;

  const result = await cmsServerFetch<ListContentEntriesResult>(
    `/api/v1/content/${schemaSlug}`,
    { tags: [CMS_TAG, contentTag(schemaSlug)] },
    { pageSize, locale },
  );

  return result.data.map((entry) => ({
    [paramKey]: idAsSlug ? entry.id : entry.id,
  }));
}
