import crypto from 'node:crypto';
import { WebhooksRepository } from './webhooks.repository.js';
import { CreateWebhookInput } from '../../types/webhooks.types.js';

export class WebhooksService {
  constructor(
    private readonly repository: WebhooksRepository = new WebhooksRepository(),
  ) {}

  async list() {
    return this.repository.list();
  }

  async create(data: CreateWebhookInput) {
    const secretKey = crypto.randomBytes(24).toString('hex');
    return this.repository.create({
      name: data.name,
      url: data.url,
      events: data.events,
      isActive: data.isActive ?? true,
      secretKey,
    });
  }

  async delete(id: string) {
    return this.repository.delete(id);
  }
}
