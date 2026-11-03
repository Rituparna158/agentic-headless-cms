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
