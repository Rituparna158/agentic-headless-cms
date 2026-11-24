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

export interface WebhookTestResponse {
  success: boolean;
  statusCode: number | null;
  statusText?: string;
  responseTimeMs: number;
  error?: string;
}

export type WebhookDeliveryStatus =
  | 'delivered'
  | 'pending_retry'
  | 'failed'
  | 'dlq';

export interface WebhookDeliveryRecord {
  id: string;
  webhookId: string;
  eventType: string;
  payload: unknown;
  responseStatus: number | null;
  attempt: number;
  maxAttempts?: number;
  status?: WebhookDeliveryStatus;
  nextRetryAt?: string | null;
  lastError?: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export function testWebhook(id: string): Promise<WebhookTestResponse> {
  return apiFetch<WebhookTestResponse>(API_PATHS.WEBHOOKS.TEST(id), {
    method: 'POST',
  });
}

export function listWebhookDeliveries(
  id: string,
): Promise<WebhookDeliveryRecord[]> {
  return apiFetch<WebhookDeliveryRecord[]>(API_PATHS.WEBHOOKS.DELIVERIES(id));
}

export function retryWebhookDelivery(
  webhookId: string,
  deliveryId: string,
): Promise<{
  success: boolean;
  status: WebhookDeliveryStatus;
  statusCode: number | null;
  attempt: number;
  error?: string;
}> {
  return apiFetch(API_PATHS.WEBHOOKS.RETRY_DELIVERY(webhookId, deliveryId), {
    method: 'POST',
  });
}

export function replayWebhookDelivery(
  webhookId: string,
  deliveryId: string,
): Promise<{
  success: boolean;
  status: WebhookDeliveryStatus;
  statusCode: number | null;
  error?: string;
}> {
  return apiFetch(API_PATHS.WEBHOOKS.REPLAY_DELIVERY(webhookId, deliveryId), {
    method: 'POST',
  });
}
