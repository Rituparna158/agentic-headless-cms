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

  describe('Workflow State Engine & Guards', () => {
    const multiStageWorkflow: WorkflowRecord = {
      id: 'wf-multi',
      name: 'Publishing Workflow',
      description: 'Multi-stage workflow',
      applicationId: 'app-1',
      isDefault: false,
      stages: [
        { id: 's1', name: 'Draft', slug: 'draft', order: 0, isInitial: true },
        { id: 's2', name: 'In Review', slug: 'in-review', order: 1 },
        {
          id: 's3',
          name: 'Approved',
          slug: 'approved',
          order: 2,
          isFinal: true,
        },
      ],
      transitions: [
        {
          id: 't1',
          name: 'Submit for Review',
          fromStage: 'draft',
          toStage: 'in-review',
        },
        {
          id: 't2',
          name: 'Approve',
          fromStage: 'in-review',
          toStage: 'approved',
          requiredRoleIds: ['admin', 'editor'],
        },
        {
          id: 't3',
          name: 'Request Changes',
          fromStage: 'in-review',
          toStage: 'draft',
        },
      ],
      assignedSchemaIds: ['schema-1'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should return no-workflow state when schema has no workflow assigned', async () => {
      mockRepository.getWorkflowBySchemaId.mockResolvedValue(null);

      const state = await workflowsService.getEntryWorkflowState(
        'entry-1',
        'schema-1',
        { id: 'user-1', roles: ['author'] },
        'app-1',
      );

      expect(state.hasWorkflow).toBe(false);
      expect(state.isFinal).toBe(true);
      expect(state.availableTransitions).toEqual([]);
    });

    it('should return entry workflow state with role-filtered transitions', async () => {
      mockRepository.getWorkflowBySchemaId.mockResolvedValue(
        multiStageWorkflow,
      );
      mockRepository.getEntryWorkflowState.mockResolvedValue({
        id: 'st-1',
        entryId: 'entry-1',
        workflowId: 'wf-multi',
        currentStage: 'in-review',
        applicationId: 'app-1',
        updatedByUserId: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Author role cannot approve
      const stateAuthor = await workflowsService.getEntryWorkflowState(
        'entry-1',
        'schema-1',
        { id: 'user-author', roles: ['author'] },
        'app-1',
      );
      expect(stateAuthor.hasWorkflow).toBe(true);
      expect(stateAuthor.currentStage?.slug).toBe('in-review');
      expect(stateAuthor.availableTransitions.map((t) => t.toStage)).toEqual([
        'draft',
      ]);

      // Editor role can approve and request changes
      const stateEditor = await workflowsService.getEntryWorkflowState(
        'entry-1',
        'schema-1',
        { id: 'user-editor', roles: ['editor'] },
        'app-1',
      );
      expect(stateEditor.availableTransitions.map((t) => t.toStage)).toEqual([
        'approved',
        'draft',
      ]);
    });

    it('should execute valid workflow transition and emit audit event', async () => {
      mockRepository.getWorkflowBySchemaId.mockResolvedValue(
        multiStageWorkflow,
      );
      mockRepository.getEntryWorkflowState.mockResolvedValue({
        id: 'st-1',
        entryId: 'entry-1',
        workflowId: 'wf-multi',
        currentStage: 'draft',
        applicationId: 'app-1',
        updatedByUserId: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      mockRepository.upsertEntryWorkflowState.mockResolvedValue({} as any);
      mockRepository.recordWorkflowHistory.mockResolvedValue({} as any);

      const updatedState = await workflowsService.transitionEntry(
        'entry-1',
        'schema-1',
        { toStage: 'in-review', comment: 'Ready for editorial review' },
        { id: 'user-author', roles: ['author'] },
        'app-1',
      );

      expect(mockRepository.upsertEntryWorkflowState).toHaveBeenCalledWith(
        expect.objectContaining({
          entryId: 'entry-1',
          workflowId: 'wf-multi',
          currentStage: 'in-review',
        }),
        'app-1',
      );
      expect(mockRepository.recordWorkflowHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          entryId: 'entry-1',
          workflowId: 'wf-multi',
          fromStage: 'draft',
          toStage: 'in-review',
          comment: 'Ready for editorial review',
        }),
        'app-1',
      );
      expect(eventBus.emit).toHaveBeenCalledWith(
        EVENT_NAMES.AUDIT_LOG,
        expect.objectContaining({
          action: AUDIT_ACTIONS.UPDATE,
          resourceType: 'workflow_transition',
          resourceId: 'entry-1',
        }),
      );
      expect(updatedState).toBeDefined();
    });

    it('should reject invalid workflow transition', async () => {
      mockRepository.getWorkflowBySchemaId.mockResolvedValue(
        multiStageWorkflow,
      );
      mockRepository.getEntryWorkflowState.mockResolvedValue({
        id: 'st-1',
        entryId: 'entry-1',
        workflowId: 'wf-multi',
        currentStage: 'draft',
        applicationId: 'app-1',
        updatedByUserId: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Cannot skip directly from draft to approved
      await expect(
        workflowsService.transitionEntry(
          'entry-1',
          'schema-1',
          { toStage: 'approved' },
          { id: 'user-author', roles: ['author'] },
          'app-1',
        ),
      ).rejects.toThrow();
    });

    it('should reject unauthorized role for restricted transition', async () => {
      mockRepository.getWorkflowBySchemaId.mockResolvedValue(
        multiStageWorkflow,
      );
      mockRepository.getEntryWorkflowState.mockResolvedValue({
        id: 'st-1',
        entryId: 'entry-1',
        workflowId: 'wf-multi',
        currentStage: 'in-review',
        applicationId: 'app-1',
        updatedByUserId: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Author role cannot approve (requires admin or editor)
      await expect(
        workflowsService.transitionEntry(
          'entry-1',
          'schema-1',
          { toStage: 'approved' },
          { id: 'user-author', roles: ['author'] },
          'app-1',
        ),
      ).rejects.toThrow();
    });

    it('should check publishing permission based on stage isFinal status', async () => {
      mockRepository.getWorkflowBySchemaId.mockResolvedValue(
        multiStageWorkflow,
      );

      // In draft (not final)
      mockRepository.getEntryWorkflowState.mockResolvedValueOnce({
        id: 'st-1',
        entryId: 'entry-1',
        workflowId: 'wf-multi',
        currentStage: 'draft',
        applicationId: 'app-1',
        updatedByUserId: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const canPublishDraft = await workflowsService.canPublish(
        'entry-1',
        'schema-1',
        'app-1',
      );
      expect(canPublishDraft).toBe(false);

      // In approved (isFinal: true)
      mockRepository.getEntryWorkflowState.mockResolvedValueOnce({
        id: 'st-2',
        entryId: 'entry-1',
        workflowId: 'wf-multi',
        currentStage: 'approved',
        applicationId: 'app-1',
        updatedByUserId: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const canPublishApproved = await workflowsService.canPublish(
        'entry-1',
        'schema-1',
        'app-1',
      );
      expect(canPublishApproved).toBe(true);
    });

    it('should retrieve workflow transition history', async () => {
      const mockHistory = [
        {
          id: 'h-1',
          entryId: 'entry-1',
          workflowId: 'wf-multi',
          fromStage: 'draft',
          toStage: 'in-review',
          action: 'Submit for Review',
          comment: 'First draft ready',
          actorType: 'user' as const,
          actorUserId: 'user-1',
          actorName: 'John Doe',
          actorEmail: 'john@example.com',
          applicationId: 'app-1',
          createdAt: new Date().toISOString(),
        },
      ];
      mockRepository.getWorkflowHistory.mockResolvedValue(mockHistory);

      const history = await workflowsService.getWorkflowHistory(
        'entry-1',
        'app-1',
      );

      expect(mockRepository.getWorkflowHistory).toHaveBeenCalledWith(
        'entry-1',
        'app-1',
      );
      expect(history).toEqual(mockHistory);
    });
  });
});
