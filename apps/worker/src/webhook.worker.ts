import crypto from 'node:crypto';
import type { Job } from 'bullmq';
import {
  registerWorker,
  QUEUE_NAMES,
  type WebhookJobData,
} from '@repo/config';
import { WebhooksRepository } from '@repo/repository';
import { logger } from '@repo/logger';

const repository = new WebhooksRepository();

function isSafeUrlForDelivery(urlString: string): boolean {
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.ENFORCE_SSRF_PROTECTION !== 'true'
  ) {
    return true;
  }
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname === '169.254.169.254' ||
      hostname.endsWith('.internal') ||
      hostname.startsWith('169.254.')
    ) {
      return false;
    }
    const isPrivateIpv4 =
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^127\./.test(hostname) ||
      /^0\./.test(hostname);
    return !isPrivateIpv4;
  } catch {
    return false;
  }
}

/**
 * Delivers an HTTP webhook payload with an HMAC-SHA256 signature
 * and logs the delivery attempt in PostgreSQL.
 */
export async function processWebhookJob(
  job: Job<WebhookJobData>,
): Promise<void> {
  const {
    webhookId,
    applicationId,
    url,
    secretKey,
    eventType,
    payload,
    deliveryId,
  } = job.data;
  const startTime = Date.now();
  let responseStatus: number | null = null;
  let success = false;
  let failureError: Error | null = null;
  const bodyString = JSON.stringify(payload);

  try {
    if (!isSafeUrlForDelivery(url)) {
      throw new Error(
        'Webhook delivery aborted: target URL is an internal or private address (SSRF protected)',
      );
    }

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(bodyString)
      .digest('hex');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-agentic-signature': signature,
        'x-agentic-event': eventType,
        'x-agentic-delivery-id': deliveryId || job.id || crypto.randomUUID(),
        'x-agentic-timestamp': startTime.toString(),
        'User-Agent': 'Agentic-CMS-Webhook/1.0',
      },
      body: bodyString,
      signal: AbortSignal.timeout(5000),
    });

    responseStatus = res.status;
    success = res.ok;

    if (!res.ok) {
      failureError = new Error(
        `Webhook delivery failed with HTTP status ${res.status}: ${res.statusText}`,
      );
    }

    logger.debug(
      {
        webhookId,
        status: res.status,
        duration: Date.now() - startTime,
        attempt: job.attemptsMade + 1,
      },
      'WebhookWorker: delivery attempt finished',
    );
  } catch (err: unknown) {
    failureError =
      err instanceof Error ? err : new Error('Outbound HTTP request failed');
    logger.warn(
      {
        err: failureError,
        webhookId,
        url,
        attempt: job.attemptsMade + 1,
      },
      'WebhookWorker: outbound HTTP request failed or timed out',
    );
  } finally {
    try {
      await repository.recordDelivery({
        webhookId,
        applicationId,
        eventType,
        payload,
        responseStatus,
        attempt: job.attemptsMade + 1,
        deliveredAt: success ? new Date() : null,
      });
    } catch (recordErr) {
      logger.error(
        { err: recordErr, webhookId },
        'WebhookWorker: failed to record delivery in database',
      );
    }
  }

  // If failed, rethrow so BullMQ performs exponential backoff retry
  if (failureError) {
    throw failureError;
  }
}

/**
 * Initializes and registers the background webhook worker.
 * Default concurrency is 20 parallel HTTP dispatches.
 */
export function setupWebhookWorker(concurrency = 20) {
  const worker = registerWorker<WebhookJobData>(
    QUEUE_NAMES.WEBHOOK_DISPATCH,
    processWebhookJob,
    { concurrency },
  );

  worker.on('completed', (job) => {
    logger.info(
      {
        jobId: job.id,
        webhookId: job.data.webhookId,
        event: job.data.eventType,
        attempts: job.attemptsMade + 1,
      },
      'Webhook delivery succeeded',
    );
  });

  return worker;
}

