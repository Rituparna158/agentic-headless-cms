import { eq, and, isNull, sql, desc, type SQL } from 'drizzle-orm';
import { getDatabaseAdapter } from '../../config/database.js';
import {
  schemas,
  contentEntries,
  contentVersions,
  entryLocalizations,
  createEntryVersion,
  withTransaction,
} from '@repo/shared-db';
import { RecordNotFoundError } from '@repo/shared-db';
import { DEFAULT_LOCALE } from '@repo/shared-types';
import { ContentQueryOptions } from '../../types/content.types.js';

export class ContentRepository {
  private get db() {
    return getDatabaseAdapter().getDb();
  }

  async getSchemaBySlug(slug: string) {
    const [schema] = await this.db
      .select()
      .from(schemas)
      .where(eq(schemas.slug, slug))
      .limit(1);

    return schema || null;
  }

  async listEntries(
    schemaId: string,
    locale: string = DEFAULT_LOCALE,
    query?: ContentQueryOptions,
  ) {
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
      return rows
        .orderBy(...query.orderBy)
        .limit(query.limit)
        .offset(query.offset);
    }

    return rows;
  }

  /** Total matching row count for `listEntries` — used to compute pagination meta without over-fetching. */
  async countEntries(
    schemaId: string,
    locale: string = DEFAULT_LOCALE,
    filterWhere?: SQL,
  ) {
    const baseWhere = and(
      eq(contentEntries.schemaId, schemaId),
      isNull(contentEntries.deletedAt),
    );
    const where = filterWhere ? and(baseWhere, filterWhere) : baseWhere;

    const [result] = await this.db
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

    return result?.count ?? 0;
  }

  async getEntryById(
    entryId: string,
    locale: string = DEFAULT_LOCALE,
    schemaId?: string,
  ) {
    const conditions = [
      eq(contentEntries.id, entryId),
      isNull(contentEntries.deletedAt),
    ];
    // When called from a :schemaSlug-scoped route, also require the entry to
    // actually belong to that schema — otherwise GET /:schemaSlug/:entryId
    // would happily return an entry from a completely different schema.
    if (schemaId) {
      conditions.push(eq(contentEntries.schemaId, schemaId));
    }

    const [entry] = await this.db
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

    return entry || null;
  }

  async createEntry(
    schemaId: string,
    data: Record<string, unknown>,
    userId: string,
    locale: string = DEFAULT_LOCALE,
  ) {
    return withTransaction(this.db, async (tx) => {
      // 1. Create the parent entry row
      const [newEntry] = await tx
        .insert(contentEntries)
        .values({
          schemaId,
          actorType: 'user',
          createdByUserId: userId,
        })
        .returning();

      if (!newEntry) {
        throw new Error('Failed to create entry');
      }

      // 2. Create the first version (draft)
      const versionResult = await createEntryVersion(tx, {
        entryId: newEntry.id,
        locale,
        data,
        status: 'draft',
        actorType: 'user',
        createdByUserId: userId,
        comment: 'Initial draft',
      });

      return {
        entryId: newEntry.id,
        localization: versionResult.localization,
      };
    });
  }

  async updateEntryDraft(
    entryId: string,
    data: Record<string, unknown>,
    userId: string,
    locale: string = DEFAULT_LOCALE,
  ) {
    const versionResult = await createEntryVersion(this.db, {
      entryId,
      locale,
      data,
      status: 'draft',
      actorType: 'user',
      createdByUserId: userId,
      comment: 'Updated draft',
    });

    return versionResult.localization;
  }

  async publishEntry(
    entryId: string,
    userId: string,
    locale: string = DEFAULT_LOCALE,
  ) {
    const entry = await this.getEntryById(entryId, locale);
    if (!entry) {
      throw new RecordNotFoundError('Entry not found');
    }

    const versionResult = await createEntryVersion(this.db, {
      entryId,
      locale,
      data: entry.data,
      status: 'published',
      actorType: 'user',
      createdByUserId: userId,
      comment: 'Published entry',
    });

    return versionResult.localization;
  }

  async revertEntry(
    entryId: string,
    versionNo: number,
    userId: string,
    locale: string = DEFAULT_LOCALE,
  ) {
    // 1. Fetch historical version data
    const [historical] = await this.db
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

    if (!historical) {
      throw new RecordNotFoundError(`Version ${versionNo} not found`);
    }

    // 2. Create new draft from historical data
    const versionResult = await createEntryVersion(this.db, {
      entryId,
      locale,
      data: historical.data,
      status: 'draft',
      actorType: 'user',
      createdByUserId: userId,
      comment: `Reverted to version ${versionNo}`,
    });

    return versionResult.localization;
  }

  async listEntryVersions(entryId: string, locale: string = DEFAULT_LOCALE) {
    return this.db
      .select()
      .from(contentVersions)
      .where(
        and(
          eq(contentVersions.entryId, entryId),
          eq(contentVersions.locale, locale),
        ),
      )
      .orderBy(desc(contentVersions.versionNo));
  }

  async deleteEntry(entryId: string) {
    const [deleted] = await this.db
      .update(contentEntries)
      .set({ deletedAt: new Date() })
      .where(eq(contentEntries.id, entryId))
      .returning({ id: contentEntries.id });

    if (!deleted) {
      throw new RecordNotFoundError('Entry not found or already deleted');
    }

    return deleted;
  }
}
