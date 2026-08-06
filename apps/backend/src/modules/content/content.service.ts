import { ContentRepository } from '@repo/repository';
import { DEFAULT_LOCALE } from '@repo/constants';
import { logger } from '@repo/logger';
import { eventBus } from '@repo/events';
import { EVENT_NAMES, AUDIT_ACTIONS } from '@repo/constants';
import type { ContentQueryOptions } from '@repo/types';
import { ApiError } from '@repo/utils';

import { getAuditContext } from '../../utils/audit.js';
import { SERVICE_ERRORS } from '../../utils/error-constants.js';

export class ContentService {
  private repository: ContentRepository;

  constructor() {
    this.repository = new ContentRepository();
  }

  async listEntries(
    schemaId: string,
    locale: string = DEFAULT_LOCALE,
    query?: ContentQueryOptions,
  ) {
    try {
      logger.info({ schemaId, locale }, 'ContentService: listEntries');
      return await this.repository.listEntries(schemaId, locale, query);
    } catch (error) {
      logger.error({ err: error }, 'ContentService Error in listEntries:');
      throw new ApiError(500, SERVICE_ERRORS.LIST_ENTRIES_FAILED);
    }
  }

  async countEntries(
    schemaId: string,
    locale: string = DEFAULT_LOCALE,
    query?: ContentQueryOptions,
  ) {
    try {
      logger.info({ schemaId, locale }, 'ContentService: countEntries');
      return await this.repository.countEntries(schemaId, locale, query?.where);
    } catch (error) {
      logger.error({ err: error }, 'ContentService Error in countEntries:');
      throw new ApiError(500, SERVICE_ERRORS.COUNT_ENTRIES_FAILED);
    }
  }

  async getEntryById(
    entryId: string,
    locale: string = DEFAULT_LOCALE,
    schemaId?: string,
  ) {
    try {
      logger.info(
        { entryId, locale, schemaId },
        'ContentService: getEntryById',
      );
      return await this.repository.getEntryById(entryId, locale, schemaId);
    } catch (error) {
      logger.error({ err: error }, 'ContentService Error in getEntryById:');
      throw new ApiError(500, SERVICE_ERRORS.FETCH_ENTRY_FAILED);
    }
  }

  async createDraft(
    schemaId: string,
    data: Record<string, unknown>,
    userId: string,
    locale: string = DEFAULT_LOCALE,
  ) {
    try {
      logger.info({ schemaId, userId }, 'ContentService: createDraft start');
      const result = await this.repository.createEntry(
        schemaId,
        data,
        userId,
        locale,
      );

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
      logger.error({ err: error }, 'ContentService Error in createDraft:');
      throw new ApiError(500, SERVICE_ERRORS.CREATE_DRAFT_FAILED);
    }
  }

  async updateDraft(
    entryId: string,
    data: Record<string, unknown>,
    userId: string,
    locale: string = DEFAULT_LOCALE,
  ) {
    try {
      logger.info({ entryId, userId }, 'ContentService: updateDraft start');

      // Capture BEFORE state
      logger.debug({ entryId }, 'ContentService: fetching beforeState');
      const beforeState = await this.repository.getEntryById(entryId, locale);

      // Perform mutation
      logger.debug({ entryId }, 'ContentService: mutating data');
      const result = await this.repository.updateEntryDraft(
        entryId,
        data,
        userId,
        locale,
      );

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
      logger.error({ err: error }, 'ContentService Error in updateDraft:');
      throw new ApiError(500, SERVICE_ERRORS.UPDATE_DRAFT_FAILED);
    }
  }

  async publishEntry(
    entryId: string,
    userId: string,
    locale: string = DEFAULT_LOCALE,
  ) {
    try {
      logger.info({ entryId, userId }, 'ContentService: publishEntry start');

      // Capture BEFORE state
      logger.debug({ entryId }, 'ContentService: fetching beforeState');
      const beforeState = await this.repository.getEntryById(entryId, locale);

      // Perform mutation
      logger.debug({ entryId }, 'ContentService: mutating data');
      const result = await this.repository.publishEntry(
        entryId,
        userId,
        locale,
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
      logger.error({ err: error }, 'ContentService Error in publishEntry:');
      throw new ApiError(500, SERVICE_ERRORS.PUBLISH_ENTRY_FAILED);
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
      logger.error({ err: error }, 'ContentService Error in revertEntry:');
      throw new ApiError(500, SERVICE_ERRORS.REVERT_ENTRY_FAILED);
    }
  }

  async listEntryVersions(entryId: string, locale: string = DEFAULT_LOCALE) {
    try {
      logger.info({ entryId, locale }, 'ContentService: listEntryVersions');
      return await this.repository.listEntryVersions(entryId, locale);
    } catch (error) {
      logger.error(
        { err: error },
        'ContentService Error in listEntryVersions:',
      );
      throw new ApiError(500, SERVICE_ERRORS.LIST_ENTRY_VERSIONS_FAILED);
    }
  }

  async deleteEntry(entryId: string) {
    try {
      logger.info({ entryId }, 'ContentService: deleteEntry start');

      // Capture BEFORE state
      logger.debug({ entryId }, 'ContentService: fetching beforeState');
      const beforeState = await this.repository.getEntryById(entryId);

      // Perform mutation
      logger.debug({ entryId }, 'ContentService: mutating data');
      const result = await this.repository.deleteEntry(entryId);

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
      logger.error({ err: error }, 'ContentService Error in deleteEntry:');
      throw new ApiError(500, SERVICE_ERRORS.DELETE_ENTRY_FAILED);
    }
  }
}
