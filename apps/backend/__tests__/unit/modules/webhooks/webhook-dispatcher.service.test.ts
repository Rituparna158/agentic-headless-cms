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
      getById: vi.fn(),
      listDeliveries: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    } as any;
    dispatcher = new WebhookDispatcherService(mockRepository);
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
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

      // Verify delivery record
      expect(mockRepository.recordDelivery).toHaveBeenCalledWith(
        expect.objectContaining({
          webhookId: 'wh-1',
          eventType: 'content.published',
          responseStatus: 200,
          deliveredAt: expect.any(Date),
        }),
      );
    });

    it('should do nothing if no webhooks are subscribed', async () => {
      mockRepository.findActiveByEvent.mockResolvedValue([]);

      await dispatcher.dispatch('content.published', { entryId: '123' });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockRepository.recordDelivery).not.toHaveBeenCalled();
    });

    it('should gracefully handle fetch errors without throwing', async () => {
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

      await expect(
        dispatcher.dispatch('content.published', { entryId: '123' }),
      ).resolves.not.toThrow();

      expect(mockRepository.recordDelivery).toHaveBeenCalledWith(
        expect.objectContaining({
          webhookId: 'wh-1',
          responseStatus: null,
          deliveredAt: null,
        }),
      );
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
