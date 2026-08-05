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
