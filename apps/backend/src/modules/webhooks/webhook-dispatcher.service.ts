import crypto from 'node:crypto';
import { WebhooksRepository } from '@repo/repository';
import { logger } from '@repo/logger';
import { ApiError } from '@repo/utils';
import type { WebhookDeliveryStatus } from '@repo/types';
import { SERVICE_ERRORS } from '../../utils/error-constants.js';

export interface WebhookTestResult {
  success: boolean;
  statusCode: number | null;
  statusText?: string;
  responseTimeMs: number;
  error?: string;
}

export interface WebhookDispatcherOptions {
  maxAttempts?: number;
  backoffBaseMs?: number;
  timeoutMs?: number;
}

export class WebhookDispatcherService {
  private readonly maxAttempts: number;
  private readonly backoffBaseMs: number;
  private readonly timeoutMs: number;
  private retryTimer?: NodeJS.Timeout;
  private isProcessingRetries = false;

  constructor(
    private readonly repository: WebhooksRepository = new WebhooksRepository(),
    options?: WebhookDispatcherOptions,
  ) {
    this.maxAttempts = options?.maxAttempts ?? 3;
    this.backoffBaseMs = options?.backoffBaseMs ?? 60 * 1000;
    this.timeoutMs = options?.timeoutMs ?? 5000;
  }

  /**
   * Calculates exponential backoff delay based on the attempt number.
   * Attempt 1 -> 1x base (e.g. 1 min)
   * Attempt 2 -> 5x base (e.g. 5 min)
   * Attempt 3 -> 15x base (e.g. 15 min)
   */
  calculateBackoffDelay(attempt: number): number {
    const multipliers = [1, 5, 15];
    const multiplier = multipliers[attempt - 1] ?? Math.pow(2, attempt);
    return multiplier * this.backoffBaseMs;
  }

