import { eventBus } from './event-bus.js';
import { EVENT_NAMES } from '@repo/constants';
import { AuditRepository } from '@repo/repository';
import { getRedisConnection } from '@repo/config';
import { contextStorage } from '@repo/context';

export function setupAuditListener() {
  const repository = new AuditRepository();

  eventBus.on(EVENT_NAMES.AUDIT_LOG, (payload) => {
    void (async () => {
      try {
        const store = contextStorage.getStore();
        const applicationId = payload.applicationId || store?.applicationId;

        await repository.create({
          applicationId,
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

        // Invalidate Redis Page 1 audit cache on new log insertion
        try {
          const redis = getRedisConnection();
          const keysToDelete = ['audit:logs:default_page1'];
          if (applicationId) {
            keysToDelete.push(`audit:logs:${applicationId}:default_page1`);
          }
          await redis.del(...keysToDelete);
        } catch {
          // ignore cache error if Redis is unavailable
        }
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
