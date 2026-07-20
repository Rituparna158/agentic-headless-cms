import { apiFetch } from '@/lib/api-client';

export interface LocaleRecord {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
}

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
