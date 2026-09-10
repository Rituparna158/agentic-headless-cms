import type {
  ContentEntryRecord,
  ContentVersionRecord,
  ListContentEntriesOptions,
  ListContentEntriesResult,
} from '@repo/types';
import { API_PATHS } from '@/lib/constants/api-paths';

import { apiFetch } from '@/lib/api-client';

function buildQueryString(options: ListContentEntriesOptions): string {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('pageSize', String(options.pageSize));
  if (options.sort) params.set('sort', options.sort);
  if (options.locale) params.set('locale', options.locale);
  if (options.filters) {
    for (const [apiId, operators] of Object.entries(options.filters)) {
      for (const [operator, value] of Object.entries(operators)) {
        params.set(`filters[${apiId}][${operator}]`, value);
      }
    }
  }
  return params.toString();
}

export function listContentEntries(
  schemaSlug: string,
  options: ListContentEntriesOptions = {},
): Promise<ListContentEntriesResult> {
  const qs = buildQueryString(options);
  return apiFetch<ListContentEntriesResult>(
    API_PATHS.CONTENT.BASE(schemaSlug, qs),
  );
}

function withLocale(path: string, locale?: string): string {
  if (!locale) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}locale=${encodeURIComponent(locale)}`;
}

export function getContentEntry(
  schemaSlug: string,
  entryId: string,
  locale?: string,
): Promise<ContentEntryRecord> {
  return apiFetch<ContentEntryRecord>(
    withLocale(API_PATHS.CONTENT.BY_ID(schemaSlug, entryId), locale),
  );
}

export function createContentEntry(
  schemaSlug: string,
  data: Record<string, unknown>,
  locale?: string,
): Promise<ContentEntryRecord> {
  return apiFetch<ContentEntryRecord>(
    withLocale(API_PATHS.CONTENT.BASE(schemaSlug), locale),
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
}

export function updateContentEntry(
  schemaSlug: string,
  entryId: string,
  data: Record<string, unknown>,
  locale?: string,
): Promise<ContentEntryRecord> {
  return apiFetch<ContentEntryRecord>(
    withLocale(API_PATHS.CONTENT.BY_ID(schemaSlug, entryId), locale),
    {
      method: 'PUT',
      body: JSON.stringify(data),
    },
  );
}

export function publishContentEntry(
  schemaSlug: string,
  entryId: string,
  locale?: string,
): Promise<ContentEntryRecord> {
  return apiFetch<ContentEntryRecord>(
    withLocale(API_PATHS.CONTENT.PUBLISH(schemaSlug, entryId), locale),
    { method: 'POST' },
  );
}

export function unpublishContentEntry(
  schemaSlug: string,
  entryId: string,
  locale?: string,
): Promise<ContentEntryRecord> {
  return apiFetch<ContentEntryRecord>(
    withLocale(API_PATHS.CONTENT.UNPUBLISH(schemaSlug, entryId), locale),
    { method: 'POST' },
  );
}

export function deleteContentEntry(
  schemaSlug: string,
  entryId: string,
): Promise<void> {
  return apiFetch<void>(API_PATHS.CONTENT.BY_ID(schemaSlug, entryId), {
    method: 'DELETE',
  });
}

export function revertContentEntry(
  schemaSlug: string,
  entryId: string,
  versionNo: number,
): Promise<ContentEntryRecord> {
  return apiFetch<ContentEntryRecord>(
    API_PATHS.CONTENT.REVERT(schemaSlug, entryId),
    {
      method: 'POST',
      body: JSON.stringify({ versionNo }),
    },
  );
}

export function listContentVersions(
  schemaSlug: string,
  entryId: string,
): Promise<ContentVersionRecord[]> {
  return apiFetch<ContentVersionRecord[]>(
    API_PATHS.CONTENT.VERSIONS(schemaSlug, entryId),
  );
}
