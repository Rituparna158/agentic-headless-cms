import { apiFetch, buildQueryString } from '@/lib/api-client';
import { API_PATHS } from '@/lib/constants/api-paths';
import type {
  LocaleRecord,
  BaseQueryOptions,
  PaginatedResult,
} from '@repo/types';

export function listLocales(
  options?: BaseQueryOptions,
): Promise<PaginatedResult<LocaleRecord>> {
  return apiFetch<PaginatedResult<LocaleRecord>>(
    `${API_PATHS.LOCALES.BASE}${buildQueryString(options)}`,
  );
}

export function createLocale(data: {
  code: string;
  name: string;
}): Promise<LocaleRecord> {
  return apiFetch<LocaleRecord>(API_PATHS.LOCALES.BASE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteLocale(id: string): Promise<void> {
  return apiFetch<void>(API_PATHS.LOCALES.BY_ID(id), { method: 'DELETE' });
}
