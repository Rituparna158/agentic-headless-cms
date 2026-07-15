import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { eventBus } from '../../../src/common/events/event-bus.js';
import { AuditRepository } from '../../../src/modules/audit/audit.repository.js';
import { setupAuditListener } from '../../../src/modules/audit/audit.listener.js';
import { logger } from '../../../src/common/logger.js';

vi.mock('../../../src/modules/audit/audit.repository.js', () => {
  const AuditRepository = vi.fn();
  AuditRepository.prototype.create = vi.fn();
  return { AuditRepository };
});

vi.mock('../../../src/common/logger.js', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('Audit Listener', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eventBus.removeAllListeners('audit.log');
    setupAuditListener();
  });

  afterEach(() => {
    eventBus.removeAllListeners('audit.log');
  });

  it('saves an audit log when an event is emitted', async () => {
    const payload = {
      action: 'create' as const,
      resourceType: 'content',
      resourceId: 'content-123',
      actorUserId: 'user-123',
      afterState: { title: 'Hello World' },
    };

    eventBus.emit('audit.log', payload);

    await new Promise(process.nextTick);

    expect(AuditRepository.prototype.create).toHaveBeenCalledTimes(1);
    expect(AuditRepository.prototype.create).toHaveBeenCalledWith({
      actorType: 'user',
      actorUserId: 'user-123',
      actorAgentId: undefined,
      action: 'create',
      resourceType: 'content',
      resourceId: 'content-123',
      beforeState: undefined,
      afterState: { title: 'Hello World' },
      context: undefined,
    });
  });

  it('logs an error but does not crash if the repository fails', async () => {
    const error = new Error('DB connection failed');
    vi.mocked(AuditRepository.prototype.create).mockRejectedValueOnce(error);

    eventBus.emit('audit.log', {
      action: 'delete' as const,
      resourceType: 'schema',
      resourceId: 'schema-123',
      actorUserId: 'user-123',
    });

    await new Promise(process.nextTick);

    expect(AuditRepository.prototype.create).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: error }),
      'Failed to persist audit log',
    );
  });
});
