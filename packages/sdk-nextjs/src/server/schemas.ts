import type { SchemaRecord, PaginatedResult } from '@repo/types';
import { cmsServerFetch, type NextFetchOptions } from '../fetch.js';
import { schemasListTags, schemaTags } from '../cache.js';

/**
 * Fetches all content schemas (content types).
 */
export async function getSchemas(options?: {
  page?: number;
  pageSize?: number;
  nextTags?: string[];
  revalidate?: number | false;
}): Promise<PaginatedResult<SchemaRecord>> {
  const { nextTags, revalidate, page, pageSize } = options ?? {};

  const nextOptions: NextFetchOptions = {
    tags: nextTags ?? schemasListTags(),
    ...(revalidate !== undefined ? { revalidate } : {}),
  };

  return cmsServerFetch<PaginatedResult<SchemaRecord>>(
    '/api/v1/schemas',
    nextOptions,
    { page, pageSize },
  );
}

/**
 * Fetches a single schema by its slug.
 */
export async function getSchema(
  slug: string,
  options?: {
    nextTags?: string[];
    revalidate?: number | false;
  },
): Promise<SchemaRecord> {
  const { nextTags, revalidate } = options ?? {};

  const nextOptions: NextFetchOptions = {
    tags: nextTags ?? schemaTags(slug),
    ...(revalidate !== undefined ? { revalidate } : {}),
  };

  return cmsServerFetch<SchemaRecord>(
    `/api/v1/schemas/slug/${slug}`,
    nextOptions,
  );
}
