/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebhookDispatcherService } from '../../../../src/modules/webhooks/webhook-dispatcher.service.js';
import { WebhooksRepository } from '@repo/repository';
import crypto from 'node:crypto';

vi.mock('@repo/repository');

describe('WebhookDispatcherService', () => {
  let dispatcher: WebhookDispatcherService;
  let mockRepository: vi.Mocked<WebhooksRepository>;
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = {
      findActiveByEvent: vi.fn(),
      recordDelivery: vi.fn().mockResolvedValue({ id: 'del-1' }),
      updateDelivery: vi.fn().mockResolvedValue({ id: 'del-1' }),
      getDeliveryById: vi.fn(),
      findPendingRetries: vi.fn(),
      findDlqDeliveries: vi.fn(),
      getById: vi.fn(),
      listDeliveries: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    } as any;
    dispatcher = new WebhookDispatcherService(mockRepository, {
      maxAttempts: 3,
      backoffBaseMs: 100, // short delay for tests
      timeoutMs: 1000,
    });
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    dispatcher.stopRetryProcessor();
  });

  describe('calculateBackoffDelay', () => {
    it('should compute progressive backoff delays', () => {
      expect(dispatcher.calculateBackoffDelay(1)).toBe(100); // 1x
      expect(dispatcher.calculateBackoffDelay(2)).toBe(500); // 5x
      expect(dispatcher.calculateBackoffDelay(3)).toBe(1500); // 15x
    });
  });

  describe('dispatch', () => {
    it('should send signed HTTP POST to active webhooks and record delivery', async () => {
      const mockWebhooks = [
        {
          id: 'wh-1',
          name: 'Next.js Revalidate',
          url: 'https://example.com/api/revalidate',
          secretKey: 'my-secret-key',
          events: ['content.published'],
          isActive: true,
        },
      ];
      mockRepository.findActiveByEvent.mockResolvedValue(mockWebhooks as any);
      mockRepository.recordDelivery.mockResolvedValue({ id: 'del-1' } as any);

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      await dispatcher.dispatch('content.published', {
        schemaSlug: 'article',
        entryId: '123',
      });

      expect(mockRepository.findActiveByEvent).toHaveBeenCalledWith(
        'content.published',
        undefined,
      );
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const [calledUrl, calledOptions] = (global.fetch as any).mock.calls[0];
      expect(calledUrl).toBe('https://example.com/api/revalidate');
      expect(calledOptions.method).toBe('POST');
      expect(calledOptions.headers['Content-Type']).toBe('application/json');
      expect(calledOptions.headers['x-agentic-event']).toBe(
        'content.published',
      );

      // Verify HMAC-SHA256 signature
      const body = calledOptions.body;
      const expectedSig = crypto
        .createHmac('sha256', 'my-secret-key')
        .update(body)
        .digest('hex');
      expect(calledOptions.headers['x-agentic-signature']).toBe(expectedSig);

      // Verify delivery record with delivered status
      expect(mockRepository.recordDelivery).toHaveBeenCalledWith(
        expect.objectContaining({
          webhookId: 'wh-1',
          eventType: 'content.published',
          responseStatus: 200,
          status: 'delivered',
          deliveredAt: expect.any(Date),
        }),
      );
    });

    it('should schedule retry when initial delivery fails with network error', async () => {
      const mockWebhooks = [
        {
          id: 'wh-1',
          name: 'Broken Endpoint',
          url: 'https://broken.example.com',
          secretKey: 'key',
          events: ['content.published'],
          isActive: true,
        },
      ];
      mockRepository.findActiveByEvent.mockResolvedValue(mockWebhooks as any);
      (global.fetch as any).mockRejectedValue(new Error('Connection refused'));

      await dispatcher.dispatch('content.published', { entryId: '123' });

      expect(mockRepository.recordDelivery).toHaveBeenCalledWith(
        expect.objectContaining({
          webhookId: 'wh-1',
          responseStatus: null,
          status: 'pending_retry',
          attempt: 1,
          maxAttempts: 3,
          deliveredAt: null,
          nextRetryAt: expect.any(Date),
          lastError: 'Connection refused',
        }),
      );
    });

    it('should schedule retry when initial delivery returns 500 error', async () => {
      const mockWebhooks = [
        {
          id: 'wh-1',
          name: 'Failing Endpoint',
          url: 'https://failing.example.com',
          secretKey: 'key',
          events: ['content.published'],
          isActive: true,
        },
      ];
      mockRepository.findActiveByEvent.mockResolvedValue(mockWebhooks as any);
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await dispatcher.dispatch('content.published', { entryId: '123' });

      expect(mockRepository.recordDelivery).toHaveBeenCalledWith(
        expect.objectContaining({
          webhookId: 'wh-1',
          responseStatus: 500,
          status: 'pending_retry',
          attempt: 1,
          deliveredAt: null,
          nextRetryAt: expect.any(Date),
        }),
      );
    });

    it('should immediately assign DLQ if maxAttempts is 1 and delivery fails', async () => {
      const singleAttemptDispatcher = new WebhookDispatcherService(
        mockRepository,
        {
          maxAttempts: 1,
        },
      );
      const mockWebhooks = [
        {
          id: 'wh-1',
          name: 'Failing',
          url: 'https://failing.example.com',
          secretKey: 'key',
          events: ['content.published'],
          isActive: true,
        },
      ];
      mockRepository.findActiveByEvent.mockResolvedValue(mockWebhooks as any);
      (global.fetch as any).mockRejectedValue(new Error('Timeout'));

      await singleAttemptDispatcher.dispatch('content.published', {
        entryId: '123',
      });

      expect(mockRepository.recordDelivery).toHaveBeenCalledWith(
        expect.objectContaining({
          webhookId: 'wh-1',
          status: 'dlq',
          attempt: 1,
          nextRetryAt: null,
        }),
      );
    });

    it('should do nothing if no webhooks are subscribed', async () => {
      mockRepository.findActiveByEvent.mockResolvedValue([]);

      await dispatcher.dispatch('content.published', { entryId: '123' });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockRepository.recordDelivery).not.toHaveBeenCalled();
    });
  });

  describe('retryDelivery', () => {
    it('should successfully retry delivery and update status to delivered', async () => {
      const mockDelivery = {
        id: 'del-1',
        webhookId: 'wh-1',
        eventType: 'content.published',
        payload: { event: 'content.published', id: '123' },
        attempt: 1,
        maxAttempts: 3,
        status: 'pending_retry',
      };
      const mockWebhook = {
        id: 'wh-1',
        url: 'https://example.com/webhook',
        secretKey: 'secret',
        isActive: true,
      };

      mockRepository.getDeliveryById.mockResolvedValue(mockDelivery as any);
      mockRepository.getById.mockResolvedValue(mockWebhook as any);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      const result = await dispatcher.retryDelivery('del-1');

      expect(result.success).toBe(true);
      expect(result.status).toBe('delivered');
      expect(result.attempt).toBe(2);
      expect(mockRepository.updateDelivery).toHaveBeenCalledWith(
        'del-1',
        expect.objectContaining({
          status: 'delivered',
          attempt: 2,
          responseStatus: 200,
          deliveredAt: expect.any(Date),
        }),
      );
    });

    it('should increment attempt and set nextRetryAt if retry fails and attempt < maxAttempts', async () => {
      const mockDelivery = {
        id: 'del-1',
        webhookId: 'wh-1',
        eventType: 'content.published',
        payload: { event: 'content.published' },
        attempt: 1,
        maxAttempts: 3,
        status: 'pending_retry',
      };
      const mockWebhook = {
        id: 'wh-1',
        url: 'https://example.com/webhook',
        secretKey: 'secret',
        isActive: true,
      };

      mockRepository.getDeliveryById.mockResolvedValue(mockDelivery as any);
      mockRepository.getById.mockResolvedValue(mockWebhook as any);
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await dispatcher.retryDelivery('del-1');

      expect(result.success).toBe(false);
      expect(result.status).toBe('pending_retry');
      expect(result.attempt).toBe(2);
      expect(mockRepository.updateDelivery).toHaveBeenCalledWith(
        'del-1',
        expect.objectContaining({
          status: 'pending_retry',
          attempt: 2,
          nextRetryAt: expect.any(Date),
          lastError: 'Network error',
        }),
      );
    });

    it('should promote delivery to DLQ if max attempts are reached', async () => {
      const mockDelivery = {
        id: 'del-1',
        webhookId: 'wh-1',
        eventType: 'content.published',
        payload: { event: 'content.published' },
        attempt: 2,
        maxAttempts: 3,
        status: 'pending_retry',
      };
      const mockWebhook = {
        id: 'wh-1',
        url: 'https://example.com/webhook',
        secretKey: 'secret',
        isActive: true,
      };

      mockRepository.getDeliveryById.mockResolvedValue(mockDelivery as any);
      mockRepository.getById.mockResolvedValue(mockWebhook as any);
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      const result = await dispatcher.retryDelivery('del-1');

      expect(result.success).toBe(false);
      expect(result.status).toBe('dlq');
      expect(result.attempt).toBe(3);
      expect(mockRepository.updateDelivery).toHaveBeenCalledWith(
        'del-1',
        expect.objectContaining({
          status: 'dlq',
          attempt: 3,
          responseStatus: 503,
          nextRetryAt: null,
        }),
      );
    });

    it('should mark delivery failed if associated webhook is inactive', async () => {
      const mockDelivery = {
        id: 'del-1',
        webhookId: 'wh-1',
        status: 'pending_retry',
      };
      mockRepository.getDeliveryById.mockResolvedValue(mockDelivery as any);
      mockRepository.getById.mockResolvedValue({
        id: 'wh-1',
        isActive: false,
      } as any);

      const result = await dispatcher.retryDelivery('del-1');

      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
      expect(mockRepository.updateDelivery).toHaveBeenCalledWith(
        'del-1',
        expect.objectContaining({
          status: 'failed',
        }),
      );
    });
  });

  describe('replayDelivery', () => {
    it('should successfully replay delivery and create a new delivery record', async () => {
      const mockDelivery = {
        id: 'del-original',
        webhookId: 'wh-1',
        eventType: 'content.published',
        payload: { event: 'content.published', id: '123' },
        attempt: 3,
        maxAttempts: 3,
        status: 'dlq',
      };
      const mockWebhook = {
        id: 'wh-1',
        url: 'https://example.com/webhook',
        secretKey: 'secret',
        isActive: true,
      };

      mockRepository.getDeliveryById.mockResolvedValue(mockDelivery as any);
      mockRepository.getById.mockResolvedValue(mockWebhook as any);
      mockRepository.recordDelivery.mockResolvedValue({
        id: 'del-new',
        status: 'delivered',
        attempt: 1,
      } as any);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      const result = await dispatcher.replayDelivery('del-original');

      expect(result.success).toBe(true);
      expect(result.status).toBe('delivered');
      expect(result.statusCode).toBe(200);
      expect(mockRepository.recordDelivery).toHaveBeenCalledWith(
        expect.objectContaining({
          webhookId: 'wh-1',
          eventType: 'content.published',
          payload: mockDelivery.payload,
          attempt: 1,
          status: 'delivered',
        }),
      );
    });

    it('should throw 404 if original delivery is not found', async () => {
      mockRepository.getDeliveryById.mockResolvedValue(null);

      await expect(dispatcher.replayDelivery('del-missing')).rejects.toThrow(
        'Webhook delivery not found',
      );
    });
  });

  describe('processPendingRetries', () => {
    it('should find due retries and process them', async () => {
      const pendingDeliveries = [{ id: 'del-1' }, { id: 'del-2' }];
      mockRepository.findPendingRetries.mockResolvedValue(
        pendingDeliveries as any,
      );

      vi.spyOn(dispatcher, 'retryDelivery')
        .mockResolvedValueOnce({
          success: true,
          status: 'delivered',
          statusCode: 200,
          attempt: 2,
        })
        .mockResolvedValueOnce({
          success: false,
          status: 'dlq',
          statusCode: 500,
          attempt: 3,
        });

      const result = await dispatcher.processPendingRetries();

      expect(result.processed).toBe(2);
      expect(result.succeeded).toBe(1);
      expect(result.dlq).toBe(1);
    });

    it('should handle zero pending retries gracefully', async () => {
      mockRepository.findPendingRetries.mockResolvedValue([]);

      const result = await dispatcher.processPendingRetries();

      expect(result.processed).toBe(0);
      expect(result.succeeded).toBe(0);
    });
  });

  describe('testWebhook', () => {
    it('should send a ping request and return success', async () => {
      const mockWebhook = {
        id: 'wh-1',
        name: 'Test Hook',
        url: 'https://example.com/ping',
        secretKey: 'test-secret',
        events: ['content.published'],
        isActive: true,
      };
      mockRepository.getById.mockResolvedValue(mockWebhook as any);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      const result = await dispatcher.testWebhook('wh-1');

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/ping',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-agentic-event': 'ping',
          }),
        }),
      );
    });

    it('should return failure if the external endpoint returns error', async () => {
      const mockWebhook = {
        id: 'wh-2',
        name: '404 Hook',
        url: 'https://example.com/notfound',
        secretKey: 'test-secret',
      };
      mockRepository.getById.mockResolvedValue(mockWebhook as any);
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await dispatcher.testWebhook('wh-2');

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
    });

    it('should return failure when network call throws', async () => {
      const mockWebhook = {
        id: 'wh-3',
        name: 'Timeout Hook',
        url: 'https://timeout.example.com',
        secretKey: 'test-secret',
      };
      mockRepository.getById.mockResolvedValue(mockWebhook as any);
      (global.fetch as any).mockRejectedValue(new Error('ETIMEDOUT'));

      const result = await dispatcher.testWebhook('wh-3');

      expect(result.success).toBe(false);
      expect(result.statusCode).toBeNull();
      expect(result.error).toBe('ETIMEDOUT');
    });

    it('should throw 404 ApiError if webhook does not exist', async () => {
      mockRepository.getById.mockResolvedValue(null as any);

      await expect(dispatcher.testWebhook('nonexistent')).rejects.toThrow();
    });
  });
});
