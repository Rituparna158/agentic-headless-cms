import { WorkflowsRepository } from '@repo/repository';
import type {
  CreateWorkflowInput,
  UpdateWorkflowInput,
  BaseQueryOptions,
  TransitionEntryInput,
  EntryWorkflowState,
  PendingReviewsResult,
} from '@repo/types';
import { logger } from '@repo/logger';
import { eventBus } from '@repo/events';
import {
  EVENT_NAMES,
  AUDIT_ACTIONS,
  ERROR_MESSAGES,
  ADMIN_ROLES,
} from '@repo/constants';
import {
  ApiError,
  HttpError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from '@repo/utils';
import { getAuditContext } from '../../utils/audit.js';
import { SERVICE_ERRORS } from '../../utils/error-constants.js';
import { WebhookDispatcherService } from '../webhooks/webhook-dispatcher.service.js';

function rethrowKnownWorkflowError(error: unknown): void {
  if (error instanceof ApiError || error instanceof HttpError) {
    throw error;
  }
}

export class WorkflowsService {
  constructor(
    private readonly repository: WorkflowsRepository = new WorkflowsRepository(),
    private readonly webhookDispatcher: WebhookDispatcherService = new WebhookDispatcherService(),
  ) {}

  async list(options: BaseQueryOptions = {}, applicationId?: string) {
    try {
      logger.info('WorkflowsService: list start');
      const result = await this.repository.list(options, applicationId);
      logger.debug('WorkflowsService: list complete');
      return result;
    } catch (error) {
      logger.error({ err: error }, 'WorkflowsService Error in list:');
      throw new ApiError(500, SERVICE_ERRORS.LIST_WORKFLOWS_FAILED);
    }
  }

  async getById(id: string, applicationId?: string) {
    try {
      logger.info({ id }, 'WorkflowsService: getById start');
      const workflow = await this.repository.findById(id, applicationId);
      return workflow;
    } catch (error) {
      logger.error({ err: error, id }, 'WorkflowsService Error in getById:');
      throw new ApiError(500, SERVICE_ERRORS.FETCH_WORKFLOW_FAILED);
    }
  }

  async getByName(name: string, applicationId?: string) {
    try {
      return await this.repository.findByName(name, applicationId);
    } catch (error) {
      logger.error(
        { err: error, name },
        'WorkflowsService Error in getByName:',
      );
      throw new ApiError(500, SERVICE_ERRORS.FETCH_WORKFLOW_FAILED);
    }
  }

  async create(data: CreateWorkflowInput, applicationId?: string) {
    try {
      logger.info({ name: data.name }, 'WorkflowsService: create start');
      const result = await this.repository.create(data, applicationId);

      logger.debug(
        { id: result.id },
        'WorkflowsService: create successful, emitting audit log',
      );
      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.CREATE,
        resourceType: 'workflow',
        resourceId: result.id,
        actorUserId,
        actorAgentId,
        beforeState: null,
        afterState: {
          id: result.id,
          name: result.name,
          isDefault: result.isDefault,
          stagesCount: result.stages.length,
          transitionsCount: result.transitions.length,
          assignedSchemaIds: result.assignedSchemaIds,
        },
        context,
      });

      return result;
    } catch (error) {
      logger.error({ err: error }, 'WorkflowsService Error in create:');
      rethrowKnownWorkflowError(error);
      throw new ApiError(500, SERVICE_ERRORS.CREATE_WORKFLOW_FAILED);
    }
  }

  async update(id: string, data: UpdateWorkflowInput, applicationId?: string) {
    try {
      logger.info({ id }, 'WorkflowsService: update start');
      const beforeState = await this.repository.findById(id, applicationId);
      if (!beforeState) {
        throw new NotFoundError(ERROR_MESSAGES.WORKFLOWS.NOT_FOUND);
      }

      // Safe stage deletion guard: Block deleting stages that currently have active entries
      if (
        data.stages &&
        beforeState.stages &&
        typeof this.repository.countActiveEntriesInStage === 'function'
      ) {
        const newStageSlugs = new Set(data.stages.map((s) => s.slug));
        const removedStages = beforeState.stages.filter(
          (s) => !newStageSlugs.has(s.slug),
        );

        for (const removed of removedStages) {
          const count = await this.repository.countActiveEntriesInStage(
            id,
            removed.slug,
            applicationId,
          );
          if (count > 0) {
            throw new BadRequestError(
              `Cannot delete stage "${removed.name || removed.slug}" because ${count} active content ${count === 1 ? 'entry is' : 'entries are'} currently sitting in this stage. Please transition entries to another stage first.`,
            );
          }
        }
      }

      const result = await this.repository.update(id, data, applicationId);

      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.UPDATE,
        resourceType: 'workflow',
        resourceId: result.id,
        actorUserId,
        actorAgentId,
        beforeState: beforeState as unknown as Record<string, unknown> | null,
        afterState: {
          id: result.id,
          name: result.name,
          isDefault: result.isDefault,
          stagesCount: result.stages.length,
          transitionsCount: result.transitions.length,
          assignedSchemaIds: result.assignedSchemaIds,
        },
        context,
      });

      return result;
    } catch (error) {
      logger.error({ err: error, id }, 'WorkflowsService Error in update:');
      rethrowKnownWorkflowError(error);
      throw new ApiError(500, SERVICE_ERRORS.UPDATE_WORKFLOW_FAILED);
    }
  }

  async delete(id: string, applicationId?: string) {
    try {
      logger.info({ id }, 'WorkflowsService: delete start');
      const beforeState = await this.repository.findById(id, applicationId);
      if (!beforeState) {
        throw new NotFoundError(ERROR_MESSAGES.WORKFLOWS.NOT_FOUND);
      }

      // Safe workflow deletion guard 1: Block deleting if assigned to active content types
      if (
        beforeState.assignedSchemaIds &&
        beforeState.assignedSchemaIds.length > 0
      ) {
        throw new BadRequestError(
          `Cannot delete workflow because it is currently assigned to ${beforeState.assignedSchemaIds.length} content ${beforeState.assignedSchemaIds.length === 1 ? 'type' : 'types'}. Please unassign all content types first.`,
        );
      }

      // Safe workflow deletion guard 2: Block deleting if set as default pipeline
      if (beforeState.isDefault) {
        throw new BadRequestError(
          'Cannot delete the default workflow pipeline. Please mark another workflow as default or disable the default pipeline first.',
        );
      }

      // Safe workflow deletion guard 3: Block deleting if active content entries are governed by this workflow
      if (typeof this.repository.countActiveEntriesForWorkflow === 'function') {
        const activeEntriesCount =
          await this.repository.countActiveEntriesForWorkflow(
            id,
            applicationId,
          );
        if (activeEntriesCount > 0) {
          throw new BadRequestError(
            `Cannot delete workflow because ${activeEntriesCount} active content ${activeEntriesCount === 1 ? 'entry is' : 'entries are'} currently governed by it.`,
          );
        }
      }

      const result = await this.repository.delete(id, applicationId);

      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.DELETE,
        resourceType: 'workflow',
        resourceId: id,
        actorUserId,
        actorAgentId,
        beforeState: beforeState as unknown as Record<string, unknown> | null,
        afterState: null,
        context,
      });

      return result;
    } catch (error) {
      logger.error({ err: error, id }, 'WorkflowsService Error in delete:');
      rethrowKnownWorkflowError(error);
      throw new ApiError(500, SERVICE_ERRORS.DELETE_WORKFLOW_FAILED);
    }
  }

  async assignToSchema(
    workflowId: string,
    schemaId: string,
    applicationId?: string,
  ) {
    try {
      logger.info(
        { workflowId, schemaId },
        'WorkflowsService: assignToSchema start',
      );
      await this.repository.assignToSchema(workflowId, schemaId, applicationId);

      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.UPDATE,
        resourceType: 'workflow_schema_assignment',
        resourceId: schemaId,
        actorUserId,
        actorAgentId,
        beforeState: null,
        afterState: { workflowId, schemaId },
        context,
      });
    } catch (error) {
      logger.error(
        { err: error, workflowId, schemaId },
        'WorkflowsService Error in assignToSchema:',
      );
      rethrowKnownWorkflowError(error);
      throw new ApiError(500, SERVICE_ERRORS.ASSIGN_WORKFLOW_FAILED);
    }
  }

  async removeFromSchema(schemaId: string, applicationId?: string) {
    try {
      logger.info({ schemaId }, 'WorkflowsService: removeFromSchema start');
      await this.repository.removeFromSchema(schemaId, applicationId);

      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.UPDATE,
        resourceType: 'workflow_schema_assignment',
        resourceId: schemaId,
        actorUserId,
        actorAgentId,
        beforeState: { schemaId },
        afterState: null,
        context,
      });
    } catch (error) {
      logger.error(
        { err: error, schemaId },
        'WorkflowsService Error in removeFromSchema:',
      );
      rethrowKnownWorkflowError(error);
      throw new ApiError(500, SERVICE_ERRORS.REMOVE_WORKFLOW_FAILED);
    }
  }

  async getWorkflowBySchemaId(schemaId: string, applicationId?: string) {
    try {
      return await this.repository.getWorkflowBySchemaId(
        schemaId,
        applicationId,
      );
    } catch (error) {
      logger.error(
        { err: error, schemaId },
        'WorkflowsService Error in getWorkflowBySchemaId:',
      );
      rethrowKnownWorkflowError(error);
      throw new ApiError(500, SERVICE_ERRORS.FETCH_WORKFLOW_FAILED);
    }
  }

  async countActiveEntriesInStage(
    workflowId: string,
    stageSlug: string,
    applicationId?: string,
  ): Promise<number> {
    try {
      if (typeof this.repository.countActiveEntriesInStage !== 'function') {
        return 0;
      }
      return await this.repository.countActiveEntriesInStage(
        workflowId,
        stageSlug,
        applicationId,
      );
    } catch (error) {
      logger.error(
        { err: error, workflowId, stageSlug },
        'WorkflowsService Error in countActiveEntriesInStage:',
      );
      return 0;
    }
  }

  async getAssignedSchemas(workflowId: string, applicationId?: string) {
    try {
      return await this.repository.getAssignedSchemas(
        workflowId,
        applicationId,
      );
    } catch (error) {
      logger.error(
        { err: error, workflowId },
        'WorkflowsService Error in getAssignedSchemas:',
      );
      rethrowKnownWorkflowError(error);
      throw new ApiError(500, SERVICE_ERRORS.FETCH_WORKFLOW_FAILED);
    }
  }

  async getEntryWorkflowState(
    entryId: string,
    schemaId: string,
    user?: { id: string; roles?: string[] },
    applicationId?: string,
  ): Promise<EntryWorkflowState> {
    try {
      logger.info(
        { entryId, schemaId },
        'WorkflowsService: getEntryWorkflowState start',
      );
      const workflow = await this.repository.getWorkflowBySchemaId(
        schemaId,
        applicationId,
      );

      if (!workflow || !workflow.stages || workflow.stages.length === 0) {
        return {
          hasWorkflow: false,
          workflow: null,
          currentStage: null,
          availableTransitions: [],
          isFinal: true,
        };
      }

      const entryState = await this.repository.getEntryWorkflowState(
        entryId,
        applicationId,
      );

      const initialStage =
        workflow.stages.find((s) => s.isInitial) || workflow.stages[0]!;
      const currentStageSlug = entryState?.currentStage || initialStage.slug;

      const currentStage =
        workflow.stages.find((s) => s.slug === currentStageSlug) ||
        initialStage;

      const isAdmin =
        user?.roles?.some((r) =>
          ADMIN_ROLES.includes(r as (typeof ADMIN_ROLES)[number]),
        ) ?? false;

      const creatorUserId =
        typeof this.repository.getEntryCreatorUserId === 'function'
          ? await this.repository.getEntryCreatorUserId(entryId, applicationId)
          : null;
      const isCreator = !!(
        creatorUserId &&
        user?.id &&
        creatorUserId === user.id
      );

      const candidateTransitions = workflow.transitions.filter(
        (t) => t.fromStage === currentStage.slug,
      );

      const availableTransitions = candidateTransitions.filter((t) => {
        // Four-eyes principle: The entry creator cannot review or approve their own submission
        if (isCreator) {
          const targetStageDef = workflow.stages.find(
            (s) => s.slug === t.toStage,
          );
          const isApproval =
            !!targetStageDef?.isFinal ||
            t.name.toLowerCase().includes('approve') ||
            t.toStage.toLowerCase().includes('approved');
          const isReviewAction =
            t.name.toLowerCase().includes('reject') ||
            t.name.toLowerCase().includes('change') ||
            t.toStage.toLowerCase().includes('reject') ||
            (currentStage.slug !== initialStage.slug &&
              t.toStage === initialStage.slug);

          if (isApproval || isReviewAction) {
            return false;
          }
        }

        if (isAdmin) return true;
        if (!t.requiredRoleIds || t.requiredRoleIds.length === 0) return true;
        return (
          user?.roles?.some((r) => t.requiredRoleIds!.includes(r)) ?? false
        );
      });

      return {
        hasWorkflow: true,
        workflow: {
          id: workflow.id,
          name: workflow.name,
        },
        currentStage,
        availableTransitions,
        isFinal: !!currentStage.isFinal,
      };
    } catch (error) {
      logger.error(
        { err: error, entryId, schemaId },
        'WorkflowsService Error in getEntryWorkflowState:',
      );
      rethrowKnownWorkflowError(error);
      throw new ApiError(500, SERVICE_ERRORS.FETCH_WORKFLOW_STATE_FAILED);
    }
  }

  async transitionEntry(
    entryId: string,
    schemaId: string,
    input: TransitionEntryInput,
    user: { id: string; roles?: string[] },
    applicationId?: string,
  ): Promise<EntryWorkflowState> {
    try {
      logger.info(
        { entryId, schemaId, toStage: input.toStage },
        'WorkflowsService: transitionEntry start',
      );

      const workflow = await this.repository.getWorkflowBySchemaId(
        schemaId,
        applicationId,
      );

      if (!workflow || !workflow.stages || workflow.stages.length === 0) {
        throw new BadRequestError('No workflow is associated with this schema');
      }

      const entryState = await this.repository.getEntryWorkflowState(
        entryId,
        applicationId,
      );

      const initialStage =
        workflow.stages.find((s) => s.isInitial) || workflow.stages[0]!;
      const currentStageSlug = entryState?.currentStage || initialStage.slug;

      // Optimistic Locking: Validate expected current stage to prevent race conditions
      if (input.expectedStage && input.expectedStage !== currentStageSlug) {
        const currentStageObj = workflow.stages.find(
          (s) => s.slug === currentStageSlug,
        );
        const currentStageName = currentStageObj?.name || currentStageSlug;
        throw new ConflictError(
          `This entry's workflow stage was modified by another reviewer (currently "${currentStageName}"). Please refresh to view the latest state.`,
        );
      }

      const targetStage = workflow.stages.find((s) => s.slug === input.toStage);
      if (!targetStage) {
        throw new BadRequestError(ERROR_MESSAGES.WORKFLOWS.INVALID_STAGE);
      }

      const transition = workflow.transitions.find(
        (t) => t.fromStage === currentStageSlug && t.toStage === input.toStage,
      );

      if (!transition) {
        throw new BadRequestError(
          ERROR_MESSAGES.WORKFLOWS.TRANSITION_NOT_ALLOWED,
        );
      }

      const isAdmin =
        user.roles?.some((r) =>
          ADMIN_ROLES.includes(r as (typeof ADMIN_ROLES)[number]),
        ) ?? false;

      if (
        !isAdmin &&
        transition.requiredRoleIds &&
        transition.requiredRoleIds.length > 0
      ) {
        const hasRequiredRole =
          user.roles?.some((r) => transition.requiredRoleIds!.includes(r)) ??
          false;
        if (!hasRequiredRole) {
          throw new ForbiddenError(
            ERROR_MESSAGES.WORKFLOWS.UNAUTHORIZED_TRANSITION,
          );
        }
      }

      // Four-eyes principle: Prevent authors/creators from reviewing or approving their own entries
      const creatorUserId =
        typeof this.repository.getEntryCreatorUserId === 'function'
          ? await this.repository.getEntryCreatorUserId(entryId, applicationId)
          : null;
      const isCreator = !!(
        creatorUserId &&
        user?.id &&
        creatorUserId === user.id
      );

      const isApprovalTransition =
        !!targetStage.isFinal ||
        transition.name.toLowerCase().includes('approve') ||
        targetStage.slug.toLowerCase().includes('approved');

      const isReviewAction =
        transition.name.toLowerCase().includes('reject') ||
        transition.name.toLowerCase().includes('change') ||
        targetStage.slug.toLowerCase().includes('reject') ||
        (currentStageSlug !== initialStage.slug &&
          targetStage.slug === initialStage.slug);

      if (isCreator) {
        if (isApprovalTransition) {
          throw new ForbiddenError(
            'You cannot approve your own submission; another editor must review it',
          );
        }
        if (isReviewAction) {
          throw new ForbiddenError(
            'You cannot review or request changes on your own submission; another editor must review it',
          );
        }
      }

      // Enforce mandatory feedback comments on rejection or changes requested
      const isRejectionOrChangeRequest =
        (currentStageSlug !== initialStage.slug &&
          targetStage.slug === initialStage.slug) ||
        transition.name.toLowerCase().includes('reject') ||
        transition.name.toLowerCase().includes('change') ||
        targetStage.slug.toLowerCase().includes('reject') ||
        targetStage.slug.toLowerCase().includes('change');

      if (isRejectionOrChangeRequest) {
        if (!input.comment || input.comment.trim().length === 0) {
          throw new BadRequestError(
            'A comment explaining the required changes or reason for rejection is mandatory',
          );
        }
      }

      await this.repository.upsertEntryWorkflowState(
        {
          entryId,
          workflowId: workflow.id,
          currentStage: input.toStage,
          updatedByUserId: user.id,
        },
        applicationId,
      );

      await this.repository.recordWorkflowHistory(
        {
          entryId,
          workflowId: workflow.id,
          fromStage: currentStageSlug,
          toStage: input.toStage,
          action: transition.name,
          comment: input.comment,
          actorType: 'user',
          actorUserId: user.id,
        },
        applicationId,
      );

      const { actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.UPDATE,
        resourceType: 'workflow_transition',
        resourceId: entryId,
        actorUserId: user.id,
        actorAgentId,
        beforeState: { stage: currentStageSlug },
        afterState: { stage: input.toStage, comment: input.comment },
        context,
      });

      const transitionPayload = {
        workflowId: workflow.id,
        schemaId,
        entryId,
        previousStage: currentStageSlug,
        currentStage: input.toStage,
        action: transition.name,
        comment: input.comment,
        actorUserId: user.id,
        actorAgentId,
        timestamp: new Date().toISOString(),
        applicationId,
      };

      eventBus.emit(EVENT_NAMES.WORKFLOW_TRANSITION, transitionPayload);

      void this.webhookDispatcher.dispatch(
        'workflow.transition',
        transitionPayload,
        applicationId,
      );

      const isReviewRequested =
        !isApprovalTransition &&
        !isRejectionOrChangeRequest &&
        (targetStage.slug.toLowerCase().includes('review') ||
          transition.name.toLowerCase().includes('review') ||
          transition.name.toLowerCase().includes('submit') ||
          currentStageSlug === initialStage.slug);

      if (isReviewRequested) {
        eventBus.emit(EVENT_NAMES.WORKFLOW_REVIEW_REQUESTED, transitionPayload);
        void this.webhookDispatcher.dispatch(
          'workflow.review_requested',
          transitionPayload,
          applicationId,
        );
      } else if (isApprovalTransition) {
        eventBus.emit(EVENT_NAMES.WORKFLOW_APPROVED, transitionPayload);
        void this.webhookDispatcher.dispatch(
          'workflow.approved',
          transitionPayload,
          applicationId,
        );
      } else if (isRejectionOrChangeRequest) {
        eventBus.emit(
          EVENT_NAMES.WORKFLOW_CHANGES_REQUESTED,
          transitionPayload,
        );
        void this.webhookDispatcher.dispatch(
          'workflow.changes_requested',
          transitionPayload,
          applicationId,
        );
      }

      return await this.getEntryWorkflowState(
        entryId,
        schemaId,
        user,
        applicationId,
      );
    } catch (error) {
      logger.error(
        { err: error, entryId, schemaId, toStage: input.toStage },
        'WorkflowsService Error in transitionEntry:',
      );
      rethrowKnownWorkflowError(error);
      throw new ApiError(500, SERVICE_ERRORS.TRANSITION_WORKFLOW_FAILED);
    }
  }

  async getWorkflowHistory(entryId: string, applicationId?: string) {
    try {
      logger.info({ entryId }, 'WorkflowsService: getWorkflowHistory start');
      return await this.repository.getWorkflowHistory(entryId, applicationId);
    } catch (error) {
      logger.error(
        { err: error, entryId },
        'WorkflowsService Error in getWorkflowHistory:',
      );
      rethrowKnownWorkflowError(error);
      throw new ApiError(500, SERVICE_ERRORS.FETCH_WORKFLOW_HISTORY_FAILED);
    }
  }

  async getPendingReviews(
    applicationId?: string,
    limit = 20,
  ): Promise<PendingReviewsResult> {
    try {
      logger.info(
        { applicationId },
        'WorkflowsService: getPendingReviews start',
      );
      if (typeof this.repository.getPendingReviews !== 'function') {
        return { total: 0, items: [] };
      }
      return await this.repository.getPendingReviews(applicationId, limit);
    } catch (error) {
      logger.error(
        { err: error },
        'WorkflowsService Error in getPendingReviews:',
      );
      return { total: 0, items: [] };
    }
  }

  async canPublish(
    entryId: string,
    schemaId?: string,
    applicationId?: string,
  ): Promise<boolean> {
    try {
      if (!schemaId) return true;
      if (typeof this.repository.getWorkflowBySchemaId !== 'function')
        return true;

      const workflow = await this.repository.getWorkflowBySchemaId(
        schemaId,
        applicationId,
      );
      if (!workflow) return true;

      if (typeof this.repository.getEntryWorkflowState !== 'function')
        return true;
      const entryState = await this.repository.getEntryWorkflowState(
        entryId,
        applicationId,
      );
      const initialStage =
        workflow.stages.find((s) => s.isInitial) || workflow.stages[0];
      const currentStageSlug = entryState?.currentStage || initialStage?.slug;
      const currentStage = workflow.stages.find(
        (s) => s.slug === currentStageSlug,
      );

      return !!currentStage?.isFinal;
    } catch (error) {
      logger.error(
        { err: error, entryId, schemaId },
        'WorkflowsService Error in canPublish:',
      );
      return false;
    }
  }

  async initializeEntryWorkflow(
    entryId: string,
    schemaId: string,
    userId: string,
    applicationId?: string,
  ): Promise<void> {
    try {
      if (typeof this.repository.getWorkflowBySchemaId !== 'function') return;
      const workflow = await this.repository.getWorkflowBySchemaId(
        schemaId,
        applicationId,
      );
      if (workflow && workflow.stages && workflow.stages.length > 0) {
        const initialStage =
          workflow.stages.find((s) => s.isInitial) || workflow.stages[0]!;
        if (typeof this.repository.upsertEntryWorkflowState === 'function') {
          await this.repository.upsertEntryWorkflowState(
            {
              entryId,
              workflowId: workflow.id,
              currentStage: initialStage.slug,
              updatedByUserId: userId,
            },
            applicationId,
          );
        }
        if (typeof this.repository.recordWorkflowHistory === 'function') {
          await this.repository.recordWorkflowHistory(
            {
              entryId,
              workflowId: workflow.id,
              fromStage: initialStage.slug,
              toStage: initialStage.slug,
              action: 'Entry Created',
              comment: 'Initial workflow state assigned',
              actorType: 'user',
              actorUserId: userId,
            },
            applicationId,
          );
        }
      }
    } catch (error) {
      logger.warn(
        { err: error, entryId, schemaId },
        'WorkflowsService: failed to initialize entry workflow state',
      );
    }
  }

  async handleContentUpdated(
    entryId: string,
    schemaId: string,
    user: { id: string; email?: string },
    applicationId?: string,
  ): Promise<{ demoted: boolean; fromStage?: string; toStage?: string }> {
    try {
      logger.info(
        { entryId, schemaId, userId: user.id },
        'WorkflowsService: handleContentUpdated start',
      );

      if (typeof this.repository.getWorkflowBySchemaId !== 'function') {
        return { demoted: false };
      }

      const workflow = await this.repository.getWorkflowBySchemaId(
        schemaId,
        applicationId,
      );

      if (!workflow || !workflow.stages || workflow.stages.length === 0) {
        return { demoted: false };
      }

      const initialStage =
        workflow.stages.find((s) => s.isInitial) || workflow.stages[0]!;

      if (typeof this.repository.getEntryWorkflowState !== 'function') {
        return { demoted: false };
      }

      const entryState = await this.repository.getEntryWorkflowState(
        entryId,
        applicationId,
      );

      // If entry is not yet tracked or is already at initial stage, no demotion needed
      if (!entryState || entryState.currentStage === initialStage.slug) {
        return { demoted: false };
      }

      const fromStage = entryState.currentStage;
      const toStage = initialStage.slug;

      logger.info(
        { entryId, fromStage, toStage },
        'WorkflowsService: auto-demoting entry back to initial stage due to content edit',
      );

      if (typeof this.repository.upsertEntryWorkflowState === 'function') {
        await this.repository.upsertEntryWorkflowState(
          {
            entryId,
            workflowId: workflow.id,
            currentStage: toStage,
            updatedByUserId: user.id,
          },
          applicationId,
        );
      }

      if (typeof this.repository.recordWorkflowHistory === 'function') {
        await this.repository.recordWorkflowHistory(
          {
            entryId,
            workflowId: workflow.id,
            fromStage,
            toStage,
            action: 'Auto-Demoted on Edit',
            comment:
              'Stage automatically reset to Draft due to content update.',
            actorType: 'system',
            actorUserId: user.id,
          },
          applicationId,
        );
      }

      const { actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.UPDATE,
        resourceType: 'workflow_auto_demotion',
        resourceId: entryId,
        actorUserId: user.id,
        actorAgentId,
        beforeState: { stage: fromStage },
        afterState: { stage: toStage, reason: 'content_updated' },
        context,
      });

      eventBus.emit(EVENT_NAMES.WORKFLOW_TRANSITION, {
        workflowId: workflow.id,
        schemaId,
        entryId,
        previousStage: fromStage,
        currentStage: toStage,
        action: 'Auto-Demoted on Edit',
        comment: 'Stage automatically reset to Draft due to content update.',
        actorUserId: user.id,
        timestamp: new Date().toISOString(),
      });

      return { demoted: true, fromStage, toStage };
    } catch (error) {
      logger.error(
        { err: error, entryId, schemaId },
        'WorkflowsService Error in handleContentUpdated:',
      );
      return { demoted: false };
    }
  }

  async handleEntryUnpublished(
    entryId: string,
    schemaId: string,
    user: { id: string },
    applicationId?: string,
  ): Promise<{ reset: boolean; fromStage?: string; toStage?: string }> {
    try {
      logger.info(
        { entryId, schemaId },
        'WorkflowsService: handleEntryUnpublished start',
      );

      const workflow = await this.repository.getWorkflowBySchemaId(
        schemaId,
        applicationId,
      );

      if (!workflow || !workflow.stages || workflow.stages.length === 0) {
        return { reset: false };
      }

      const initialStage =
        workflow.stages.find((s) => s.isInitial) || workflow.stages[0]!;

      const entryState = await this.repository.getEntryWorkflowState(
        entryId,
        applicationId,
      );

      const toStage = initialStage.slug;
      const fromStage =
        entryState && entryState.currentStage !== initialStage.slug
          ? entryState.currentStage
          : 'published';

      logger.info(
        { entryId, fromStage, toStage },
        'WorkflowsService: resetting entry workflow stage back to initial stage due to unpublish',
      );

      if (typeof this.repository.upsertEntryWorkflowState === 'function') {
        await this.repository.upsertEntryWorkflowState(
          {
            entryId,
            workflowId: workflow.id,
            currentStage: toStage,
            updatedByUserId: user.id,
          },
          applicationId,
        );
      }

      if (typeof this.repository.recordWorkflowHistory === 'function') {
        await this.repository.recordWorkflowHistory(
          {
            entryId,
            workflowId: workflow.id,
            fromStage,
            toStage,
            action: 'Reset on Unpublish',
            comment: 'Workflow state reset to Draft upon unpublishing.',
            actorType: 'user',
            actorUserId: user.id,
          },
          applicationId,
        );
      }

      const { actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.UPDATE,
        resourceType: 'workflow_unpublish_reset',
        resourceId: entryId,
        actorUserId: user.id,
        actorAgentId,
        beforeState: { stage: fromStage },
        afterState: { stage: toStage, reason: 'entry_unpublished' },
        context,
      });

      eventBus.emit(EVENT_NAMES.WORKFLOW_TRANSITION, {
        workflowId: workflow.id,
        schemaId,
        entryId,
        previousStage: fromStage,
        currentStage: toStage,
        action: 'Reset on Unpublish',
        comment: 'Workflow state reset to Draft upon unpublishing.',
        actorUserId: user.id,
        timestamp: new Date().toISOString(),
      });

      return { reset: true, fromStage, toStage };
    } catch (error) {
      logger.error(
        { err: error, entryId, schemaId },
        'WorkflowsService Error in handleEntryUnpublished:',
      );
      return { reset: false };
    }
  }
}
