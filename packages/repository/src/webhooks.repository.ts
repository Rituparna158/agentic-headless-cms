import { eq, sql, and, desc, lte } from 'drizzle-orm';
import type { BaseQueryOptions, WebhookDeliveryStatus } from '@repo/types';
import { getDatabaseAdapter } from '@repo/config';
import { logger } from '@repo/logger';
import {
  webhooks,
  webhookDeliveries,
  applications,
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
      if (applicationId) {
        conditions.push(
          sql`(${webhooks.applicationId} = ${applicationId} OR ${webhooks.applicationId} IS NULL)`,
        );
      }
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

  async findActiveByEvent(eventType: string, applicationId?: string) {
    try {
      logger.info({ eventType }, 'WebhooksRepository: findActiveByEvent start');
      const conditions = [eq(webhooks.isActive, true)];
      if (applicationId) {
        conditions.push(
          sql`(${webhooks.applicationId} = ${applicationId} OR ${webhooks.applicationId} IS NULL)`,
        );
      }
      const allActive = await withTransaction(this.db, async (tx) => {
        return await tx
          .select()
          .from(webhooks)
          .where(and(...conditions));
      });
      const matching = allActive.filter((w) => {
        let events: string[] = [];
        if (Array.isArray(w.events)) {
          events = w.events;
        } else if (typeof w.events === 'string') {
          try {
            const parsed = JSON.parse(w.events);
            if (Array.isArray(parsed)) events = parsed;
            else events = [w.events];
          } catch {
            events = [w.events];
          }
        }
        if (events.includes(eventType) || events.includes('*')) return true;
        // Event aliases for consistency and backwards compatibility
        if (
          eventType === 'content.unpublished' &&
          events.includes('content.unpublish')
        )
          return true;
        if (
          eventType === 'content.unpublish' &&
          events.includes('content.unpublished')
        )
          return true;
        if (
          eventType === 'content.created' &&
          events.includes('content.create')
        )
          return true;
        if (
          eventType === 'content.create' &&
          events.includes('content.created')
        )
          return true;
        if (
          eventType === 'content.updated' &&
          events.includes('content.update')
        )
          return true;
        if (
          eventType === 'content.update' &&
          events.includes('content.updated')
        )
          return true;
        if (
          eventType === 'content.deleted' &&
          events.includes('content.delete')
        )
          return true;
        if (
          eventType === 'content.delete' &&
          events.includes('content.deleted')
        )
          return true;
        return false;
      });
      logger.debug(
        { eventType, count: matching.length },
        'WebhooksRepository: findActiveByEvent complete',
      );
      return matching;
    } catch (error) {
      logger.error(
        { err: error, eventType },
        'WebhooksRepository: findActiveByEvent failed',
      );
      throw new ApiError(500, REPO_ERRORS.LIST_WEBHOOKS_FAILED);
    }
  }

  async recordDelivery(data: {
    webhookId: string;
    applicationId?: string;
    eventType: string;
    payload: unknown;
    responseStatus?: number | null;
    attempt?: number;
    maxAttempts?: number;
    status?: WebhookDeliveryStatus;
    nextRetryAt?: Date | null;
    lastError?: string | null;
    deliveredAt?: Date | null;
  }) {
    try {
      logger.info(
        {
          webhookId: data.webhookId,
          eventType: data.eventType,
          attempt: data.attempt,
          status: data.status,
        },
        'WebhooksRepository: recordDelivery start',
      );
      const [delivery] = await withTransaction(this.db, async (tx) => {
        let resolvedAppId = data.applicationId;
        if (!resolvedAppId) {
          const [wh] = await tx
            .select({ applicationId: webhooks.applicationId })
            .from(webhooks)
            .where(eq(webhooks.id, data.webhookId))
            .limit(1);
          resolvedAppId = wh?.applicationId ?? undefined;
        }
        if (!resolvedAppId) {
          const [app] = await tx
            .select({ id: applications.id })
            .from(applications)
            .limit(1);
          resolvedAppId = app?.id;
        }

        return await tx
          .insert(webhookDeliveries)
          .values({
            webhookId: data.webhookId,
            ...(resolvedAppId ? { applicationId: resolvedAppId } : {}),
            eventType: data.eventType,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            payload: data.payload as any,
            responseStatus: data.responseStatus ?? null,
            attempt: data.attempt ?? 1,
            maxAttempts: data.maxAttempts ?? 3,
            status:
              data.status ?? (data.deliveredAt ? 'delivered' : 'pending_retry'),
            nextRetryAt: data.nextRetryAt ?? null,
            lastError: data.lastError ?? null,
            deliveredAt: data.deliveredAt ?? null,
          })
          .returning();
      });
      logger.debug(
        { deliveryId: delivery?.id, status: delivery?.status },
        'WebhooksRepository: recordDelivery complete',
      );
      return delivery;
    } catch (error) {
      logger.error(
        { err: error },
        'WebhooksRepository Error in recordDelivery:',
      );
      throw new ApiError(500, REPO_ERRORS.RECORD_WEBHOOK_DELIVERY_FAILED);
    }
  }

  async updateDelivery(
    deliveryId: string,
    data: {
      responseStatus?: number | null;
      attempt?: number;
      status?: WebhookDeliveryStatus;
      nextRetryAt?: Date | null;
      lastError?: string | null;
      deliveredAt?: Date | null;
    },
  ) {
    try {
      logger.info(
        { deliveryId, status: data.status },
        'WebhooksRepository: updateDelivery start',
      );
      const [delivery] = await withTransaction(this.db, async (tx) => {
        return await tx
          .update(webhookDeliveries)
          .set({
            ...(data.responseStatus !== undefined
              ? { responseStatus: data.responseStatus }
              : {}),
            ...(data.attempt !== undefined ? { attempt: data.attempt } : {}),
            ...(data.status !== undefined ? { status: data.status } : {}),
            ...(data.nextRetryAt !== undefined
              ? { nextRetryAt: data.nextRetryAt }
              : {}),
            ...(data.lastError !== undefined
              ? { lastError: data.lastError }
              : {}),
            ...(data.deliveredAt !== undefined
              ? { deliveredAt: data.deliveredAt }
              : {}),
          })
          .where(eq(webhookDeliveries.id, deliveryId))
          .returning();
      });
      return delivery;
    } catch (error) {
      logger.error(
        { err: error, deliveryId },
        'WebhooksRepository: updateDelivery failed',
      );
      throw new ApiError(500, REPO_ERRORS.UPDATE_WEBHOOK_DELIVERY_FAILED);
    }
  }

  async getDeliveryById(
    deliveryId: string,
    webhookId?: string,
    applicationId?: string,
  ) {
    try {
      const conditions = [eq(webhookDeliveries.id, deliveryId)];
      if (webhookId) {
        conditions.push(eq(webhookDeliveries.webhookId, webhookId));
      }
      if (applicationId) {
        conditions.push(eq(webhookDeliveries.applicationId, applicationId));
      }
      const [delivery] = await withTransaction(this.db, async (tx) => {
        return await tx
          .select()
          .from(webhookDeliveries)
          .where(and(...conditions))
          .limit(1);
      });
      return delivery ?? null;
    } catch (error) {
      logger.error(
        { err: error, deliveryId },
        'WebhooksRepository: getDeliveryById failed',
      );
      throw new ApiError(500, REPO_ERRORS.DB_FETCH_FAILED);
    }
  }

  async findPendingRetries(limit: number = 50) {
    try {
      const now = new Date();
      return await withTransaction(this.db, async (tx) => {
        return await tx
          .select()
          .from(webhookDeliveries)
          .where(
            and(
              eq(webhookDeliveries.status, 'pending_retry'),
              lte(webhookDeliveries.nextRetryAt, now),
            ),
          )
          .orderBy(webhookDeliveries.nextRetryAt)
          .limit(limit);
      });
    } catch (error) {
      logger.error(
        { err: error },
        'WebhooksRepository: findPendingRetries failed',
      );
      throw new ApiError(500, REPO_ERRORS.LIST_WEBHOOK_DELIVERIES_FAILED);
    }
  }

  async findDlqDeliveries(
    webhookId?: string,
    applicationId?: string,
    limit: number = 50,
  ) {
    try {
      const conditions = [eq(webhookDeliveries.status, 'dlq')];
      if (webhookId) {
        conditions.push(eq(webhookDeliveries.webhookId, webhookId));
      }
      if (applicationId) {
        conditions.push(
          sql`(${webhookDeliveries.applicationId} = ${applicationId} OR ${webhookDeliveries.applicationId} IS NULL)`,
        );
      }
      return await withTransaction(this.db, async (tx) => {
        return await tx
          .select()
          .from(webhookDeliveries)
          .where(and(...conditions))
          .orderBy(desc(webhookDeliveries.createdAt))
          .limit(limit);
      });
    } catch (error) {
      logger.error(
        { err: error },
        'WebhooksRepository: findDlqDeliveries failed',
      );
      throw new ApiError(500, REPO_ERRORS.LIST_WEBHOOK_DELIVERIES_FAILED);
    }
  }

  async listDeliveries(
    webhookId: string,
    applicationId?: string,
    limit: number = 50,
  ) {
    try {
      logger.info({ webhookId }, 'WebhooksRepository: listDeliveries start');
      const conditions = [eq(webhookDeliveries.webhookId, webhookId)];
      const deliveries = await withTransaction(this.db, async (tx) => {
        return await tx
          .select()
          .from(webhookDeliveries)
          .where(and(...conditions))
          .orderBy(desc(webhookDeliveries.createdAt))
          .limit(limit);
      });
      logger.debug(
        { count: deliveries.length },
        'WebhooksRepository: listDeliveries complete',
      );
      return deliveries;
    } catch (error) {
      logger.error(
        { err: error },
        'WebhooksRepository Error in listDeliveries:',
      );
      throw new ApiError(500, REPO_ERRORS.LIST_WEBHOOK_DELIVERIES_FAILED);
    }
  }
}
