import { apiFetch } from '@/lib/api-client';
import { LocaleRecord } from '@repo/shared-types';

export function listLocales(): Promise<LocaleRecord[]> {
  return apiFetch<LocaleRecord[]>('/api/v1/locales');
}

export function createLocale(data: {
  code: string;
  name: string;
}): Promise<LocaleRecord> {
  return apiFetch<LocaleRecord>('/api/v1/locales', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteLocale(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/locales/${id}`, { method: 'DELETE' });
}
