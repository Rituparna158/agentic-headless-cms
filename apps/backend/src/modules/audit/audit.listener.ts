import { eventBus } from '../../common/events/event-bus.js';
import { EVENT_NAMES } from '../../constants/events.constants.js';
import { AuditRepository } from './audit.repository.js';
import { logger } from '../../common/logger.js';

export function setupAuditListener() {
  const repository = new AuditRepository();

  eventBus.on(EVENT_NAMES.AUDIT_LOG, (payload) => {
    void (async () => {
      try {
        await repository.create({
          actorType: payload.actorUserId
            ? 'user'
            : payload.actorAgentId
              ? 'agent'
              : 'system',
          actorUserId: payload.actorUserId,
          actorAgentId: payload.actorAgentId,
          action: payload.action,
          resourceType: payload.resourceType,
          resourceId: payload.resourceId,
          beforeState: payload.beforeState,
          afterState: payload.afterState,
          context: payload.context,
        });
      } catch (error) {
        logger.error({ err: error, payload }, 'Failed to persist audit log');
      }
    })();
  });
}
