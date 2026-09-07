import type { AuditAction } from './events.types.js';

export interface CreateAuditLogInput {
  actorType: 'user' | 'agent' | 'system';
  actorUserId?: string;
  actorAgentId?: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  context?: Record<string, unknown> | null;
}

export interface AuditLogRecord {
  id: string;
  applicationId: string;
  actorType: 'user' | 'agent' | 'system';
  actorUserId?: string | null;
  actorAgentId?: string | null;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  context?: Record<string, unknown> | null;
  timestamp: string | Date;
  actorEmail?: string | null;
  actorFirstName?: string | null;
  actorLastName?: string | null;
}

export interface GetAuditLogsQuery {
  page?: number;
  limit?: number;
  action?: string;
  resourceType?: string;
  actorUserId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface PaginatedAuditLogsResponse {
  data: AuditLogRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
