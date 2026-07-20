import { apiFetch } from '@/lib/api-client';

export interface WebhookRecord {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secretKey: string;
  createdAt: string;
  updatedAt: string;
}

export function listWebhooks(): Promise<WebhookRecord[]> {
  return apiFetch<WebhookRecord[]>('/api/v1/webhooks');
}

export function createWebhook(data: {
  name: string;
  url: string;
  events: string[];
}): Promise<WebhookRecord> {
  return apiFetch<WebhookRecord>('/api/v1/webhooks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteWebhook(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/webhooks/${id}`, { method: 'DELETE' });
}
