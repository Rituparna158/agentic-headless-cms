import { z } from 'zod';

export const auditLogRecordSchema = z
  .object({
    id: z.string(),
    action: z.string(),
    resourceType: z.string(),
    resourceId: z.string().nullable().optional(),
    actorType: z.string(),
    actorUserId: z.string().nullable().optional(),
    actorEmail: z.string().nullable().optional(),
    actorName: z.string().nullable().optional(),
    ipAddress: z.string().nullable().optional(),
    userAgent: z.string().nullable().optional(),
    diff: z.unknown().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
    createdAt: z.string(),
  })
  .loose();

export const paginatedAuditLogsResponseSchema = z
  .object({
    data: z.array(auditLogRecordSchema),
    meta: z
      .object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
      })
      .loose(),
  })
  .loose();
