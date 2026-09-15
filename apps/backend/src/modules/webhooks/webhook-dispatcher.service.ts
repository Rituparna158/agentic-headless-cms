import crypto from 'node:crypto';
import { WebhooksRepository } from '@repo/repository';
import { logger } from '@repo/logger';
import { ApiError } from '@repo/utils';
import { SERVICE_ERRORS } from '../../utils/error-constants.js';

export interface WebhookTestResult {
  success: boolean;
  statusCode: number | null;
  statusText?: string;
  responseTimeMs: number;
  error?: string;
}

export class WebhookDispatcherService {
  constructor(
    private readonly repository: WebhooksRepository = new WebhooksRepository(),
  ) {}

  async dispatch(
    eventType: string,
    payload: Record<string, unknown>,
    applicationId?: string,
  ): Promise<void> {
    try {
      logger.info({ eventType }, 'WebhookDispatcher: dispatching event');
      const webhooks = await this.repository.findActiveByEvent(
        eventType,
        applicationId,
      );

      if (!webhooks || webhooks.length === 0) {
        logger.debug(
          { eventType },
          'WebhookDispatcher: no active webhooks for event',
        );
        return;
      }

      logger.info(
        { eventType, count: webhooks.length },
        'WebhookDispatcher: delivering to active webhooks',
      );

      const bodyObj = {
        event: eventType,
        timestamp: new Date().toISOString(),
        ...payload,
      };
      const bodyString = JSON.stringify(bodyObj);

      await Promise.allSettled(
        webhooks.map(async (webhook) => {
          const startTime = Date.now();
          let responseStatus: number | null = null;
          let success = false;

          try {
            const signature = crypto
              .createHmac('sha256', webhook.secretKey)
              .update(bodyString)
              .digest('hex');

            const res = await fetch(webhook.url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-agentic-signature': signature,
                'x-agentic-event': eventType,
                'User-Agent': 'Agentic-CMS-Webhook/1.0',
              },
              body: bodyString,
              signal: AbortSignal.timeout(5000),
            });

            responseStatus = res.status;
            success = res.ok;
            logger.debug(
              {
                webhookId: webhook.id,
                status: res.status,
                duration: Date.now() - startTime,
              },
              'WebhookDispatcher: delivered webhook',
            );
          } catch (fetchErr) {
            logger.warn(
              { err: fetchErr, webhookId: webhook.id, url: webhook.url },
              'WebhookDispatcher: outbound HTTP request failed or timed out',
            );
          }

          try {
            await this.repository.recordDelivery({
              webhookId: webhook.id,
              applicationId: webhook.applicationId ?? applicationId,
              eventType,
              payload: bodyObj,
              responseStatus,
              attempt: 1,
              deliveredAt: success ? new Date() : null,
            });
          } catch (recordErr) {
            logger.error(
              { err: recordErr },
              'WebhookDispatcher: failed to record delivery',
            );
          }
        }),
      );
    } catch (error) {
      logger.error(
        { err: error, eventType },
        'WebhookDispatcher: error during dispatch',
      );
    }
  }

  async testWebhook(
    webhookId: string,
    applicationId?: string,
  ): Promise<WebhookTestResult> {
    const webhook = await this.repository.getById(webhookId, applicationId);
    if (!webhook) {
      throw new ApiError(404, SERVICE_ERRORS.FETCH_WEBHOOK_FAILED);
    }

    const testPayload = {
      event: 'ping',
      timestamp: new Date().toISOString(),
      message: 'Test ping from Agentic CMS',
      webhookId: webhook.id,
      webhookName: webhook.name,
    };
    const bodyString = JSON.stringify(testPayload);
    const signature = crypto
      .createHmac('sha256', webhook.secretKey)
      .update(bodyString)
      .digest('hex');

    const startTime = Date.now();
    try {
      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-agentic-signature': signature,
          'x-agentic-event': 'ping',
          'User-Agent': 'Agentic-CMS-Webhook/1.0',
        },
        body: bodyString,
        signal: AbortSignal.timeout(5000),
      });

      const duration = Date.now() - startTime;

      void this.repository
        .recordDelivery({
          webhookId: webhook.id,
          applicationId: webhook.applicationId ?? applicationId,
          eventType: 'ping',
          payload: testPayload,
          responseStatus: res.status,
          attempt: 1,
          deliveredAt: res.ok ? new Date() : null,
        })
        .catch((err) => {
          logger.error(
            { err },
            'WebhookDispatcher: test ping delivery log error',
          );
        });

      return {
        success: res.ok,
        statusCode: res.status,
        statusText: res.statusText,
        responseTimeMs: duration,
      };
    } catch (err: unknown) {
      const duration = Date.now() - startTime;
      const errorMsg =
        err instanceof Error ? err.message : 'Connection failed or timed out';

      void this.repository
        .recordDelivery({
          webhookId: webhook.id,
          applicationId: webhook.applicationId ?? applicationId,
          eventType: 'ping',
          payload: testPayload,
          responseStatus: null,
          attempt: 1,
          deliveredAt: null,
        })
        .catch(() => {});

      return {
        success: false,
        statusCode: null,
        responseTimeMs: duration,
        error: errorMsg,
      };
    }
  }
}

export const webhookDispatcher = new WebhookDispatcherService();
