import { eventBus } from './event-bus.js';
import { EVENT_NAMES } from '@repo/constants';
import { AuditRepository } from '@repo/repository';

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
        console.error(
          JSON.stringify({
            level: 'FATAL',
            message: 'Async Audit Log Insertion Failed',
            error: error instanceof Error ? error.message : String(error),
            droppedPayload: payload,
          }),
        );
      }
    })();
  });
}
