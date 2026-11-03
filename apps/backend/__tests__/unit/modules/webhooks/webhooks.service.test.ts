/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhooksService } from '../../../../src/modules/webhooks/webhooks.service.js';
import { WebhooksRepository } from '@repo/repository';
import { eventBus } from '@repo/events';
import { EVENT_NAMES, AUDIT_ACTIONS } from '@repo/constants';

vi.mock('@repo/repository');
vi.mock('@repo/events', () => ({
  eventBus: { emit: vi.fn() },
}));
vi.mock('../../../../src/utils/audit.js', () => ({
  getAuditContext: vi.fn().mockReturnValue({
    actorUserId: 'test-user',
    actorAgentId: null,
    context: { ip: '127.0.0.1' },
  }),
}));

describe('WebhooksService', () => {
  let webhooksService: WebhooksService;
  let mockRepository: vi.Mocked<WebhooksRepository>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = new WebhooksRepository() as vi.Mocked<WebhooksRepository>;
    webhooksService = new WebhooksService(mockRepository);
  });

  it('should list webhooks', async () => {
    const mockWebhooks = [
      { id: '1', name: 'Hook 1', url: 'http://test.com', events: [] },
    ];
    mockRepository.list.mockResolvedValue(mockWebhooks as any);

    const result = await webhooksService.list();

    expect(mockRepository.list).toHaveBeenCalled();
    expect(result).toEqual(mockWebhooks);
  });

  it('should create a webhook and emit audit log', async () => {
    const mockCreated = {
      id: '2',
      name: 'Hook 2',
      url: 'http://test.com',
      events: [],
    };
    mockRepository.create.mockResolvedValue(mockCreated as any);

    const result = await webhooksService.create({
      name: 'Hook 2',
      url: 'http://test.com',
      events: [],
    });

    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Hook 2',
        url: 'http://test.com',
        events: [],
        isActive: true,
      }),
    );
    expect(result).toEqual(mockCreated);
    expect(eventBus.emit).toHaveBeenCalledWith(
      EVENT_NAMES.AUDIT_LOG,
      expect.objectContaining({
        action: AUDIT_ACTIONS.CREATE,
        resourceType: 'webhook',
        resourceId: '2',
      }),
    );
  });

  it('should delete a webhook and emit audit log', async () => {
    const beforeState = { id: '2', name: 'Hook 2' };
    mockRepository.getById.mockResolvedValue(beforeState as any);
    mockRepository.delete.mockResolvedValue({ id: '2' } as any);

    const result = await webhooksService.delete('2');

    expect(mockRepository.delete).toHaveBeenCalledWith('2');
    expect(result).toEqual({ id: '2' });
    expect(eventBus.emit).toHaveBeenCalledWith(
      EVENT_NAMES.AUDIT_LOG,
      expect.objectContaining({
        action: AUDIT_ACTIONS.DELETE,
        resourceType: 'webhook',
        resourceId: '2',
        beforeState,
      }),
    );
  });
});
