import type {
  ContentEntryRecord,
  ContentVersionRecord,
  ListContentEntriesOptions,
  ListContentEntriesResult,
} from '@repo/shared-types';

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
    `/api/v1/content/${schemaSlug}${qs ? `?${qs}` : ''}`,
  );
}

export async function getContentEntry(
  schemaSlug: string,
  entryId: string,
): Promise<ContentEntryRecord> {
  const { data } = await apiFetch<{ data: ContentEntryRecord }>(
    `/api/v1/content/${schemaSlug}/${entryId}`,
  );
  return data;
}

export async function createContentEntry(
  schemaSlug: string,
  data: Record<string, unknown>,
): Promise<ContentEntryRecord> {
  const response = await apiFetch<{ data: ContentEntryRecord }>(
    `/api/v1/content/${schemaSlug}`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
  return response.data;
}

export async function updateContentEntry(
  schemaSlug: string,
  entryId: string,
  data: Record<string, unknown>,
): Promise<ContentEntryRecord> {
  const response = await apiFetch<{ data: ContentEntryRecord }>(
    `/api/v1/content/${schemaSlug}/${entryId}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    },
  );
  return response.data;
}

export async function publishContentEntry(
  schemaSlug: string,
  entryId: string,
): Promise<ContentEntryRecord> {
  const response = await apiFetch<{ data: ContentEntryRecord }>(
    `/api/v1/content/${schemaSlug}/${entryId}/publish`,
    { method: 'POST' },
  );
  return response.data;
}

export function deleteContentEntry(
  schemaSlug: string,
  entryId: string,
): Promise<void> {
  return apiFetch<void>(`/api/v1/content/${schemaSlug}/${entryId}`, {
    method: 'DELETE',
  });
}

export async function revertContentEntry(
  schemaSlug: string,
  entryId: string,
  versionNo: number,
): Promise<ContentEntryRecord> {
  const response = await apiFetch<{ data: ContentEntryRecord }>(
    `/api/v1/content/${schemaSlug}/${entryId}/revert`,
    {
      method: 'POST',
      body: JSON.stringify({ versionNo }),
    },
  );
  return response.data;
}

export async function listContentVersions(
  schemaSlug: string,
  entryId: string,
): Promise<ContentVersionRecord[]> {
  const { data } = await apiFetch<{ data: ContentVersionRecord[] }>(
    `/api/v1/content/${schemaSlug}/${entryId}/versions`,
  );
  return data;
}
