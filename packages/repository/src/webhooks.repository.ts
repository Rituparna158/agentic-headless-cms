import { eq } from 'drizzle-orm';
import { getDatabaseAdapter } from '@repo/config';
import { logger } from '@repo/logger';
import { webhooks, RecordNotFoundError } from '@repo/shared-db';
import { ApiError } from '@repo/utils';
import { REPO_ERRORS } from './error-constants.js';

export class WebhooksRepository {
  private get db() {
    return getDatabaseAdapter().getDb();
  }

  async list() {
    try {
      logger.info('WebhooksRepository: listing webhooks');
      const result = await this.db.select().from(webhooks);
      logger.debug(
        { count: result.length },
        'WebhooksRepository: list complete',
      );
      return result;
    } catch (error) {
      logger.error({ err: error }, 'WebhooksRepository Error in list:');
      throw new ApiError(500, REPO_ERRORS.LIST_WEBHOOKS_FAILED);
    }
  }

  async getById(id: string) {
    try {
      logger.info({ id }, 'WebhooksRepository: fetching webhook by ID');
      const [webhook] = await this.db
        .select()
        .from(webhooks)
        .where(eq(webhooks.id, id))
        .limit(1);
      logger.debug(
        { found: !!webhook },
        'WebhooksRepository: getById complete',
      );
      return webhook;
    } catch (error) {
      logger.error({ err: error }, 'WebhooksRepository Error in getById:');
      throw new ApiError(500, REPO_ERRORS.FETCH_WEBHOOK_FAILED);
    }
  }

  async create(data: {
    name: string;
    url: string;
    events: string[];
    isActive?: boolean;
    secretKey: string;
  }) {
    try {
      logger.info(
        { name: data.name, url: data.url },
        'WebhooksRepository: creating webhook',
      );
      const [webhook] = await this.db.insert(webhooks).values(data).returning();
      logger.debug(
        { webhookId: webhook?.id },
        'WebhooksRepository: create complete',
      );
      return webhook;
    } catch (error) {
      logger.error({ err: error }, 'WebhooksRepository Error in create:');
      throw new ApiError(500, REPO_ERRORS.CREATE_WEBHOOK_FAILED);
    }
  }

  async delete(id: string) {
    try {
      logger.info({ id }, 'WebhooksRepository: deleting webhook');
      const [deleted] = await this.db
        .delete(webhooks)
        .where(eq(webhooks.id, id))
        .returning({ id: webhooks.id });
      if (!deleted) {
        logger.error(
          { id },
          'WebhooksRepository: webhook not found for deletion',
        );
        throw new RecordNotFoundError('Webhook not found');
      }
      logger.info({ id }, 'WebhooksRepository: delete complete');
      return deleted;
    } catch (error) {
      logger.error({ err: error }, 'WebhooksRepository Error in delete:');
      if (error instanceof RecordNotFoundError) throw error;
      throw new ApiError(500, REPO_ERRORS.DELETE_WEBHOOK_FAILED);
    }
  }
}
