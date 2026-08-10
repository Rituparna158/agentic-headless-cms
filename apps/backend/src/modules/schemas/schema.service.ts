import type { CreateSchemaInput, UpdateSchemaInput } from '@repo/types';
import { SchemaRepository } from '@repo/repository';
import { logger } from '@repo/logger';
import { eventBus } from '@repo/events';
import { EVENT_NAMES, AUDIT_ACTIONS } from '@repo/constants';
import { ApiError } from '@repo/utils';
import { getAuditContext } from '../../utils/audit.js';
import { SERVICE_ERRORS } from '../../utils/error-constants.js';

export class SchemaService {
  private repository: SchemaRepository;

  constructor() {
    this.repository = new SchemaRepository();
  }

  async create(input: CreateSchemaInput, actorUserId: string) {
    try {
      logger.info(
        { schemaName: input.name, actorUserId },
        'SchemaService: create start',
      );
      const result = await this.repository.create({ ...input, actorUserId });

      logger.debug(
        { schemaId: result.id },
        'SchemaService: create success, emitting audit log',
      );
      const {
        actorUserId: ctxUserId,
        actorAgentId,
        context,
      } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.CREATE,
        resourceType: 'schema',
        resourceId: result.id,
        actorUserId: ctxUserId || actorUserId,
        actorAgentId,
        beforeState: null,
        afterState: result,
        context,
      });

      return result;
    } catch (error) {
      logger.error({ err: error }, 'SchemaService Error in create:');
      throw new ApiError(500, SERVICE_ERRORS.CREATE_SCHEMA_FAILED);
    }
  }

  async list() {
    try {
      logger.info('SchemaService: list');
      return await this.repository.list();
    } catch (error) {
      logger.error({ err: error }, 'SchemaService Error in list:');
      throw new ApiError(500, SERVICE_ERRORS.LIST_SCHEMAS_FAILED);
    }
  }

  async getById(id: string) {
    try {
      logger.info({ id }, 'SchemaService: getById');
      return await this.repository.getById(id);
    } catch (error) {
      logger.error({ err: error }, 'SchemaService Error in getById:');
      throw new ApiError(500, SERVICE_ERRORS.FETCH_SCHEMA_FAILED);
    }
  }

  async update(id: string, input: UpdateSchemaInput, actorUserId: string) {
    try {
      logger.info({ id, actorUserId }, 'SchemaService: update start');

      // Fetch beforeState
      logger.debug({ id }, 'SchemaService: fetching beforeState');
      const beforeState = await this.repository.getById(id);

      // Perform mutation
      logger.debug({ id }, 'SchemaService: mutating schema');
      const result = await this.repository.update(id, {
        ...input,
        actorUserId,
      });

      // Emit audit event
      logger.debug({ id }, 'SchemaService: emitting audit log');
      const {
        actorUserId: ctxUserId,
        actorAgentId,
        context,
      } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.SCHEMA_CHANGE,
        resourceType: 'schema',
        resourceId: id,
        actorUserId: ctxUserId || actorUserId,
        actorAgentId,
        beforeState: beforeState,
        afterState: result,
        context,
      });

      return result;
    } catch (error) {
      logger.error({ err: error }, 'SchemaService Error in update:');
      throw new ApiError(500, SERVICE_ERRORS.UPDATE_SCHEMA_FAILED);
    }
  }

  async delete(id: string, force: boolean = false) {
    try {
      logger.info({ id, force }, 'SchemaService: delete start');

      // Fetch beforeState
      logger.debug({ id }, 'SchemaService: fetching beforeState');
      const beforeState = await this.repository.getById(id);

      // Perform mutation
      logger.debug({ id }, 'SchemaService: mutating data');
      const result = await this.repository.delete(id, force);

      // Emit audit event
      logger.debug({ id }, 'SchemaService: emitting audit log');
      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.SCHEMA_CHANGE,
        resourceType: 'schema',
        resourceId: id,
        actorUserId,
        actorAgentId,
        beforeState: beforeState,
        afterState: null,
        context,
      });

      return result;
    } catch (error) {
      logger.error({ err: error }, 'SchemaService Error in delete:');
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, SERVICE_ERRORS.DELETE_SCHEMA_FAILED);
    }
  }
}

export const schemaService = new SchemaService();
