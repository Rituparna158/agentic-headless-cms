import { and, desc, eq, gte, lte, ilike, or, type SQL, sql } from 'drizzle-orm';
import {
  auditLogs,
  users,
  withTransaction,
  auditActionEnum,
} from '@repo/shared-db';
import { getDatabaseAdapter } from '@repo/config';
import { logger } from '@repo/logger';
import type {
  CreateAuditLogInput,
  GetAuditLogsQuery,
  PaginatedAuditLogsResponse,
  AuditLogRecord,
} from '@repo/types';
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
      await withTransaction(this.db, async (tx) => {
        return await tx.insert(auditLogs).values({
          actorType: input.actorType,
          actorUserId: input.actorUserId,
          actorAgentId: input.actorAgentId,
          action: input.action as (typeof auditActionEnum.enumValues)[number],
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          beforeState: input.beforeState,
          afterState: input.afterState,
          context: input.context,
        });
      });
      logger.debug('AuditRepository: audit log insert complete');
    } catch (error) {
      logger.error({ err: error }, 'AuditRepository Error in create:');
      throw new ApiError(500, REPO_ERRORS.CREATE_AUDIT_LOG_FAILED);
    }
  }

  async findMany(
    query: GetAuditLogsQuery = {},
  ): Promise<PaginatedAuditLogsResponse> {
    try {
      logger.info({ query }, 'AuditRepository: fetching audit logs');
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
      const offset = (page - 1) * limit;

      const conditions: SQL[] = [];

      if (query.action) {
        conditions.push(
          eq(
            auditLogs.action,
            query.action as (typeof auditActionEnum.enumValues)[number],
          ),
        );
      }
      if (query.resourceType) {
        conditions.push(eq(auditLogs.resourceType, query.resourceType));
      }
      if (query.actorUserId) {
        conditions.push(eq(auditLogs.actorUserId, query.actorUserId));
      }
      if (query.startDate) {
        conditions.push(gte(auditLogs.timestamp, new Date(query.startDate)));
      }
      if (query.endDate) {
        conditions.push(lte(auditLogs.timestamp, new Date(query.endDate)));
      }
      if (query.search) {
        const term = `%${query.search.trim()}%`;
        conditions.push(
          or(
            sql`cast(${auditLogs.resourceId} as text) ILIKE ${term}`,
            ilike(auditLogs.resourceType, term),
            sql`cast(${auditLogs.actorType} as text) ILIKE ${term}`,
            sql`cast(${auditLogs.action} as text) ILIKE ${term}`,
            sql`coalesce(${users.email}, '') ILIKE ${term}`,
            sql`coalesce(${users.firstName}, '') ILIKE ${term}`,
            sql`coalesce(${users.lastName}, '') ILIKE ${term}`,
          )!,
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const data = await withTransaction(this.db, async (tx) => {
        return await tx
          .select({
            id: auditLogs.id,
            applicationId: auditLogs.applicationId,
            actorType: auditLogs.actorType,
            actorUserId: auditLogs.actorUserId,
            actorAgentId: auditLogs.actorAgentId,
            action: auditLogs.action,
            resourceType: auditLogs.resourceType,
            resourceId: auditLogs.resourceId,
            beforeState: auditLogs.beforeState,
            afterState: auditLogs.afterState,
            context: auditLogs.context,
            timestamp: auditLogs.timestamp,
            actorEmail: users.email,
            actorFirstName: users.firstName,
            actorLastName: users.lastName,
          })
          .from(auditLogs)
          .leftJoin(users, eq(auditLogs.actorUserId, users.id))
          .where(whereClause)
          .limit(limit)
          .offset(offset)
          .orderBy(desc(auditLogs.timestamp));
      });

      const countResult = await withTransaction(this.db, async (tx) => {
        return await tx
          .select({ count: sql<number>`count(*)` })
          .from(auditLogs)
          .leftJoin(users, eq(auditLogs.actorUserId, users.id))
          .where(whereClause);
      });

      const total = Number(countResult[0]?.count || 0);
      const totalPages = Math.ceil(total / limit) || 1;

      return {
        data: data as AuditLogRecord[],
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error({ err: error }, 'AuditRepository Error in findMany:');
      throw new ApiError(500, 'Failed to fetch audit logs');
    }
  }

  async findById(id: string): Promise<AuditLogRecord | null> {
    try {
      logger.info({ id }, 'AuditRepository: fetching audit log by ID');
      const rows = await withTransaction(this.db, async (tx) => {
        return await tx
          .select({
            id: auditLogs.id,
            applicationId: auditLogs.applicationId,
            actorType: auditLogs.actorType,
            actorUserId: auditLogs.actorUserId,
            actorAgentId: auditLogs.actorAgentId,
            action: auditLogs.action,
            resourceType: auditLogs.resourceType,
            resourceId: auditLogs.resourceId,
            beforeState: auditLogs.beforeState,
            afterState: auditLogs.afterState,
            context: auditLogs.context,
            timestamp: auditLogs.timestamp,
            actorEmail: users.email,
            actorFirstName: users.firstName,
            actorLastName: users.lastName,
          })
          .from(auditLogs)
          .leftJoin(users, eq(auditLogs.actorUserId, users.id))
          .where(eq(auditLogs.id, id))
          .limit(1);
      });

      return (rows[0] as AuditLogRecord) || null;
    } catch (error) {
      logger.error({ err: error, id }, 'AuditRepository Error in findById:');
      throw new ApiError(500, 'Failed to fetch audit log by ID');
    }
  }
}
