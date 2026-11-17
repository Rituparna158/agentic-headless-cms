import { LocalesRepository } from '@repo/repository';
import type { CreateLocaleInput, BaseQueryOptions } from '@repo/types';
import { ERROR_MESSAGES, EVENT_NAMES, AUDIT_ACTIONS } from '@repo/constants';
import { ConflictError, NotFoundError, ApiError } from '@repo/utils';
import { logger } from '@repo/logger';
import { eventBus } from '@repo/events';
import { getAuditContext } from '../../utils/audit.js';
import { SERVICE_ERRORS } from '../../utils/error-constants.js';
export class LocalesService {
  constructor(
    private readonly repository: LocalesRepository = new LocalesRepository(),
  ) {}
  async list(options: BaseQueryOptions = {}, applicationId?: string) {
    try {
      logger.info('LocalesService: list start');
      const result = await this.repository.list(options, applicationId);
      logger.debug('LocalesService: list end');
      return result;
    } catch (error) {
      logger.error({ err: error }, 'LocalesService Error in list:');
      throw new ApiError(500, SERVICE_ERRORS.LIST_LOCALES_FAILED);
    }
  }
  async create(data: CreateLocaleInput, applicationId?: string) {
    try {
      logger.info({ code: data.code }, 'LocalesService: create start');
      const existing = await this.repository.getByCode(
        data.code,
        applicationId,
      );
      if (existing) {
        logger.warn({ code: data.code }, 'LocalesService: code already exists');
        throw new ConflictError(ERROR_MESSAGES.LOCALES.CODE_ALREADY_EXISTS);
      }
      const result = await this.repository.create({
        code: data.code,
        name: data.name,
        isDefault: data.isDefault ?? false,
        ...(applicationId ? { applicationId } : {}),
      });
      logger.debug(
        { id: result!.id },
        'LocalesService: create successful, emitting audit log',
      );
      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.CREATE,
        resourceType: 'locale',
        resourceId: result!.id,
        actorUserId,
        actorAgentId,
        beforeState: null,
        afterState: result,
        context,
      });
      return result;
    } catch (error) {
      logger.error({ err: error }, 'LocalesService Error in create:');
      if (error instanceof ConflictError) throw error;
      throw new ApiError(500, SERVICE_ERRORS.CREATE_LOCALE_FAILED);
    }
  }
  async delete(id: string) {
    try {
      logger.info({ id }, 'LocalesService: delete start');
      const beforeState = await this.repository.getById(id);
      const result = await this.repository.delete(id);
      logger.debug(
        { id },
        'LocalesService: delete successful, emitting audit log',
      );
      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.DELETE,
        resourceType: 'locale',
        resourceId: id,
        actorUserId,
        actorAgentId,
        beforeState: beforeState,
        afterState: null,
        context,
      });
      return result;
    } catch (error) {
      logger.error({ err: error }, 'LocalesService Error in delete:');
      throw new ApiError(500, SERVICE_ERRORS.DELETE_LOCALE_FAILED);
    }
  }
  async setDefault(id: string, applicationId?: string) {
    try {
      logger.info({ id }, 'LocalesService: setDefault start');
      const beforeState = await this.repository.getById(id);
      if (
        !beforeState ||
        (applicationId && beforeState.applicationId !== applicationId)
      ) {
        throw new NotFoundError(ERROR_MESSAGES.LOCALES.NOT_FOUND);
      }
      const result = await this.repository.setDefault(id, applicationId);
      logger.debug(
        { id },
        'LocalesService: setDefault successful, emitting audit log',
      );
      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.UPDATE,
        resourceType: 'locale',
        resourceId: id,
        actorUserId,
        actorAgentId,
        beforeState,
        afterState: result,
        context,
      });
      return result;
    } catch (error) {
      logger.error({ err: error }, 'LocalesService Error in setDefault:');
      if (error instanceof NotFoundError || error instanceof ApiError)
        throw error;
      if (error instanceof Error && error.name === 'RecordNotFoundError') {
        throw new NotFoundError(ERROR_MESSAGES.LOCALES.NOT_FOUND);
      }
      throw new ApiError(500, SERVICE_ERRORS.SET_DEFAULT_LOCALE_FAILED);
    }
  }
}
