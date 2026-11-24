import { ContentRepository } from '@repo/repository';
import {
  DEFAULT_LOCALE,
  ERROR_MESSAGES,
  EVENT_NAMES,
  AUDIT_ACTIONS,
} from '@repo/constants';
import { logger } from '@repo/logger';
import { eventBus } from '@repo/events';
import type { ContentQueryOptions } from '@repo/types';
import { ApiError, HttpError } from '@repo/utils';
import { DatabaseError } from '@repo/shared-db';
import { getAuditContext } from '../../utils/audit.js';
import { SERVICE_ERRORS } from '../../utils/error-constants.js';
import { WorkflowsService } from '../workflows/workflows.service.js';

function rethrowKnownContentError(error: unknown): void {
  if (
    error instanceof ApiError ||
    error instanceof HttpError ||
    error instanceof DatabaseError
  ) {
    throw error;
  }
}

export class ContentService {
  private repository: ContentRepository;
  private workflowsService: WorkflowsService;

  constructor(
    repository?: ContentRepository,
    workflowsService?: WorkflowsService,
  ) {
    this.repository = repository ?? new ContentRepository();
    this.workflowsService = workflowsService ?? new WorkflowsService();
  }
  async listEntries(
    schemaId: string,
    locale: string = DEFAULT_LOCALE,
    query?: ContentQueryOptions,
    applicationId?: string,
  ) {
    try {
      logger.info(
        { schemaId, locale, applicationId },
        'ContentService: listEntries',
      );
      return await this.repository.listEntries(
        schemaId,
        locale,
        query,
        applicationId,
      );
    } catch (error) {
      rethrowKnownContentError(error);
      logger.error({ err: error }, 'ContentService Error in listEntries:');
      throw new ApiError(500, SERVICE_ERRORS.LIST_ENTRIES_FAILED);
    }
  }
  async countEntries(
    schemaId: string,
    locale: string = DEFAULT_LOCALE,
    query?: ContentQueryOptions,
    applicationId?: string,
  ) {
    try {
      logger.info(
        { schemaId, locale, applicationId },
        'ContentService: countEntries',
      );
      return await this.repository.countEntries(
        schemaId,
        locale,
        query?.where,
        applicationId,
      );
    } catch (error) {
      rethrowKnownContentError(error);
      logger.error({ err: error }, 'ContentService Error in countEntries:');
      throw new ApiError(500, SERVICE_ERRORS.COUNT_ENTRIES_FAILED);
    }
  }
  async getEntryById(
    entryId: string,
    locale: string = DEFAULT_LOCALE,
    schemaId?: string,
    applicationId?: string,
  ) {
    try {
      logger.info(
        { entryId, locale, schemaId, applicationId },
        'ContentService: getEntryById',
      );
      return await this.repository.getEntryById(
        entryId,
        locale,
        schemaId,
        applicationId,
      );
    } catch (error) {
      rethrowKnownContentError(error);
      logger.error({ err: error }, 'ContentService Error in getEntryById:');
      throw new ApiError(500, SERVICE_ERRORS.FETCH_ENTRY_FAILED);
    }
  }
  async createDraft(
    schemaId: string,
    data: Record<string, unknown>,
    userId: string,
    locale: string = DEFAULT_LOCALE,
    applicationId?: string,
    userEmail?: string,
  ) {
    try {
      logger.info({ schemaId, userId }, 'ContentService: createDraft start');
      const result = await this.repository.createEntry(
        schemaId,
        data,
        userId,
        locale,
        { applicationId, userEmail },
      );
      if (
        typeof this.workflowsService?.initializeEntryWorkflow === 'function'
      ) {
        await this.workflowsService.initializeEntryWorkflow(
          result.id,
          schemaId,
          userId,
          applicationId,
        );
      }
      logger.debug(
        { id: result.id },
        'ContentService: createDraft success, emitting audit log',
      );
      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.CREATE,
        resourceType: 'content',
        resourceId: result.id,
        actorUserId: actorUserId || userId,
        actorAgentId,
        beforeState: null,
        afterState: result,
        context,
      });
      return result;
    } catch (error) {
      rethrowKnownContentError(error);
      logger.error({ err: error }, 'ContentService Error in createDraft:');
      throw new ApiError(500, SERVICE_ERRORS.CREATE_DRAFT_FAILED);
    }
  }
  async updateDraft(
    entryId: string,
    data: Record<string, unknown>,
    userId: string,
    locale: string = DEFAULT_LOCALE,
    userEmail?: string,
    applicationId?: string,
    schemaId?: string,
  ) {
    try {
      logger.info({ entryId, userId }, 'ContentService: updateDraft start');
      // Capture BEFORE state
      logger.debug({ entryId }, 'ContentService: fetching beforeState');
      const beforeState = await this.repository.getEntryById(entryId, locale);
      // Perform mutation
      logger.debug({ entryId }, 'ContentService: mutating data');
      const beforeData = beforeState?.data as
        Record<string, unknown> | undefined;
      const finalData = { ...data };
      if (beforeData?.body && finalData.body === undefined) {
        finalData.body = beforeData.body;
      }
      const result = await this.repository.updateEntryDraft(
        entryId,
        finalData,
        userId,
        locale,
        userEmail,
      );

      // Auto-demotion guard: Reset in-review or approved entry back to initial stage on content edit
      const targetSchemaId = schemaId || beforeState?.schemaId;
      if (
        targetSchemaId &&
        typeof this.workflowsService?.handleContentUpdated === 'function'
      ) {
        await this.workflowsService.handleContentUpdated(
          entryId,
          targetSchemaId,
          { id: userId, email: userEmail },
          applicationId,
        );
      }
      // Emit audit event
      logger.debug({ entryId }, 'ContentService: emitting audit log');
      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.UPDATE,
        resourceType: 'content',
        resourceId: entryId,
        actorUserId: actorUserId || userId,
        actorAgentId,
        beforeState: beforeState,
        afterState: result,
        context,
      });
      return result;
    } catch (error) {
      rethrowKnownContentError(error);
      logger.error({ err: error }, 'ContentService Error in updateDraft:');
      throw new ApiError(500, SERVICE_ERRORS.UPDATE_DRAFT_FAILED);
    }
  }
  async updatePartial(
    entryId: string,
    data: Record<string, unknown>,
    userId: string,
    locale: string = DEFAULT_LOCALE,
    userEmail?: string,
    applicationId?: string,
    schemaId?: string,
  ) {
    try {
      logger.info({ entryId, userId }, 'ContentService: updatePartial start');
      const beforeState = await this.repository.getEntryById(entryId, locale);
      if (!beforeState) {
        throw new ApiError(404, 'Entry not found');
      }
      const mergedData = { ...(beforeState.data as object), ...data };
      const result = await this.repository.updateEntryDraft(
        entryId,
        mergedData,
        userId,
        locale,
        userEmail,
      );

      // Auto-demotion guard: Reset in-review or approved entry back to initial stage on content edit
      const targetSchemaId = schemaId || beforeState?.schemaId;
      if (
        targetSchemaId &&
        typeof this.workflowsService?.handleContentUpdated === 'function'
      ) {
        await this.workflowsService.handleContentUpdated(
          entryId,
          targetSchemaId,
          { id: userId, email: userEmail },
          applicationId,
        );
      }
      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.UPDATE,
        resourceType: 'content',
        resourceId: entryId,
        actorUserId: actorUserId || userId,
        actorAgentId,
        beforeState: beforeState,
        afterState: result,
        context,
      });
      return result;
    } catch (error) {
      rethrowKnownContentError(error);
      logger.error({ err: error }, 'ContentService Error in updatePartial:');
      throw new ApiError(500, 'Failed to partially update entry.');
    }
  }
  async publishEntry(
    entryId: string,
    userId: string,
    locale: string = DEFAULT_LOCALE,
    userEmail?: string,
    schemaId?: string,
    applicationId?: string,
  ) {
    try {
      logger.info({ entryId, userId }, 'ContentService: publishEntry start');

      if (schemaId && typeof this.workflowsService?.canPublish === 'function') {
        const isAllowed = await this.workflowsService.canPublish(
          entryId,
          schemaId,
          applicationId,
        );
        if (!isAllowed) {
          throw new ApiError(
            400,
            ERROR_MESSAGES.WORKFLOWS.WORKFLOW_APPROVAL_REQUIRED,
          );
        }
      }

      // Capture BEFORE state
      logger.debug({ entryId }, 'ContentService: fetching beforeState');
      const beforeState = await this.repository.getEntryById(entryId, locale);
      // Perform mutation
      logger.debug({ entryId }, 'ContentService: mutating data');
      const result = await this.repository.publishEntry(
        entryId,
        userId,
        locale,
        userEmail,
      );
      // Emit audit event
      logger.debug({ entryId }, 'ContentService: emitting audit log');
      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.PUBLISH,
        resourceType: 'content',
        resourceId: entryId,
        actorUserId: actorUserId || userId,
        actorAgentId,
        beforeState: beforeState,
        afterState: result,
        context,
      });
      return result;
    } catch (error) {
      rethrowKnownContentError(error);
      logger.error({ err: error }, 'ContentService Error in publishEntry:');
      throw new ApiError(500, SERVICE_ERRORS.PUBLISH_ENTRY_FAILED);
    }
  }
  async unpublishEntry(
    entryId: string,
    userId: string,
    locale: string = DEFAULT_LOCALE,
    userEmail?: string,
    applicationId?: string,
    schemaId?: string,
  ) {
    try {
      logger.info({ entryId, userId }, 'ContentService: unpublishEntry start');
      const beforeState = await this.repository.getEntryById(entryId, locale);
      const result = await this.repository.unpublishEntry(
        entryId,
        userId,
        locale,
        userEmail,
      );

      // Reset workflow stage to Draft upon unpublish
      const targetSchemaId = beforeState?.schemaId || schemaId;
      if (
        typeof this.workflowsService?.handleEntryUnpublished === 'function' &&
        targetSchemaId
      ) {
        await this.workflowsService.handleEntryUnpublished(
          entryId,
          targetSchemaId,
          { id: userId },
          applicationId,
        );
      }

      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.UNPUBLISH,
        resourceType: 'content',
        resourceId: entryId,
        actorUserId: actorUserId || userId,
        actorAgentId,
        beforeState: beforeState,
        afterState: result,
        context,
      });
      return result;
    } catch (error) {
      rethrowKnownContentError(error);
      logger.error({ err: error }, 'ContentService Error in unpublishEntry:');
      throw new ApiError(500, SERVICE_ERRORS.UNPUBLISH_ENTRY_FAILED);
    }
  }

  async revertEntry(
    entryId: string,
    versionNo: number,
    userId: string,
    locale: string = DEFAULT_LOCALE,
  ) {
    try {
      logger.info(
        { entryId, versionNo, userId },
        'ContentService: revertEntry start',
      );
      // Capture BEFORE state
      logger.debug({ entryId }, 'ContentService: fetching beforeState');
      const beforeState = await this.repository.getEntryById(entryId, locale);
      // Perform mutation
      logger.debug({ entryId }, 'ContentService: mutating data');
      const result = await this.repository.revertEntry(
        entryId,
        versionNo,
        userId,
        locale,
      );
      // Emit audit event
      logger.debug({ entryId }, 'ContentService: emitting audit log');
      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.ROLLBACK,
        resourceType: 'content',
        resourceId: entryId,
        actorUserId: actorUserId || userId,
        actorAgentId,
        beforeState: beforeState,
        afterState: result,
        context,
      });
      return result;
    } catch (error) {
      rethrowKnownContentError(error);
      logger.error({ err: error }, 'ContentService Error in revertEntry:');
      throw new ApiError(500, SERVICE_ERRORS.REVERT_ENTRY_FAILED);
    }
  }
  async listEntryVersions(entryId: string, locale: string = DEFAULT_LOCALE) {
    try {
      logger.info({ entryId, locale }, 'ContentService: listEntryVersions');
      return await this.repository.listEntryVersions(entryId, locale);
    } catch (error) {
      rethrowKnownContentError(error);
      logger.error(
        { err: error },
        'ContentService Error in listEntryVersions:',
      );
      throw new ApiError(500, SERVICE_ERRORS.LIST_ENTRY_VERSIONS_FAILED);
    }
  }
  async deleteEntry(entryId: string, applicationId?: string) {
    try {
      logger.info(
        { entryId, applicationId },
        'ContentService: deleteEntry start',
      );
      // Capture BEFORE state
      logger.debug({ entryId }, 'ContentService: fetching beforeState');
      const beforeState = await this.repository.getEntryById(
        entryId,
        DEFAULT_LOCALE,
        undefined,
        applicationId,
      );
      // Perform mutation
      logger.debug({ entryId }, 'ContentService: mutating data');
      const result = await this.repository.deleteEntry(entryId, applicationId);
      // Emit audit event
      logger.debug({ entryId }, 'ContentService: emitting audit log');
      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.DELETE,
        resourceType: 'content',
        resourceId: entryId,
        actorUserId,
        actorAgentId,
        beforeState: beforeState,
        afterState: null,
        context,
      });
      return result;
    } catch (error) {
      rethrowKnownContentError(error);
      logger.error({ err: error }, 'ContentService Error in deleteEntry:');
      throw new ApiError(500, SERVICE_ERRORS.DELETE_ENTRY_FAILED);
    }
  }
}
