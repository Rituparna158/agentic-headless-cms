export interface CreateWebhookInput {
  name: string;
  url: string;
  events: string[];
  isActive?: boolean;
}

export interface UpdateWebhookInput {
  name?: string;
  url?: string;
  events?: string[];
  isActive?: boolean;
}

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

export type WebhookDeliveryStatus =
  | 'delivered'
  | 'pending_retry'
  | 'failed'
  | 'dlq';

export interface WebhookDeliveryRecord {
  id: string;
  webhookId: string;
  applicationId?: string;
  eventType: string;
  payload: unknown;
  responseStatus: number | null;
  attempt: number;
  maxAttempts: number;
  status: WebhookDeliveryStatus;
  nextRetryAt?: string | null;
  lastError?: string | null;
  deliveredAt: string | null;
  createdAt: string;
}
