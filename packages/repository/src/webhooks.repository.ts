import { eq, sql, and } from 'drizzle-orm';
import type { BaseQueryOptions } from '@repo/types';
import { getDatabaseAdapter } from '@repo/config';
import { logger } from '@repo/logger';
import {
  webhooks,
  RecordNotFoundError,
  buildPaginationOptions,
  withTransaction,
} from '@repo/shared-db';
import { ApiError } from '@repo/utils';
import { REPO_ERRORS } from './error-constants.js';
export class WebhooksRepository {
  private get db() {
    return getDatabaseAdapter().getDb();
  }
  async list(options: BaseQueryOptions = {}, applicationId?: string) {
    try {
      logger.info('WebhooksRepository: listing webhooks');
      const { limit, offset, orderBy, where } = buildPaginationOptions(
        options,
        {
          id: webhooks.id,
          name: webhooks.name,
          url: webhooks.url,
          createdAt: webhooks.createdAt,
        },
        [webhooks.name, webhooks.url],
      );
      const finalWhere = applicationId
        ? where
          ? and(where, eq(webhooks.applicationId, applicationId))
          : eq(webhooks.applicationId, applicationId)
        : where;
      const result = await withTransaction(this.db, async (tx) => {
        return await tx
          .select()
          .from(webhooks)
          .where(finalWhere)
          .limit(limit)
          .offset(offset)
          .orderBy(...orderBy);
      });
      const countResult = await withTransaction(this.db, async (tx) => {
        return await tx
          .select({
            count: sql<number>`cast(count(${webhooks.id}) as integer)`,
          })
          .from(webhooks)
          .where(finalWhere);
      });
      const total = countResult[0]?.count ?? 0;
      logger.debug(
        { count: result.length, total },
        'WebhooksRepository: list complete',
      );
      return [result, total] as const;
    } catch (error) {
      logger.error({ err: error }, 'WebhooksRepository Error in list:');
      throw new ApiError(500, REPO_ERRORS.LIST_WEBHOOKS_FAILED);
    }
  }
  async getById(id: string, applicationId?: string) {
    try {
      logger.info({ id }, 'WebhooksRepository: fetching webhook by ID');
      const conditions = [eq(webhooks.id, id)];
      if (applicationId)
        conditions.push(eq(webhooks.applicationId, applicationId));
      const [webhook] = await withTransaction(this.db, async (tx) => {
        return await tx
          .select()
          .from(webhooks)
          .where(and(...conditions))
          .limit(1);
      });
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
    applicationId?: string;
  }) {
    try {
      logger.info(
        { name: data.name, url: data.url },
        'WebhooksRepository: creating webhook',
      );
      const [webhook] = await withTransaction(this.db, async (tx) => {
        return await tx.insert(webhooks).values(data).returning();
      });
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
      const [deleted] = await withTransaction(this.db, async (tx) => {
        return await tx
          .delete(webhooks)
          .where(eq(webhooks.id, id))
          .returning({ id: webhooks.id });
      });
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
