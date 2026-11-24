import { describe, it, expect, vi, beforeEach, type Mocked } from 'vitest';
import { ConflictError } from '@repo/utils';
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
vi.mock(
  '../../../../src/modules/webhooks/webhook-dispatcher.service.js',
  () => {
    class MockWebhookDispatcherService {
      dispatch = vi.fn().mockResolvedValue(undefined);
    }
    return {
      WebhookDispatcherService: MockWebhookDispatcherService,
    };
  },
);
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
    mockRepository.findById.mockResolvedValue({
      ...baseWorkflow,
      assignedSchemaIds: [],
      isDefault: false,
    });
    mockRepository.countActiveEntriesForWorkflow.mockResolvedValue(0);
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

  it('should block deleting workflow if assigned to content types (safe deletion)', async () => {
    mockRepository.findById.mockResolvedValue({
      ...baseWorkflow,
      assignedSchemaIds: ['schema-1', 'schema-2'],
    });

    await expect(workflowsService.delete('wf-1', 'app-1')).rejects.toThrowError(
      /Cannot delete workflow because it is currently assigned to 2 content types/,
    );
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });

  it('should block deleting default workflow pipeline (safe deletion)', async () => {
    mockRepository.findById.mockResolvedValue({
      ...baseWorkflow,
      assignedSchemaIds: [],
      isDefault: true,
    });

    await expect(workflowsService.delete('wf-1', 'app-1')).rejects.toThrowError(
      /Cannot delete the default workflow pipeline/,
    );
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });

  it('should block deleting workflow if active entries are governed by it (safe deletion)', async () => {
    mockRepository.findById.mockResolvedValue({
      ...baseWorkflow,
      assignedSchemaIds: [],
      isDefault: false,
    });
    mockRepository.countActiveEntriesForWorkflow.mockResolvedValue(3);

    await expect(workflowsService.delete('wf-1', 'app-1')).rejects.toThrowError(
      /Cannot delete workflow because 3 active content entries are currently governed by it/,
    );
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });

  it('should block updating workflow when removing a stage that has active content entries (safe stage deletion)', async () => {
    const multiStageWf: WorkflowRecord = {
      ...baseWorkflow,
      stages: [
        { id: 's1', name: 'Draft', slug: 'draft', order: 0 },
        { id: 's2', name: 'In Review', slug: 'in_review', order: 1 },
        { id: 's3', name: 'Approved', slug: 'approved', order: 2 },
      ],
    };

    mockRepository.findById.mockResolvedValue(multiStageWf);
    mockRepository.countActiveEntriesInStage.mockResolvedValue(2);

    const updateWithoutReview: UpdateWorkflowInput = {
      stages: [
        { id: 's1', name: 'Draft', slug: 'draft', order: 0 },
        { id: 's3', name: 'Approved', slug: 'approved', order: 1 },
      ],
    };

    await expect(
      workflowsService.update('wf-1', updateWithoutReview, 'app-1'),
    ).rejects.toThrowError(
      /Cannot delete stage "In Review" because 2 active content entries are currently sitting in this stage/,
    );
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it('should allow updating workflow when removing a stage with 0 active content entries', async () => {
    const multiStageWf: WorkflowRecord = {
      ...baseWorkflow,
      stages: [
        { id: 's1', name: 'Draft', slug: 'draft', order: 0 },
        { id: 's2', name: 'In Review', slug: 'in_review', order: 1 },
      ],
    };

    mockRepository.findById.mockResolvedValue(multiStageWf);
    mockRepository.countActiveEntriesInStage.mockResolvedValue(0);
    mockRepository.update.mockResolvedValue({
      ...multiStageWf,
      stages: [{ id: 's1', name: 'Draft', slug: 'draft', order: 0 }],
    });

    const updateInput: UpdateWorkflowInput = {
      stages: [{ id: 's1', name: 'Draft', slug: 'draft', order: 0 }],
    };

    const res = await workflowsService.update('wf-1', updateInput, 'app-1');
    expect(mockRepository.update).toHaveBeenCalled();
    expect(res.stages).toHaveLength(1);
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
      expect(eventBus.emit).toHaveBeenCalledWith(
        EVENT_NAMES.WORKFLOW_TRANSITION,
        expect.objectContaining({
          workflowId: 'wf-multi',
          schemaId: 'schema-1',
          entryId: 'entry-1',
          previousStage: 'draft',
          currentStage: 'in-review',
          action: 'Submit for Review',
          comment: 'Ready for editorial review',
          actorUserId: 'user-author',
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

    it('should prevent author from self-approving their own entry (four-eyes principle)', async () => {
      mockRepository.getWorkflowBySchemaId.mockResolvedValue(
        multiStageWorkflow,
      );
      mockRepository.getEntryWorkflowState.mockResolvedValue({
        id: 'st-1',
        entryId: 'entry-1',
        workflowId: 'wf-multi',
        currentStage: 'in-review',
        applicationId: 'app-1',
        updatedByUserId: 'user-author',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      // The entry creator is 'user-author'
      mockRepository.getEntryCreatorUserId.mockResolvedValue('user-author');

      // 'user-author' also has 'editor' role, but cannot approve their own submission
      await expect(
        workflowsService.transitionEntry(
          'entry-1',
          'schema-1',
          { toStage: 'approved' },
          { id: 'user-author', roles: ['editor'] },
          'app-1',
        ),
      ).rejects.toThrow(
        'You cannot approve your own submission; another editor must review it',
      );
    });

    it('should hide approval and review transitions from creator in availableTransitions', async () => {
      mockRepository.getWorkflowBySchemaId.mockResolvedValue(
        multiStageWorkflow,
      );
      mockRepository.getEntryWorkflowState.mockResolvedValue({
        id: 'st-1',
        entryId: 'entry-1',
        workflowId: 'wf-multi',
        currentStage: 'in-review',
        applicationId: 'app-1',
        updatedByUserId: 'user-author',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      mockRepository.getEntryCreatorUserId.mockResolvedValue('user-author');

      // Creator with editor role should have NO reviewer actions available on their own entry in review
      const state = await workflowsService.getEntryWorkflowState(
        'entry-1',
        'schema-1',
        { id: 'user-author', roles: ['editor', 'admin'] },
        'app-1',
      );

      expect(state.availableTransitions).toEqual([]);
    });

    it('should prevent creator from reviewing or requesting changes on their own submission', async () => {
      mockRepository.getWorkflowBySchemaId.mockResolvedValue(
        multiStageWorkflow,
      );
      mockRepository.getEntryWorkflowState.mockResolvedValue({
        id: 'st-1',
        entryId: 'entry-1',
        workflowId: 'wf-multi',
        currentStage: 'in-review',
        applicationId: 'app-1',
        updatedByUserId: 'user-author',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      mockRepository.getEntryCreatorUserId.mockResolvedValue('user-author');

      await expect(
        workflowsService.transitionEntry(
          'entry-1',
          'schema-1',
          { toStage: 'draft', comment: 'Self change request' },
          { id: 'user-author', roles: ['editor', 'admin'] },
          'app-1',
        ),
      ).rejects.toThrow(
        'You cannot review or request changes on your own submission; another editor must review it',
      );
    });

    it('should allow another editor to approve the entry when creator is different', async () => {
      mockRepository.getWorkflowBySchemaId.mockResolvedValue(
        multiStageWorkflow,
      );
      mockRepository.getEntryWorkflowState.mockResolvedValue({
        id: 'st-1',
        entryId: 'entry-1',
        workflowId: 'wf-multi',
        currentStage: 'in-review',
        applicationId: 'app-1',
        updatedByUserId: 'user-author',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      mockRepository.getEntryCreatorUserId.mockResolvedValue('user-author');
      mockRepository.upsertEntryWorkflowState.mockResolvedValue({} as any);
      mockRepository.recordWorkflowHistory.mockResolvedValue({} as any);

      // 'user-editor' is a different user
      const result = await workflowsService.transitionEntry(
        'entry-1',
        'schema-1',
        { toStage: 'approved' },
        { id: 'user-editor', roles: ['editor'] },
        'app-1',
      );

      expect(result).toBeDefined();
      expect(mockRepository.upsertEntryWorkflowState).toHaveBeenCalledWith(
        expect.objectContaining({
          entryId: 'entry-1',
          currentStage: 'approved',
          updatedByUserId: 'user-editor',
        }),
        'app-1',
      );
    });

    it('should prevent original creator from approving an entry even if submitted by another editor (strict four-eyes principle)', async () => {
      mockRepository.getWorkflowBySchemaId.mockResolvedValue(
        multiStageWorkflow,
      );
      mockRepository.getEntryWorkflowState.mockResolvedValue({
        id: 'st-1',
        entryId: 'entry-1',
        workflowId: 'wf-multi',
        currentStage: 'in-review',
        applicationId: 'app-1',
        updatedByUserId: 'user-editor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      mockRepository.getEntryCreatorUserId.mockResolvedValue('user-admin');

      // 1. In getEntryWorkflowState, creator should have no approval transitions and isSelfReviewer=true
      const state = await workflowsService.getEntryWorkflowState(
        'entry-1',
        'schema-1',
        { id: 'user-admin', roles: ['admin'] },
        'app-1',
      );
      expect(state.isSelfReviewer).toBe(true);
      expect(state.availableTransitions).toEqual([]);

      // 2. In transitionEntry, creator attempting to approve must be blocked
      await expect(
        workflowsService.transitionEntry(
          'entry-1',
          'schema-1',
          { toStage: 'approved' },
          { id: 'user-admin', roles: ['admin'] },
          'app-1',
        ),
      ).rejects.toThrow(
        'You cannot approve your own entry; another editor must review it',
      );
    });

    it('should allow an independent third party (neither creator nor submitter) to approve', async () => {
      mockRepository.getWorkflowBySchemaId.mockResolvedValue(
        multiStageWorkflow,
      );
      mockRepository.getEntryWorkflowState.mockResolvedValue({
        id: 'st-1',
        entryId: 'entry-1',
        workflowId: 'wf-multi',
        currentStage: 'in-review',
        applicationId: 'app-1',
        updatedByUserId: 'user-editor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      mockRepository.getEntryCreatorUserId.mockResolvedValue('user-admin');
      mockRepository.upsertEntryWorkflowState.mockResolvedValue({} as any);
      mockRepository.recordWorkflowHistory.mockResolvedValue({} as any);

      // 'user-reviewer' is neither the creator ('user-admin') nor the submitter ('user-editor')
      const result = await workflowsService.transitionEntry(
        'entry-1',
        'schema-1',
        { toStage: 'approved' },
        { id: 'user-reviewer', roles: ['editor'] },
        'app-1',
      );

      expect(result).toBeDefined();
      expect(mockRepository.upsertEntryWorkflowState).toHaveBeenCalledWith(
        expect.objectContaining({
          entryId: 'entry-1',
          currentStage: 'approved',
          updatedByUserId: 'user-reviewer',
        }),
        'app-1',
      );
    });

    it('should require a mandatory comment when requesting changes or rejecting', async () => {
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

      // Attempt transition from in-review back to draft without comment
      await expect(
        workflowsService.transitionEntry(
          'entry-1',
          'schema-1',
          { toStage: 'draft', comment: '   ' },
          { id: 'user-editor', roles: ['editor'] },
          'app-1',
        ),
      ).rejects.toThrow(
        'A comment explaining the required changes or reason for rejection is mandatory',
      );
    });

    it('should allow requesting changes when a non-empty feedback comment is provided', async () => {
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
      mockRepository.upsertEntryWorkflowState.mockResolvedValue({} as any);
      mockRepository.recordWorkflowHistory.mockResolvedValue({} as any);

      const result = await workflowsService.transitionEntry(
        'entry-1',
        'schema-1',
        {
          toStage: 'draft',
          comment: 'Please add supporting references in section 2.',
        },
        { id: 'user-editor', roles: ['editor'] },
        'app-1',
      );

      expect(result).toBeDefined();
      expect(mockRepository.recordWorkflowHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'Request Changes',
          comment: 'Please add supporting references in section 2.',
        }),
        'app-1',
      );
    });

    it('should auto-demote entry in review back to draft when content is edited', async () => {
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
      mockRepository.upsertEntryWorkflowState.mockResolvedValue({} as any);
      mockRepository.recordWorkflowHistory.mockResolvedValue({} as any);

      const result = await workflowsService.handleContentUpdated(
        'entry-1',
        'schema-1',
        { id: 'user-author' },
        'app-1',
      );

      expect(result.demoted).toBe(true);
      expect(result.fromStage).toBe('in-review');
      expect(result.toStage).toBe('draft');
      expect(mockRepository.upsertEntryWorkflowState).toHaveBeenCalledWith(
        expect.objectContaining({
          entryId: 'entry-1',
          currentStage: 'draft',
          updatedByUserId: 'user-author',
        }),
        'app-1',
      );
      expect(mockRepository.recordWorkflowHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'Auto-Demoted on Edit',
          fromStage: 'in-review',
          toStage: 'draft',
        }),
        'app-1',
      );
    });

    it('should not auto-demote entry if already in initial draft stage', async () => {
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

      const result = await workflowsService.handleContentUpdated(
        'entry-1',
        'schema-1',
        { id: 'user-author' },
        'app-1',
      );

      expect(result.demoted).toBe(false);
      expect(mockRepository.upsertEntryWorkflowState).not.toHaveBeenCalled();
    });
  });

  describe('handleEntryUnpublished (Unpublish state reset)', () => {
    it('should reset entry workflow stage back to initial draft upon unpublishing', async () => {
      mockRepository.getWorkflowBySchemaId.mockResolvedValue(
        multiStageWorkflow,
      );
      mockRepository.getEntryWorkflowState.mockResolvedValue({
        id: 'st-1',
        entryId: 'entry-1',
        workflowId: 'wf-multi',
        currentStage: 'approved',
        applicationId: 'app-1',
        updatedByUserId: 'user-approver',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const result = await workflowsService.handleEntryUnpublished(
        'entry-1',
        'schema-1',
        { id: 'user-unpublisher' },
        'app-1',
      );

      expect(result.reset).toBe(true);
      expect(result.fromStage).toBe('approved');
      expect(result.toStage).toBe('draft');
      expect(mockRepository.upsertEntryWorkflowState).toHaveBeenCalledWith(
        expect.objectContaining({
          entryId: 'entry-1',
          currentStage: 'draft',
          updatedByUserId: 'user-unpublisher',
        }),
        'app-1',
      );
      expect(mockRepository.recordWorkflowHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'Reset on Unpublish',
          fromStage: 'approved',
          toStage: 'draft',
          actorUserId: 'user-unpublisher',
        }),
        'app-1',
      );
    });

    it('should reset entry workflow stage with fromStage published if entry was in draft or untracked', async () => {
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

      const result = await workflowsService.handleEntryUnpublished(
        'entry-1',
        'schema-1',
        { id: 'user-unpublisher' },
        'app-1',
      );

      expect(result.reset).toBe(true);
      expect(result.fromStage).toBe('published');
      expect(result.toStage).toBe('draft');
      expect(mockRepository.upsertEntryWorkflowState).toHaveBeenCalled();
      expect(mockRepository.recordWorkflowHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'Reset on Unpublish',
          fromStage: 'published',
          toStage: 'draft',
        }),
        'app-1',
      );
    });
  });

  describe('Part 3: Granular Event Dispatch on Transitions', () => {
    it('should emit workflow.review_requested when moving entry to review stage', async () => {
      mockRepository.getWorkflowBySchemaId.mockResolvedValue(
        multiStageWorkflow,
      );
      mockRepository.getEntryWorkflowState.mockResolvedValue({
        id: 'st-1',
        entryId: 'entry-1',
        workflowId: 'wf-multi',
        currentStage: 'draft',
        applicationId: 'app-1',
        updatedByUserId: 'user-creator',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      mockRepository.getEntryCreatorUserId.mockResolvedValue('user-creator');

      await workflowsService.transitionEntry(
        'entry-1',
        'schema-1',
        { toStage: 'in-review' },
        { id: 'user-creator', roles: ['author'] },
        'app-1',
      );

      expect(eventBus.emit).toHaveBeenCalledWith(
        EVENT_NAMES.WORKFLOW_REVIEW_REQUESTED,
        expect.objectContaining({
          workflowId: 'wf-multi',
          schemaId: 'schema-1',
          entryId: 'entry-1',
          currentStage: 'in-review',
        }),
      );
    });

    it('should emit workflow.approved when moving entry to approved final stage', async () => {
      mockRepository.getWorkflowBySchemaId.mockResolvedValue(
        multiStageWorkflow,
      );
      mockRepository.getEntryWorkflowState.mockResolvedValue({
        id: 'st-1',
        entryId: 'entry-1',
        workflowId: 'wf-multi',
        currentStage: 'in-review',
        applicationId: 'app-1',
        updatedByUserId: 'user-creator',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      mockRepository.getEntryCreatorUserId.mockResolvedValue('user-creator');

      // Another user (editor) approves
      await workflowsService.transitionEntry(
        'entry-1',
        'schema-1',
        { toStage: 'approved' },
        { id: 'user-editor', roles: ['editor'] },
        'app-1',
      );

      expect(eventBus.emit).toHaveBeenCalledWith(
        EVENT_NAMES.WORKFLOW_APPROVED,
        expect.objectContaining({
          workflowId: 'wf-multi',
          schemaId: 'schema-1',
          entryId: 'entry-1',
          currentStage: 'approved',
        }),
      );
    });

    it('should emit workflow.changes_requested when changes are requested with feedback', async () => {
      mockRepository.getWorkflowBySchemaId.mockResolvedValue(
        multiStageWorkflow,
      );
      mockRepository.getEntryWorkflowState.mockResolvedValue({
        id: 'st-1',
        entryId: 'entry-1',
        workflowId: 'wf-multi',
        currentStage: 'in-review',
        applicationId: 'app-1',
        updatedByUserId: 'user-creator',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      mockRepository.getEntryCreatorUserId.mockResolvedValue('user-creator');

      // Editor requests changes back to draft
      await workflowsService.transitionEntry(
        'entry-1',
        'schema-1',
        { toStage: 'draft', comment: 'Please revise headline.' },
        { id: 'user-editor', roles: ['editor'] },
        'app-1',
      );

      expect(eventBus.emit).toHaveBeenCalledWith(
        EVENT_NAMES.WORKFLOW_CHANGES_REQUESTED,
        expect.objectContaining({
          workflowId: 'wf-multi',
          schemaId: 'schema-1',
          entryId: 'entry-1',
          currentStage: 'draft',
          comment: 'Please revise headline.',
        }),
      );
    });

    it('should fetch pending reviews from repository', async () => {
      const mockPending = {
        total: 1,
        items: [
          {
            entryId: 'entry-1',
            schemaId: 'schema-1',
            schemaName: 'Articles',
            schemaSlug: 'articles',
            currentStage: 'in-review',
            stageName: 'In Review',
            title: 'Sample Article',
            updatedAt: new Date().toISOString(),
          },
        ],
      };
      mockRepository.getPendingReviews = vi.fn().mockResolvedValue(mockPending);

      const result = await workflowsService.getPendingReviews('app-1', 10);
      expect(result).toEqual(mockPending);
      expect(mockRepository.getPendingReviews).toHaveBeenCalledWith(
        'app-1',
        10,
      );
    });
  });

  describe('Part 4: Optimistic Locking on State Transitions', () => {
    it('should allow transition when expectedStage matches the current stage in database', async () => {
      mockRepository.getWorkflowBySchemaId.mockResolvedValue(
        multiStageWorkflow,
      );
      mockRepository.getEntryWorkflowState
        .mockResolvedValueOnce({
          id: 'st-1',
          entryId: 'entry-1',
          workflowId: 'wf-multi',
          currentStage: 'in-review',
          applicationId: 'app-1',
          updatedByUserId: 'user-creator',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          id: 'st-1',
          entryId: 'entry-1',
          workflowId: 'wf-multi',
          currentStage: 'approved',
          applicationId: 'app-1',
          updatedByUserId: 'user-reviewer',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      mockRepository.getEntryCreatorUserId.mockResolvedValue('user-creator');
      mockRepository.upsertEntryWorkflowState.mockResolvedValue({
        id: 'st-1',
        entryId: 'entry-1',
        workflowId: 'wf-multi',
        currentStage: 'approved',
        applicationId: 'app-1',
        updatedByUserId: 'user-reviewer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      mockRepository.recordWorkflowHistory.mockResolvedValue({
        id: 'hist-1',
        entryId: 'entry-1',
        workflowId: 'wf-multi',
        fromStage: 'in-review',
        toStage: 'approved',
        action: 'transition',
        comment: null,
        actorType: 'user',
        actorUserId: 'user-reviewer',
        applicationId: 'app-1',
        createdAt: new Date().toISOString(),
      });

      const result = await workflowsService.transitionEntry(
        'entry-1',
        'schema-1',
        { toStage: 'approved', expectedStage: 'in-review' },
        { id: 'user-reviewer', roles: ['editor'] },
        'app-1',
      );

      expect(result.currentStage?.slug).toBe('approved');
      expect(mockRepository.upsertEntryWorkflowState).toHaveBeenCalledWith(
        expect.objectContaining({
          entryId: 'entry-1',
          workflowId: 'wf-multi',
          currentStage: 'approved',
        }),
        'app-1',
      );
    });

    it('should throw ConflictError (409) when expectedStage does not match current stage in database', async () => {
      mockRepository.getWorkflowBySchemaId.mockResolvedValue(
        multiStageWorkflow,
      );
      mockRepository.getEntryWorkflowState.mockResolvedValue({
        id: 'st-1',
        entryId: 'entry-1',
        workflowId: 'wf-multi',
        currentStage: 'approved', // already approved by another reviewer
        applicationId: 'app-1',
        updatedByUserId: 'user-first-reviewer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Second reviewer attempts to act based on stale "in-review" stage
      await expect(
        workflowsService.transitionEntry(
          'entry-1',
          'schema-1',
          {
            toStage: 'draft',
            expectedStage: 'in-review',
            comment: 'Needs changes',
          },
          { id: 'user-second-reviewer', roles: ['editor'] },
          'app-1',
        ),
      ).rejects.toThrow(ConflictError);

      expect(mockRepository.upsertEntryWorkflowState).not.toHaveBeenCalled();
    });

    it('should succeed when expectedStage is omitted (backward compatibility)', async () => {
      mockRepository.getWorkflowBySchemaId.mockResolvedValue(
        multiStageWorkflow,
      );
      mockRepository.getEntryWorkflowState
        .mockResolvedValueOnce({
          id: 'st-1',
          entryId: 'entry-1',
          workflowId: 'wf-multi',
          currentStage: 'in-review',
          applicationId: 'app-1',
          updatedByUserId: 'user-creator',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          id: 'st-1',
          entryId: 'entry-1',
          workflowId: 'wf-multi',
          currentStage: 'approved',
          applicationId: 'app-1',
          updatedByUserId: 'user-reviewer',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      mockRepository.getEntryCreatorUserId.mockResolvedValue('user-creator');
      mockRepository.upsertEntryWorkflowState.mockResolvedValue({
        id: 'st-1',
        entryId: 'entry-1',
        workflowId: 'wf-multi',
        currentStage: 'approved',
        applicationId: 'app-1',
        updatedByUserId: 'user-reviewer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const result = await workflowsService.transitionEntry(
        'entry-1',
        'schema-1',
        { toStage: 'approved' },
        { id: 'user-reviewer', roles: ['editor'] },
        'app-1',
      );

      expect(result.currentStage?.slug).toBe('approved');
    });
  });
});
