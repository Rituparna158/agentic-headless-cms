import { auditLogs } from '@repo/shared-db';
import { getDatabaseAdapter } from '@repo/config';
import { logger } from '@repo/logger';
import type { CreateAuditLogInput } from '@repo/types';
import { ApiError } from '@repo/utils';
import { REPO_ERRORS } from './error-constants.js';

export class AuditRepository {
  private get db() {
    return getDatabaseAdapter().getDb();
  }

  async create(input: CreateAuditLogInput): Promise<void> {
    try {
      logger.info(
        {
          action: input.action,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
        },
        'AuditRepository: inserting audit log',
      );
      await this.db.insert(auditLogs).values({
        actorType: input.actorType,
        actorUserId: input.actorUserId,
        actorAgentId: input.actorAgentId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        beforeState: input.beforeState,
        afterState: input.afterState,
        context: input.context,
      });
      logger.debug('AuditRepository: audit log insert complete');
    } catch (error) {
      logger.error({ err: error }, 'AuditRepository Error in create:');
      throw new ApiError(500, REPO_ERRORS.CREATE_AUDIT_LOG_FAILED);
    }
  }
}