  async dispatch(
    eventType: string,
    payload: Record<string, unknown>,
    applicationId?: string,
  ): Promise<void> {
    try {
      logger.info({ eventType }, 'WebhookDispatcher: dispatching event');
      let webhooks = await this.repository.findActiveByEvent(
        eventType,
        applicationId,
      );

      if ((!webhooks || webhooks.length === 0) && applicationId) {
        webhooks = await this.repository.findActiveByEvent(eventType);
      }

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
          let errorMessage: string | null = null;

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
                'User-Agent': 'Headless-CMS-Webhook/1.0',
              },
              body: bodyString,
              signal: AbortSignal.timeout(this.timeoutMs),
            });

            responseStatus = res.status;
            success = res.ok;
            if (!res.ok) {
              errorMessage = `HTTP error ${res.status}: ${res.statusText || 'Delivery failed'}`;
            }
            logger.debug(
              {
                webhookId: webhook.id,
                status: res.status,
                duration: Date.now() - startTime,
              },
              'WebhookDispatcher: delivered webhook',
            );
          } catch (fetchErr) {
            errorMessage =
              fetchErr instanceof Error
                ? fetchErr.message
                : 'HTTP request failed or timed out';
            logger.warn(
              { err: fetchErr, webhookId: webhook.id, url: webhook.url },
              'WebhookDispatcher: outbound HTTP request failed or timed out',
            );
          }

          const status: WebhookDeliveryStatus = success
            ? 'delivered'
            : this.maxAttempts > 1
              ? 'pending_retry'
              : 'dlq';

          const nextRetryAt =
            !success && this.maxAttempts > 1
              ? new Date(Date.now() + this.calculateBackoffDelay(1))
              : null;

          try {
            await this.repository.recordDelivery({
              webhookId: webhook.id,
              applicationId: webhook.applicationId ?? applicationId,
              eventType,
              payload: bodyObj,
              responseStatus,
              attempt: 1,
              maxAttempts: this.maxAttempts,
              status,
              nextRetryAt,
              lastError: errorMessage,
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

  async retryDelivery(deliveryId: string): Promise<{
    success: boolean;
    status: WebhookDeliveryStatus;
    statusCode: number | null;
    attempt: number;
    error?: string;
  }> {
    const delivery = await this.repository.getDeliveryById(deliveryId);
    if (!delivery) {
      throw new ApiError(404, 'Webhook delivery record not found');
    }

    if (delivery.status === 'delivered') {
      return {
        success: true,
        status: 'delivered',
        statusCode: delivery.responseStatus,
        attempt: delivery.attempt,
      };
    }

    const webhook = await this.repository.getById(
      delivery.webhookId,
      delivery.applicationId ?? undefined,
    );
    if (!webhook || !webhook.isActive) {
      await this.repository.updateDelivery(deliveryId, {
        status: 'failed',
        lastError: 'Webhook endpoint not found or inactive',
      });
      return {
        success: false,
        status: 'failed',
        statusCode: null,
        attempt: delivery.attempt,
        error: 'Webhook endpoint not found or inactive',
      };
    }

    const bodyString =
      typeof delivery.payload === 'string'
        ? delivery.payload
        : JSON.stringify(delivery.payload);

    const newAttempt = (delivery.attempt ?? 1) + 1;
    const maxAttempts = delivery.maxAttempts ?? this.maxAttempts;
    let responseStatus: number | null = null;
    let success = false;
    let errorMessage: string | null = null;

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
          'x-agentic-event': delivery.eventType,
          'User-Agent': 'Headless-CMS-Webhook/1.0',
        },
        body: bodyString,
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      responseStatus = res.status;
      success = res.ok;
      if (!res.ok) {
        errorMessage = `HTTP error ${res.status}: ${res.statusText || 'Retry delivery failed'}`;
      }
    } catch (err: unknown) {
      errorMessage =
        err instanceof Error
          ? err.message
          : 'Retry request failed or timed out';
    }

    let status: WebhookDeliveryStatus;
    let nextRetryAt: Date | null = null;

    if (success) {
      status = 'delivered';
    } else if (newAttempt < maxAttempts) {
      status = 'pending_retry';
      nextRetryAt = new Date(
        Date.now() + this.calculateBackoffDelay(newAttempt),
      );
    } else {
      status = 'dlq';
      logger.warn(
        { deliveryId, webhookId: webhook.id, attempts: newAttempt },
        'WebhookDispatcher: delivery exceeded max attempts, moved to DLQ',
      );
    }

    await this.repository.updateDelivery(deliveryId, {
      responseStatus,
      attempt: newAttempt,
      status,
      nextRetryAt,
      lastError: errorMessage,
      deliveredAt: success ? new Date() : null,
    });

    return {
      success,
      status,
      statusCode: responseStatus,
      attempt: newAttempt,
      error: errorMessage ?? undefined,
    };
  }

  async replayDelivery(deliveryId: string): Promise<{
    success: boolean;
    status: WebhookDeliveryStatus;
    statusCode: number | null;
    delivery: unknown;
    error?: string;
  }> {
    const delivery = await this.repository.getDeliveryById(deliveryId);
    if (!delivery) {
      throw new ApiError(404, 'Webhook delivery not found');
    }

    const webhook = await this.repository.getById(
      delivery.webhookId,
      delivery.applicationId,
    );
    if (!webhook || !webhook.isActive) {
      throw new ApiError(400, 'Webhook endpoint not found or inactive');
    }

    const bodyString =
      typeof delivery.payload === 'string'
        ? delivery.payload
        : JSON.stringify(delivery.payload);

    let responseStatus: number | null = null;
    let success = false;
    let errorMessage: string | null = null;

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
          'x-agentic-event': delivery.eventType,
          'User-Agent': 'Headless-CMS-Webhook/1.0',
        },
        body: bodyString,
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      responseStatus = res.status;
      success = res.ok;
      if (!res.ok) {
        errorMessage = `HTTP error ${res.status}: ${res.statusText || 'Replay delivery failed'}`;
      }
    } catch (err: unknown) {
      errorMessage =
        err instanceof Error
          ? err.message
          : 'Replay request failed or timed out';
    }

    const status: WebhookDeliveryStatus = success
      ? 'delivered'
      : this.maxAttempts > 1
        ? 'pending_retry'
        : 'dlq';

    const nextRetryAt =
      !success && this.maxAttempts > 1
        ? new Date(Date.now() + this.calculateBackoffDelay(1))
        : null;

    const newDelivery = await this.repository.recordDelivery({
      webhookId: webhook.id,
      applicationId: webhook.applicationId ?? delivery.applicationId,
      eventType: delivery.eventType,
      payload: delivery.payload,
      responseStatus,
      attempt: 1,
      maxAttempts: delivery.maxAttempts ?? this.maxAttempts,
      status,
      nextRetryAt,
      lastError: errorMessage,
      deliveredAt: success ? new Date() : null,
    });

    return {
      success,
      status,
      statusCode: responseStatus,
      delivery: newDelivery,
      error: errorMessage ?? undefined,
    };
  }

  async processPendingRetries(limit = 50): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    dlq: number;
  }> {
    if (this.isProcessingRetries) {
      logger.debug(
        'WebhookDispatcher: processPendingRetries already running, skipping tick',
      );
      return { processed: 0, succeeded: 0, failed: 0, dlq: 0 };
    }

    this.isProcessingRetries = true;
    try {
      const pendingDeliveries = await this.repository.findPendingRetries(limit);
      if (!pendingDeliveries || pendingDeliveries.length === 0) {
        return { processed: 0, succeeded: 0, failed: 0, dlq: 0 };
      }

      logger.info(
        { count: pendingDeliveries.length },
        'WebhookDispatcher: processing pending retries',
      );

      let succeeded = 0;
      let failed = 0;
      let dlq = 0;

      for (const delivery of pendingDeliveries) {
        try {
          const result = await this.retryDelivery(delivery.id);
          if (result.success) {
            succeeded++;
          } else if (result.status === 'dlq') {
            dlq++;
          } else {
            failed++;
          }
        } catch (retryErr) {
          logger.error(
            { err: retryErr, deliveryId: delivery.id },
            'WebhookDispatcher: unexpected error retrying delivery',
          );
          failed++;
        }
      }

      return {
        processed: pendingDeliveries.length,
        succeeded,
        failed,
        dlq,
      };
    } finally {
      this.isProcessingRetries = false;
    }
  }

  startRetryProcessor(intervalMs = 30000): void {
    if (this.retryTimer) return;
    this.retryTimer = setInterval(() => {
      void this.processPendingRetries().catch((err) => {
        logger.error(
          { err },
          'WebhookDispatcher: error in background retry processor',
        );
      });
    }, intervalMs);

    if (this.retryTimer && typeof this.retryTimer.unref === 'function') {
      this.retryTimer.unref();
    }
  }

  stopRetryProcessor(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = undefined;
    }
  }

  async listDlq(webhookId?: string, applicationId?: string, limit = 50) {
    return await this.repository.findDlqDeliveries(
      webhookId,
      applicationId,
      limit,
    );
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
      message: 'Test ping from Headless CMS',
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
          'User-Agent': 'Headless-CMS-Webhook/1.0',
        },
        body: bodyString,
        signal: AbortSignal.timeout(this.timeoutMs),
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
          maxAttempts: 1,
          status: res.ok ? 'delivered' : 'failed',
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
          maxAttempts: 1,
          status: 'failed',
          lastError: errorMsg,
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
