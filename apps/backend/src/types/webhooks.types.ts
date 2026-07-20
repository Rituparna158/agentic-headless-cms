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
