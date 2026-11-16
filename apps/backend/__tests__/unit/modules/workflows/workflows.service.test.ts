import { describe, it, expect, vi, beforeEach, type Mocked } from 'vitest';
import { WorkflowsService } from '../../../../src/modules/workflows/workflows.service.js';
import { WorkflowsRepository } from '@repo/repository';
import { eventBus } from '@repo/events';
import { EVENT_NAMES, AUDIT_ACTIONS } from '@repo/constants';
import type {
  CreateWorkflowInput,
  UpdateWorkflowInput,
  WorkflowRecord,
} from '@repo/types';

vi.mock('@repo/repository');
vi.mock('@repo/events', () => ({
  eventBus: { emit: vi.fn() },
}));
vi.mock('../../../../src/utils/audit.js', () => ({
  getAuditContext: vi.fn().mockReturnValue({
    actorUserId: 'user-123',
    actorAgentId: null,
    context: { ip: '127.0.0.1' },
  }),
}));

describe('WorkflowsService', () => {
  let workflowsService: WorkflowsService;
  let mockRepository: Mocked<WorkflowsRepository>;

  const baseWorkflow: WorkflowRecord = {
    id: 'wf-1',
    name: 'Editorial Workflow',
    description: 'Standard workflow',
    applicationId: 'app-1',
    isDefault: false,
    stages: [{ id: 's1', name: 'Draft', slug: 'draft', order: 0 }],
    transitions: [],
    assignedSchemaIds: ['schema-1'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = new WorkflowsRepository() as Mocked<WorkflowsRepository>;
    workflowsService = new WorkflowsService(mockRepository);
  });

  it('should list workflows', async () => {
    mockRepository.list.mockResolvedValue([[baseWorkflow], 1]);

    const [result, total] = await workflowsService.list({}, 'app-1');

    expect(mockRepository.list).toHaveBeenCalledWith({}, 'app-1');
    expect(result).toEqual([baseWorkflow]);
    expect(total).toBe(1);
  });

  it('should get workflow by id', async () => {
    mockRepository.findById.mockResolvedValue(baseWorkflow);

    const result = await workflowsService.getById('wf-1', 'app-1');

    expect(mockRepository.findById).toHaveBeenCalledWith('wf-1', 'app-1');
    expect(result).toEqual(baseWorkflow);
  });

  it('should create a workflow and emit audit log', async () => {
    const input: CreateWorkflowInput = {
      name: 'Review Workflow',
      stages: [
        { id: '1', name: 'Draft', slug: 'draft', order: 0 },
        { id: '2', name: 'Approved', slug: 'approved', order: 1 },
      ],
      transitions: [
        { id: 't1', name: 'Approve', fromStage: 'draft', toStage: 'approved' },
      ],
    };
    const created: WorkflowRecord = {
      ...baseWorkflow,
      id: 'wf-2',
      name: input.name,
      stages: input.stages,
      transitions: input.transitions,
      assignedSchemaIds: [],
    };
    mockRepository.create.mockResolvedValue(created);

    const result = await workflowsService.create(input, 'app-1');

    expect(mockRepository.create).toHaveBeenCalledWith(input, 'app-1');
    expect(result).toEqual(created);
    expect(eventBus.emit).toHaveBeenCalledWith(
      EVENT_NAMES.AUDIT_LOG,
      expect.objectContaining({
        action: AUDIT_ACTIONS.CREATE,
        resourceType: 'workflow',
        resourceId: 'wf-2',
      }),
    );
  });

  it('should update a workflow and emit audit log', async () => {
    const updateInput: UpdateWorkflowInput = {
      name: 'Updated Review Workflow',
    };
    const updated: WorkflowRecord = {
      ...baseWorkflow,
      name: 'Updated Review Workflow',
    };

    mockRepository.findById.mockResolvedValue(baseWorkflow);
    mockRepository.update.mockResolvedValue(updated);

    const result = await workflowsService.update('wf-1', updateInput, 'app-1');

    expect(mockRepository.update).toHaveBeenCalledWith(
      'wf-1',
      updateInput,
      'app-1',
    );
    expect(result).toEqual(updated);
    expect(eventBus.emit).toHaveBeenCalledWith(
      EVENT_NAMES.AUDIT_LOG,
      expect.objectContaining({
        action: AUDIT_ACTIONS.UPDATE,
        resourceType: 'workflow',
        resourceId: 'wf-1',
      }),
    );
  });

  it('should delete a workflow and emit audit log', async () => {
    mockRepository.findById.mockResolvedValue(baseWorkflow);
    mockRepository.delete.mockResolvedValue(true);

    const result = await workflowsService.delete('wf-1', 'app-1');

    expect(mockRepository.delete).toHaveBeenCalledWith('wf-1', 'app-1');
    expect(result).toBe(true);
    expect(eventBus.emit).toHaveBeenCalledWith(
      EVENT_NAMES.AUDIT_LOG,
      expect.objectContaining({
        action: AUDIT_ACTIONS.DELETE,
        resourceType: 'workflow',
        resourceId: 'wf-1',
      }),
    );
  });

  it('should assign a workflow to a content schema', async () => {
    mockRepository.assignToSchema.mockResolvedValue(undefined);

    await workflowsService.assignToSchema('wf-1', 'schema-123', 'app-1');

    expect(mockRepository.assignToSchema).toHaveBeenCalledWith(
      'wf-1',
      'schema-123',
      'app-1',
    );
    expect(eventBus.emit).toHaveBeenCalledWith(
      EVENT_NAMES.AUDIT_LOG,
      expect.objectContaining({
        action: AUDIT_ACTIONS.UPDATE,
        resourceType: 'workflow_schema_assignment',
        resourceId: 'schema-123',
      }),
    );
  });

  it('should remove a workflow from a content schema', async () => {
    mockRepository.removeFromSchema.mockResolvedValue(undefined);

    await workflowsService.removeFromSchema('schema-123', 'app-1');

    expect(mockRepository.removeFromSchema).toHaveBeenCalledWith(
      'schema-123',
      'app-1',
    );
    expect(eventBus.emit).toHaveBeenCalledWith(
      EVENT_NAMES.AUDIT_LOG,
      expect.objectContaining({
        action: AUDIT_ACTIONS.UPDATE,
        resourceType: 'workflow_schema_assignment',
        resourceId: 'schema-123',
      }),
    );
  });

  it('should get workflow by schema id', async () => {
    mockRepository.getWorkflowBySchemaId.mockResolvedValue(baseWorkflow);

    const result = await workflowsService.getWorkflowBySchemaId(
      'schema-123',
      'app-1',
    );

    expect(mockRepository.getWorkflowBySchemaId).toHaveBeenCalledWith(
      'schema-123',
      'app-1',
    );
    expect(result).toEqual(baseWorkflow);
  });
});
