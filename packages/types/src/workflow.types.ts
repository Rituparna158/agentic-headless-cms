export interface WorkflowStage {
  id: string;
  name: string;
  slug: string;
  color?: string;
  order: number;
  isInitial?: boolean;
  isFinal?: boolean;
}

export interface WorkflowTransition {
  id: string;
  name: string;
  fromStage: string;
  toStage: string;
  requiredRoleIds?: string[];
}

export interface CreateWorkflowInput {
  name: string;
  description?: string | null;
  isDefault?: boolean;
  stages: WorkflowStage[];
  transitions: WorkflowTransition[];
  schemaIds?: string[];
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string | null;
  isDefault?: boolean;
  stages?: WorkflowStage[];
  transitions?: WorkflowTransition[];
  schemaIds?: string[];
}

export interface WorkflowRecord {
  id: string;
  name: string;
  description: string | null;
  applicationId: string;
  isDefault: boolean;
  stages: WorkflowStage[];
  transitions: WorkflowTransition[];
  assignedSchemaIds?: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface SchemaWorkflowAssignment {
  id: string;
  workflowId: string;
  schemaId: string;
  applicationId: string;
  createdAt: string | Date;
}

export interface TransitionEntryInput {
  toStage: string;
  comment?: string;
}

export interface EntryWorkflowState {
  hasWorkflow: boolean;
  workflow: {
    id: string;
    name: string;
  } | null;
  currentStage: WorkflowStage | null;
  availableTransitions: WorkflowTransition[];
  isFinal: boolean;
}

export interface ContentWorkflowStateRecord {
  id: string;
  entryId: string;
  workflowId: string;
  currentStage: string;
  applicationId: string;
  updatedByUserId?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface WorkflowHistoryRecord {
  id: string;
  entryId: string;
  workflowId: string;
  fromStage: string;
  toStage: string;
  action?: string | null;
  comment?: string | null;
  actorType: 'user' | 'agent' | 'system';
  actorUserId?: string | null;
  applicationId: string;
  createdAt: string | Date;
}
