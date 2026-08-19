import { eq, and, isNull, sql, desc, SQL } from 'drizzle-orm';
import { getDatabaseAdapter } from '@repo/config';
import { logger } from '@repo/logger';
import { ApiError } from '@repo/utils';
import {
  schemas,
  contentEntries,
  contentVersions,
  entryLocalizations,
  createEntryVersion,
  withTransaction,
  RecordNotFoundError,
} from '@repo/shared-db';
import { DEFAULT_LOCALE } from '@repo/constants';
import type { ContentQueryOptions } from '@repo/types';
import { isDeepStrictEqual } from 'node:util';
import { REPO_ERRORS } from './error-constants.js';
export class ContentRepository {
  private get db() {
    return getDatabaseAdapter().getDb();
  }
  async getSchemaBySlug(slug: string, applicationId?: string) {
    try {
      logger.info(
        { slug, applicationId },
        'ContentRepository: fetching schema by slug',
      );
      const conditions = [eq(schemas.slug, slug)];
      if (applicationId) {
        conditions.push(eq(schemas.applicationId, applicationId));
      }
      const [schema] = await withTransaction(this.db, async (tx) => {
        return await tx
          .select()
          .from(schemas)
          .where(and(...conditions))
          .limit(1);
      });
      logger.debug(
        { found: !!schema },
        'ContentRepository: fetched schema by slug result',
      );
      return schema || null;
    } catch (error) {
      logger.error(
        { err: error },
        'ContentRepository Error in getSchemaBySlug:',
      );
      throw new ApiError(500, REPO_ERRORS.FETCH_SCHEMA_FAILED);
    }
  }
  async listEntries(
    schemaId: string,
    locale: string = DEFAULT_LOCALE,
    query?: ContentQueryOptions,
  ) {
    try {
      logger.info(
        { schemaId, locale, hasQuery: !!query },
        'ContentRepository: listing entries',
      );
      const baseWhere = and(
        eq(contentEntries.schemaId, schemaId),
        isNull(contentEntries.deletedAt),
      );
      const where = query?.where ? and(baseWhere, query.where) : baseWhere;
      const rows = this.db
        .select({
          id: contentEntries.id,
          status: entryLocalizations.status,
          data: entryLocalizations.data,
          publishedData: entryLocalizations.publishedData,
          createdAt: contentEntries.createdAt,
          updatedAt: contentEntries.updatedAt,
        })
        .from(contentEntries)
        .innerJoin(
          entryLocalizations,
          and(
            eq(contentEntries.id, entryLocalizations.entryId),
            eq(entryLocalizations.locale, locale),
          ),
        )
        .where(where);
      if (query) {
        logger.debug(
          { limit: query.limit, offset: query.offset },
          'ContentRepository: applying pagination to listEntries',
        );
        const results = await rows
          .orderBy(...query.orderBy)
          .limit(query.limit)
          .offset(query.offset);
        logger.info(
          { count: results.length },
          'ContentRepository: listEntries complete',
        );
        return results;
      }
      const results = await rows;
      logger.info(
        { count: results.length },
        'ContentRepository: listEntries complete',
      );
      return results;
    } catch (error) {
      logger.error({ err: error }, 'ContentRepository Error in listEntries:');
      throw new ApiError(500, REPO_ERRORS.LIST_ENTRIES_FAILED);
    }
  }
  async countEntries(
    schemaId: string,
    locale: string = DEFAULT_LOCALE,
    filterWhere?: SQL,
  ) {
    try {
      logger.info(
        { schemaId, locale, hasFilter: !!filterWhere },
        'ContentRepository: counting entries',
      );
      const baseWhere = and(
        eq(contentEntries.schemaId, schemaId),
        isNull(contentEntries.deletedAt),
      );
      const where = filterWhere ? and(baseWhere, filterWhere) : baseWhere;
      const [result] = await withTransaction(this.db, async (tx) => {
        return await tx
          .select({ count: sql<number>`count(*)::int` })
          .from(contentEntries)
          .innerJoin(
            entryLocalizations,
            and(
              eq(contentEntries.id, entryLocalizations.entryId),
              eq(entryLocalizations.locale, locale),
            ),
          )
          .where(where);
      });
      logger.debug(
        { count: result?.count ?? 0 },
        'ContentRepository: countEntries result',
      );
      return result?.count ?? 0;
    } catch (error) {
      logger.error({ err: error }, 'ContentRepository Error in countEntries:');
      throw new ApiError(500, REPO_ERRORS.COUNT_ENTRIES_FAILED);
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
        'ContentRepository: fetching entry by ID',
      );
      const conditions = [
        eq(contentEntries.id, entryId),
        isNull(contentEntries.deletedAt),
      ];
      if (schemaId) {
        conditions.push(eq(contentEntries.schemaId, schemaId));
      }
      const [entry] = await withTransaction(this.db, async (tx) => {
        return await tx
          .select({
            id: contentEntries.id,
            schemaId: contentEntries.schemaId,
            status: entryLocalizations.status,
            data: entryLocalizations.data,
            publishedData: entryLocalizations.publishedData,
          })
          .from(contentEntries)
          .innerJoin(
            entryLocalizations,
            and(
              eq(contentEntries.id, entryLocalizations.entryId),
              eq(entryLocalizations.locale, locale),
            ),
          )
          .where(and(...conditions))
          .limit(1);
      });
      logger.debug(
        { found: !!entry },
        'ContentRepository: fetched entry by ID result',
      );
      return entry || null;
    } catch (error) {
      logger.error({ err: error }, 'ContentRepository Error in getEntryById:');
      throw new ApiError(500, REPO_ERRORS.FETCH_ENTRY_FAILED);
    }
  }
  async createEntry(
    schemaId: string,
    data: Record<string, unknown>,
    userId: string,
    locale: string = DEFAULT_LOCALE,
    options: { applicationId?: string } = {},
  ) {
    try {
      logger.info(
        { schemaId, userId, locale },
        'ContentRepository: creating entry',
      );
      return await withTransaction(this.db, async (tx) => {
        logger.debug('ContentRepository: inserting contentEntries row');
        const [newEntry] = await tx
          .insert(contentEntries)
          .values({
            schemaId,
            actorType: 'user',
            createdByUserId: userId,
            ...(options.applicationId
              ? { applicationId: options.applicationId }
              : {}),
          })
          .returning();
        if (!newEntry) {
          logger.error(
            'ContentRepository: failed to insert contentEntries row',
          );
          throw new ApiError(500, REPO_ERRORS.CREATE_ENTRY_FAILED);
        }
        logger.debug(
          { entryId: newEntry.id },
          'ContentRepository: creating initial entry version',
        );
        const versionResult = await createEntryVersion(tx, {
          entryId: newEntry.id,
          locale,
          data,
          status: 'draft',
          actorType: 'user',
          createdByUserId: userId,
          comment: 'Initial draft',
        });
        logger.info(
          { entryId: newEntry.id },
          'ContentRepository: createEntry complete',
        );
        return {
          id: newEntry.id,
          schemaId: newEntry.schemaId,
          status: versionResult.localization.status,
          data: versionResult.localization.data,
          publishedData: versionResult.localization.publishedData,
        };
      });
    } catch (error) {
      logger.error({ err: error }, 'ContentRepository Error in createEntry:');
      throw new ApiError(500, REPO_ERRORS.CREATE_ENTRY_FAILED);
    }
  }
  async updateEntryDraft(
    entryId: string,
    data: Record<string, unknown>,
    userId: string,
    locale: string = DEFAULT_LOCALE,
  ) {
    try {
      logger.info(
        { entryId, userId, locale },
        'ContentRepository: updating entry draft',
      );
      const currentEntry = await this.getEntryById(entryId, locale);
      if (currentEntry && isDeepStrictEqual(currentEntry.data, data)) {
        logger.debug('ContentRepository: no changes detected, skipping update');
        return currentEntry;
      }
      logger.debug('ContentRepository: creating new draft version');
      await createEntryVersion(this.db, {
        entryId,
        locale,
        data,
        status: 'draft',
        actorType: 'user',
        createdByUserId: userId,
        comment: 'Updated draft',
      });
      const updatedEntry = await this.getEntryById(entryId, locale);
      if (!updatedEntry) {
        logger.error(
          { entryId },
          'ContentRepository: failed to fetch updated entry',
        );
        throw new ApiError(500, REPO_ERRORS.FETCH_ENTRY_FAILED);
      }
      logger.info({ entryId }, 'ContentRepository: updateEntryDraft complete');
      return updatedEntry;
    } catch (error) {
      logger.error(
        { err: error },
        'ContentRepository Error in updateEntryDraft:',
      );
      throw new ApiError(500, REPO_ERRORS.UPDATE_ENTRY_FAILED);
    }
  }
  async publishEntry(
    entryId: string,
    userId: string,
    locale: string = DEFAULT_LOCALE,
  ) {
    try {
      logger.info(
        { entryId, userId, locale },
        'ContentRepository: publishing entry',
      );
      const entry = await this.getEntryById(entryId, locale);
      if (!entry) {
        logger.error(
          { entryId },
          'ContentRepository: entry not found for publishing',
        );
        throw new RecordNotFoundError('Entry not found');
      }
      logger.debug('ContentRepository: creating published version');
      await createEntryVersion(this.db, {
        entryId,
        locale,
        data: entry.data,
        status: 'published',
        actorType: 'user',
        createdByUserId: userId,
        comment: 'Published entry',
      });
      const publishedEntry = await this.getEntryById(entryId, locale);
      if (!publishedEntry) {
        logger.error(
          { entryId },
          'ContentRepository: failed to fetch published entry',
        );
        throw new ApiError(500, REPO_ERRORS.FETCH_ENTRY_FAILED);
      }
      logger.info({ entryId }, 'ContentRepository: publishEntry complete');
      return publishedEntry;
    } catch (error) {
      logger.error({ err: error }, 'ContentRepository Error in publishEntry:');
      if (error instanceof RecordNotFoundError) throw error;
      throw new ApiError(500, REPO_ERRORS.PUBLISH_ENTRY_FAILED);
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
        { entryId, versionNo, userId, locale },
        'ContentRepository: reverting entry',
      );
      const [historical] = await withTransaction(this.db, async (tx) => {
        return await tx
          .select({ data: contentVersions.data })
          .from(contentVersions)
          .where(
            and(
              eq(contentVersions.entryId, entryId),
              eq(contentVersions.locale, locale),
              eq(contentVersions.versionNo, versionNo),
            ),
          )
          .limit(1);
      });
      if (!historical) {
        logger.error(
          { entryId, versionNo },
          'ContentRepository: historical version not found',
        );
        throw new RecordNotFoundError(`Version ${versionNo} not found`);
      }
      logger.debug('ContentRepository: creating reverted version');
      await createEntryVersion(this.db, {
        entryId,
        locale,
        data: historical.data,
        status: 'draft',
        actorType: 'user',
        createdByUserId: userId,
        comment: `Reverted to version ${versionNo}`,
      });
      const revertedEntry = await this.getEntryById(entryId, locale);
      if (!revertedEntry) {
        logger.error(
          { entryId },
          'ContentRepository: failed to fetch reverted entry',
        );
        throw new ApiError(500, REPO_ERRORS.FETCH_ENTRY_FAILED);
      }
      logger.info({ entryId }, 'ContentRepository: revertEntry complete');
      return revertedEntry;
    } catch (error) {
      logger.error({ err: error }, 'ContentRepository Error in revertEntry:');
      if (error instanceof RecordNotFoundError) throw error;
      throw new ApiError(500, REPO_ERRORS.REVERT_ENTRY_FAILED);
    }
  }
  async listEntryVersions(entryId: string, locale: string = DEFAULT_LOCALE) {
    try {
      logger.info(
        { entryId, locale },
        'ContentRepository: listing entry versions',
      );
      const versions = await withTransaction(this.db, async (tx) => {
        return await tx
          .select()
          .from(contentVersions)
          .where(
            and(
              eq(contentVersions.entryId, entryId),
              eq(contentVersions.locale, locale),
            ),
          )
          .orderBy(desc(contentVersions.versionNo));
      });
      logger.debug(
        { count: versions.length },
        'ContentRepository: listEntryVersions complete',
      );
      return versions;
    } catch (error) {
      logger.error(
        { err: error },
        'ContentRepository Error in listEntryVersions:',
      );
      throw new ApiError(500, REPO_ERRORS.LIST_ENTRY_VERSIONS_FAILED);
    }
  }
  async deleteEntry(entryId: string) {
    try {
      logger.info({ entryId }, 'ContentRepository: deleting entry');
      const [deleted] = await withTransaction(this.db, async (tx) => {
        return await tx
          .update(contentEntries)
          .set({ deletedAt: new Date() })
          .where(eq(contentEntries.id, entryId))
          .returning({ id: contentEntries.id });
      });
      if (!deleted) {
        logger.error(
          { entryId },
          'ContentRepository: entry not found or already deleted',
        );
        throw new RecordNotFoundError('Entry not found or already deleted');
      }
      logger.info({ entryId }, 'ContentRepository: deleteEntry complete');
      return deleted;
    } catch (error) {
      logger.error({ err: error }, 'ContentRepository Error in deleteEntry:');
      if (error instanceof RecordNotFoundError) throw error;
      throw new ApiError(500, REPO_ERRORS.DELETE_ENTRY_FAILED);
    }
  }
}
