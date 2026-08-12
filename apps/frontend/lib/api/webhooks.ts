import { apiFetch, buildQueryString } from '@/lib/api-client';
import { API_PATHS } from '@/lib/constants/api-paths';
import type {
  WebhookRecord,
  BaseQueryOptions,
  PaginatedResult,
} from '@repo/types';

export function listWebhooks(
  options?: BaseQueryOptions,
): Promise<PaginatedResult<WebhookRecord>> {
  return apiFetch<PaginatedResult<WebhookRecord>>(
    `${API_PATHS.WEBHOOKS.BASE}${buildQueryString(options)}`,
  );
}

export function createWebhook(data: {
  name: string;
  url: string;
  events: string[];
}): Promise<WebhookRecord> {
  return apiFetch<WebhookRecord>(API_PATHS.WEBHOOKS.BASE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteWebhook(id: string): Promise<void> {
  return apiFetch<void>(API_PATHS.WEBHOOKS.BY_ID(id), { method: 'DELETE' });
}
