import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import type { Job } from 'bullmq';
import type { WebhookJobData } from '@repo/config';

const { mockRecordDelivery } = vi.hoisted(() => ({
  mockRecordDelivery: vi.fn(),
}));

vi.mock('@repo/repository', () => {
  return {
    WebhooksRepository: class {
      recordDelivery = mockRecordDelivery;
    },
  };
});

import { processWebhookJob } from '../src/webhook.worker.js';

describe('Webhook Worker (processWebhookJob)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    mockRecordDelivery.mockResolvedValue({ id: 'del-123' });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('delivers signed webhook payload successfully and logs delivery', async () => {
    const jobData: WebhookJobData = {
      webhookId: 'wh-abc',
      applicationId: 'app-1',
      url: 'https://example.com/webhook',
      secretKey: 'top-secret',
      eventType: 'content.published',
      payload: { id: 'entry-1', title: 'Hello World' },
      deliveryId: 'deliv-xyz',
    };

    const mockJob = {
      id: 'job-1',
      data: jobData,
      attemptsMade: 0,
    } as unknown as Job<WebhookJobData>;

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
    } as Response);

    await processWebhookJob(mockJob);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOptions] = vi.mocked(global.fetch).mock.calls[0];
    expect(calledUrl).toBe('https://example.com/webhook');
    expect(calledOptions?.method).toBe('POST');
    expect((calledOptions?.headers as Record<string, string>)['x-agentic-event']).toBe('content.published');
    expect((calledOptions?.headers as Record<string, string>)['x-agentic-delivery-id']).toBe('deliv-xyz');

    // Verify HMAC-SHA256 signature
    const expectedSig = crypto
      .createHmac('sha256', 'top-secret')
      .update(JSON.stringify(jobData.payload))
      .digest('hex');
    expect((calledOptions?.headers as Record<string, string>)['x-agentic-signature']).toBe(expectedSig);

    expect(mockRecordDelivery).toHaveBeenCalledWith(
      expect.objectContaining({
        webhookId: 'wh-abc',
        applicationId: 'app-1',
        eventType: 'content.published',
        responseStatus: 200,
        attempt: 1,
        deliveredAt: expect.any(Date),
      }),
    );
  });

  it('records failed attempt and throws error when endpoint responds with 500 to trigger retry', async () => {
    const jobData: WebhookJobData = {
      webhookId: 'wh-failed',
      applicationId: 'app-1',
      url: 'https://broken.example.com/webhook',
      secretKey: 'top-secret',
      eventType: 'content.updated',
      payload: { id: 'entry-2' },
      deliveryId: 'deliv-fail',
    };

    const mockJob = {
      id: 'job-2',
      data: jobData,
      attemptsMade: 1, // Second attempt
    } as unknown as Job<WebhookJobData>;

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    await expect(processWebhookJob(mockJob)).rejects.toThrow('HTTP status 500');

    expect(mockRecordDelivery).toHaveBeenCalledWith(
      expect.objectContaining({
        webhookId: 'wh-failed',
        eventType: 'content.updated',
        responseStatus: 500,
        attempt: 2,
        deliveredAt: null,
      }),
    );
  });

  it('records network failure and throws error to trigger exponential backoff', async () => {
    const jobData: WebhookJobData = {
      webhookId: 'wh-timeout',
      url: 'https://timeout.example.com/webhook',
      secretKey: 'top-secret',
      eventType: 'content.deleted',
      payload: { id: 'entry-3' },
    };

    const mockJob = {
      id: 'job-3',
      data: jobData,
      attemptsMade: 0,
    } as unknown as Job<WebhookJobData>;

    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Connection timed out'));

    await expect(processWebhookJob(mockJob)).rejects.toThrow('Connection timed out');

    expect(mockRecordDelivery).toHaveBeenCalledWith(
      expect.objectContaining({
        webhookId: 'wh-timeout',
        eventType: 'content.deleted',
        responseStatus: null,
        attempt: 1,
        deliveredAt: null,
      }),
    );
  });
});
