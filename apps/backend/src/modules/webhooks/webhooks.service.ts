import crypto from 'node:crypto';
import { WebhooksRepository } from '@repo/repository';
import type { CreateWebhookInput, BaseQueryOptions } from '@repo/types';
import { logger } from '@repo/logger';
import { eventBus } from '@repo/events';
import { EVENT_NAMES, AUDIT_ACTIONS } from '@repo/constants';
import { ApiError } from '@repo/utils';
import { getAuditContext } from '../../utils/audit.js';
import { SERVICE_ERRORS } from '../../utils/error-constants.js';
export class WebhooksService {
  constructor(
    private readonly repository: WebhooksRepository = new WebhooksRepository(),
  ) {}
  async list(options: BaseQueryOptions = {}, applicationId?: string) {
    try {
      logger.info('WebhooksService: list start');
      const result = await this.repository.list(options, applicationId);
      logger.debug('WebhooksService: list end');
      return result;
    } catch (error) {
      logger.error({ err: error }, 'WebhooksService Error in list:');
      throw new ApiError(500, SERVICE_ERRORS.LIST_WEBHOOKS_FAILED);
    }
  }
  async create(data: CreateWebhookInput, applicationId?: string) {
    try {
      logger.info({ name: data.name }, 'WebhooksService: create start');
      const secretKey = crypto.randomBytes(24).toString('hex');
      const result = await this.repository.create({
        name: data.name,
        url: data.url,
        events: data.events,
        isActive: data.isActive ?? true,
        secretKey,
        ...(applicationId ? { applicationId } : {}),
      });
      logger.debug(
        { id: result!.id },
        'WebhooksService: create successful, emitting audit log',
      );
      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.CREATE,
        resourceType: 'webhook',
        resourceId: result!.id,
        actorUserId,
        actorAgentId,
        beforeState: null,
        afterState: {
          id: result!.id,
          name: result!.name,
          url: result!.url,
          events: result!.events,
        },
        context,
      });
      return result;
    } catch (error) {
      logger.error({ err: error }, 'WebhooksService Error in create:');
      throw new ApiError(500, SERVICE_ERRORS.CREATE_WEBHOOK_FAILED);
    }
  }
  async delete(id: string, applicationId?: string) {
    try {
      logger.info({ id }, 'WebhooksService: delete start');
      const beforeState = await this.repository.getById(id, applicationId);
      const result = await this.repository.delete(id);
      logger.debug(
        { id },
        'WebhooksService: delete successful, emitting audit log',
      );
      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.DELETE,
        resourceType: 'webhook',
        resourceId: id,
        actorUserId,
        actorAgentId,
        beforeState: beforeState,
        afterState: null,
        context,
      });
      return result;
    } catch (error) {
      logger.error({ err: error }, 'WebhooksService Error in delete:');
      throw new ApiError(500, SERVICE_ERRORS.DELETE_WEBHOOK_FAILED);
    }
  }

  async test(id: string, applicationId?: string) {
    try {
      logger.info({ id }, 'WebhooksService: test start');
      const { webhookDispatcher } =
        await import('./webhook-dispatcher.service.js');
      return await webhookDispatcher.testWebhook(id, applicationId);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error({ err: error }, 'WebhooksService Error in test:');
      throw new ApiError(500, SERVICE_ERRORS.TEST_WEBHOOK_FAILED);
    }
  }

  async listDeliveries(id: string, applicationId?: string) {
    try {
      logger.info({ id }, 'WebhooksService: listDeliveries start');
      return await this.repository.listDeliveries(id, applicationId);
    } catch (error) {
      logger.error({ err: error }, 'WebhooksService Error in listDeliveries:');
      throw new ApiError(500, SERVICE_ERRORS.LIST_DELIVERIES_FAILED);
    }
  }
}
