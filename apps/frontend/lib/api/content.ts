import { apiFetch } from '@/lib/api-client';

export interface ContentEntryRecord {
  id: string;
  status: 'draft' | 'published';
  data: Record<string, unknown>;
  publishedData: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

export interface ListContentEntriesOptions {
  page?: number;
  pageSize?: number;
  /** e.g. "createdAt:desc" or "title:asc" */
  sort?: string;
  locale?: string;
  /** apiId -> operator (e.g. "$contains", "$gte") -> value */
  filters?: Record<string, Record<string, string>>;
}

export interface ListContentEntriesResult {
  data: ContentEntryRecord[];
  meta: { pagination: PaginationMeta };
}

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

/**
 * The backend's create/update/publish/revert responses aren't shaped
 * consistently with each other or with list/get (see content.controller.ts):
 * createDraft's `data` is `{ entryId, localization: {...} }`, while
 * updateDraft/publishEntry/revertEntry's `data` IS the localization row
 * itself (which has its own unrelated `id` — the localization row's PK, not
 * the content entry's id — plus an `entryId` column). This normalizes all
 * four into the same shape list/get already return, so callers never have
 * to special-case which mutation they just called.
 */
function normalizeMutationResponse(raw: {
  entryId?: string;
  id?: string;
  localization?: {
    entryId?: string;
    status: string;
    data: Record<string, unknown>;
    publishedData?: Record<string, unknown> | null;
  };
  status?: string;
  data?: Record<string, unknown>;
  publishedData?: Record<string, unknown> | null;
}): ContentEntryRecord {
  const source = raw.localization ?? raw;
  const id = raw.entryId ?? source.entryId ?? raw.id;
  if (!id || !source.status || !source.data) {
    throw new Error('Unexpected content entry response shape.');
  }

  return {
    id,
    status: source.status as ContentEntryRecord['status'],
    data: source.data,
    publishedData: source.publishedData ?? null,
  };
}

export async function createContentEntry(
  schemaSlug: string,
  data: Record<string, unknown>,
): Promise<ContentEntryRecord> {
  const { data: raw } = await apiFetch<{
    data: Parameters<typeof normalizeMutationResponse>[0];
  }>(`/api/v1/content/${schemaSlug}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return normalizeMutationResponse(raw);
}

export async function updateContentEntry(
  schemaSlug: string,
  entryId: string,
  data: Record<string, unknown>,
): Promise<ContentEntryRecord> {
  const { data: raw } = await apiFetch<{
    data: Parameters<typeof normalizeMutationResponse>[0];
  }>(`/api/v1/content/${schemaSlug}/${entryId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return normalizeMutationResponse(raw);
}

export async function publishContentEntry(
  schemaSlug: string,
  entryId: string,
): Promise<ContentEntryRecord> {
  const { data: raw } = await apiFetch<{
    data: Parameters<typeof normalizeMutationResponse>[0];
  }>(`/api/v1/content/${schemaSlug}/${entryId}/publish`, { method: 'POST' });
  return normalizeMutationResponse(raw);
}

export function deleteContentEntry(
  schemaSlug: string,
  entryId: string,
): Promise<void> {
  return apiFetch<void>(`/api/v1/content/${schemaSlug}/${entryId}`, {
    method: 'DELETE',
  });
}
