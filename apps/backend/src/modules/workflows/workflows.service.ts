import { WorkflowsRepository } from '@repo/repository';
import type {
  CreateWorkflowInput,
  UpdateWorkflowInput,
  BaseQueryOptions,
  TransitionEntryInput,
  EntryWorkflowState,
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
} from '@repo/utils';
import { getAuditContext } from '../../utils/audit.js';
import { SERVICE_ERRORS } from '../../utils/error-constants.js';

function rethrowKnownWorkflowError(error: unknown): void {
  if (error instanceof ApiError || error instanceof HttpError) {
    throw error;
  }
}

export class WorkflowsService {
  constructor(
    private readonly repository: WorkflowsRepository = new WorkflowsRepository(),
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

      const candidateTransitions = workflow.transitions.filter(
        (t) => t.fromStage === currentStage.slug,
      );

      const availableTransitions = candidateTransitions.filter((t) => {
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
      }
    } catch (error) {
      logger.warn(
        { err: error, entryId, schemaId },
        'WorkflowsService: failed to initialize entry workflow state',
      );
    }
  }
}
