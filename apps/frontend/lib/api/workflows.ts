import type {
  WorkflowRecord,
  CreateWorkflowInput,
  UpdateWorkflowInput,
  BaseQueryOptions,
  PaginatedResult,
  EntryWorkflowState,
  TransitionEntryInput,
  WorkflowHistoryRecord,
  PendingReviewsResult,
} from '@repo/types';
import { API_PATHS } from '@/lib/constants/api-paths';
import { apiFetch, buildQueryString } from '@/lib/api-client';

export function listWorkflows(
  options?: BaseQueryOptions,
): Promise<PaginatedResult<WorkflowRecord>> {
  return apiFetch<PaginatedResult<WorkflowRecord>>(
    `${API_PATHS.WORKFLOWS.BASE()}${buildQueryString(options)}`,
  );
}

export function getWorkflowById(id: string): Promise<WorkflowRecord> {
  return apiFetch<WorkflowRecord>(API_PATHS.WORKFLOWS.BY_ID(id));
}

export function createWorkflow(
  input: CreateWorkflowInput,
): Promise<WorkflowRecord> {
  return apiFetch<WorkflowRecord>(API_PATHS.WORKFLOWS.BASE(), {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateWorkflow(
  id: string,
  input: UpdateWorkflowInput,
): Promise<WorkflowRecord> {
  return apiFetch<WorkflowRecord>(API_PATHS.WORKFLOWS.BY_ID(id), {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function deleteWorkflow(id: string): Promise<void> {
  return apiFetch<void>(API_PATHS.WORKFLOWS.BY_ID(id), {
    method: 'DELETE',
  });
}

export function assignWorkflowToSchema(
  workflowId: string,
  schemaId: string,
): Promise<void> {
  return apiFetch<void>(
    API_PATHS.WORKFLOWS.ASSIGN_SCHEMA(workflowId, schemaId),
    {
      method: 'POST',
    },
  );
}

export function removeWorkflowFromSchema(schemaId: string): Promise<void> {
  return apiFetch<void>(API_PATHS.WORKFLOWS.REMOVE_SCHEMA(schemaId), {
    method: 'DELETE',
  });
}

export function getWorkflowBySchemaId(
  schemaId: string,
): Promise<WorkflowRecord | null> {
  return apiFetch<WorkflowRecord | null>(
    API_PATHS.WORKFLOWS.BY_SCHEMA(schemaId),
  ).catch(() => null);
}

export function getEntryWorkflowState(
  schemaSlug: string,
  entryId: string,
): Promise<EntryWorkflowState> {
  return apiFetch<EntryWorkflowState>(
    API_PATHS.CONTENT.WORKFLOW_STATE(schemaSlug, entryId),
  );
}

export function updateEntryWorkflowMode(
  schemaSlug: string,
  entryId: string,
  requiresReview: boolean,
): Promise<EntryWorkflowState> {
  return apiFetch<EntryWorkflowState>(
    API_PATHS.CONTENT.WORKFLOW_MODE(schemaSlug, entryId),
    {
      method: 'PATCH',
      body: JSON.stringify({ requiresReview }),
    },
  );
}

export function transitionEntry(
  schemaSlug: string,
  entryId: string,
  input: TransitionEntryInput,
): Promise<EntryWorkflowState> {
  return apiFetch<EntryWorkflowState>(
    API_PATHS.CONTENT.TRANSITION(schemaSlug, entryId),
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function getWorkflowHistory(
  schemaSlug: string,
  entryId: string,
): Promise<WorkflowHistoryRecord[]> {
  return apiFetch<WorkflowHistoryRecord[]>(
    API_PATHS.CONTENT.WORKFLOW_HISTORY(schemaSlug, entryId),
  );
}

export function getActiveEntriesInStage(
  workflowId: string,
  stageSlug: string,
): Promise<{ count: number }> {
  return apiFetch<{ count: number }>(
    `/api/v1/workflows/${workflowId}/stages/${encodeURIComponent(stageSlug)}/active-entries`,
  );
}

export function getPendingReviews(limit = 20): Promise<PendingReviewsResult> {
  return apiFetch<PendingReviewsResult>(
    API_PATHS.WORKFLOWS.PENDING_REVIEWS(limit),
  );
}
