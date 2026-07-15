import { EVENT_NAMES, AUDIT_ACTIONS } from '../constants/events.constants.js';

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export interface AuditEventPayload {
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  actorUserId?: string;
  actorAgentId?: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  context?: Record<string, unknown> | null;
}

export interface AppEvents {
  [EVENT_NAMES.AUDIT_LOG]: (payload: AuditEventPayload) => void;
}
