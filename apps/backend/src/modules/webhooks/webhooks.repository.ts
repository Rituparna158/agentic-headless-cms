import { eq } from 'drizzle-orm';
import { getDatabaseAdapter } from '../../config/database.js';
import { webhooks, RecordNotFoundError } from '@repo/shared-db';

export class WebhooksRepository {
  private get db() {
    return getDatabaseAdapter().getDb();
  }

  async list() {
    return this.db.select().from(webhooks);
  }

  async create(data: {
    name: string;
    url: string;
    events: string[];
    isActive?: boolean;
    secretKey: string;
  }) {
    const [webhook] = await this.db.insert(webhooks).values(data).returning();
    return webhook;
  }

  async delete(id: string) {
    const [deleted] = await this.db
      .delete(webhooks)
      .where(eq(webhooks.id, id))
      .returning({ id: webhooks.id });
    if (!deleted) throw new RecordNotFoundError('Webhook not found');
    return deleted;
  }
}
