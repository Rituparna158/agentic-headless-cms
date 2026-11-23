import { EVENT_NAMES, AUDIT_ACTIONS } from '@repo/constants';

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
  applicationId?: string;
}

export interface MediaUploadedEventPayload {
  assetId: string;
  storageKey: string;
  mimeType: string;
}

export interface WorkflowTransitionEventPayload {
  workflowId: string;
  schemaId: string;
  entryId: string;
  previousStage: string;
  currentStage: string;
  action: string;
  comment?: string;
  actorUserId?: string;
  actorAgentId?: string;
  timestamp: string;
  applicationId?: string;
}

export interface AppEvents {
  [EVENT_NAMES.AUDIT_LOG]: (payload: AuditEventPayload) => void;
  [EVENT_NAMES.MEDIA_UPLOADED]: (payload: MediaUploadedEventPayload) => void;
  [EVENT_NAMES.WORKFLOW_TRANSITION]: (
    payload: WorkflowTransitionEventPayload,
  ) => void;
  [EVENT_NAMES.WORKFLOW_REVIEW_REQUESTED]: (
    payload: WorkflowTransitionEventPayload,
  ) => void;
  [EVENT_NAMES.WORKFLOW_APPROVED]: (
    payload: WorkflowTransitionEventPayload,
  ) => void;
  [EVENT_NAMES.WORKFLOW_CHANGES_REQUESTED]: (
    payload: WorkflowTransitionEventPayload,
  ) => void;
}
