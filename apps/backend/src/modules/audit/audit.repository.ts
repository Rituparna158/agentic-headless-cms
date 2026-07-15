import { auditLogs } from '@repo/shared-db';
import { getDatabaseAdapter } from '../../config/database.js';
import type { CreateAuditLogInput } from '../../types/audit.types.js';

export class AuditRepository {
  private get db() {
    return getDatabaseAdapter().getDb();
  }

  async create(input: CreateAuditLogInput): Promise<void> {
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
  }
}
