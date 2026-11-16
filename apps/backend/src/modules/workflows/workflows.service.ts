import { WorkflowsRepository } from '@repo/repository';
import type {
  CreateWorkflowInput,
  UpdateWorkflowInput,
  BaseQueryOptions,
} from '@repo/types';
import { logger } from '@repo/logger';
import { eventBus } from '@repo/events';
import { EVENT_NAMES, AUDIT_ACTIONS } from '@repo/constants';
import { ApiError } from '@repo/utils';
import { getAuditContext } from '../../utils/audit.js';
import { SERVICE_ERRORS } from '../../utils/error-constants.js';

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
      if (error instanceof ApiError) throw error;
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
      if (error instanceof ApiError) throw error;
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
      if (error instanceof ApiError) throw error;
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
      if (error instanceof ApiError) throw error;
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
      if (error instanceof ApiError) throw error;
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
      if (error instanceof ApiError) throw error;
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
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, SERVICE_ERRORS.FETCH_WORKFLOW_FAILED);
    }
  }
}
