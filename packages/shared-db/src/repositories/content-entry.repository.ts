import { and, desc, eq, sql } from 'drizzle-orm';
import type { Database } from '../client.js';
import { ConcurrentModificationError, RecordNotFoundError } from '../errors.js';
import {
  contentEntries,
  contentVersions,
  entryLocalizations,
} from '../schema/index.js';
import type { actorTypeEnum, versionStatusEnum } from '../schema/enums.js';
import { withTransaction } from '../transaction.js';
export interface CreateEntryVersionInput {
  entryId: string;
  locale: string;
  data: unknown;
  status: (typeof versionStatusEnum.enumValues)[number];
  actorType: (typeof actorTypeEnum.enumValues)[number];
  createdByUserId?: string | null;
  createdByAgentId?: string | null;
  comment?: string | null;
  expectedLatestVersionNo?: number;
}
export interface EntryVersionResult {
  version: typeof contentVersions.$inferSelect;
  localization: typeof entryLocalizations.$inferSelect;
}
export async function createEntryVersion(
  db: Database,
  input: CreateEntryVersionInput,
): Promise<EntryVersionResult> {
  return withTransaction(db, async (tx) => {
    const entry = await tx.query.contentEntries.findFirst({
      where: eq(contentEntries.id, input.entryId),
      columns: { id: true, applicationId: true, deletedAt: true },
    });
    if (!entry || entry.deletedAt) {
      throw new RecordNotFoundError(
        `Content entry ${input.entryId} does not exist or has been deleted.`,
      );
    }

    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${input.entryId} || ':' || ${input.locale}, 0))`,
    );
    const latestVersionNo = await getLatestVersionNo(
      tx,
      input.entryId,
      input.locale,
    );
    if (
      input.expectedLatestVersionNo !== undefined &&
      input.expectedLatestVersionNo !== latestVersionNo
    ) {
      throw new ConcurrentModificationError(
        `Entry ${input.entryId} (${input.locale}) is now at version ${latestVersionNo}, but the caller expected ${input.expectedLatestVersionNo}. Re-fetch and retry.`,
      );
    }
    const [version] = await tx
      .insert(contentVersions)
      .values({
        entryId: input.entryId,
        applicationId: entry.applicationId,
        locale: input.locale,
        versionNo: latestVersionNo + 1,
        status: input.status,
        data: input.data,
        actorType: input.actorType,
        createdByUserId: input.createdByUserId ?? null,
        createdByAgentId: input.createdByAgentId ?? null,
        comment: input.comment ?? null,
      })
      .returning();
    if (!version) {
      throw new RecordNotFoundError(
        'Insert of content version returned no row.',
      );
    }
    const isPublishing = input.status === 'published';
    const [localization] = await tx
      .insert(entryLocalizations)
      .values({
        entryId: input.entryId,
        applicationId: entry.applicationId,
        locale: input.locale,
        status: input.status,
        data: input.data,
        publishedData: isPublishing ? input.data : undefined,
        publishedAt: isPublishing ? new Date() : undefined,
      })
      .onConflictDoUpdate({
        target: [entryLocalizations.entryId, entryLocalizations.locale],
        set: {
          status: input.status,
          data: input.data,
          updatedAt: new Date(),
          ...(isPublishing
            ? { publishedData: input.data, publishedAt: new Date() }
            : {}),
        },
      })
      .returning();
    if (!localization) {
      throw new RecordNotFoundError('Failed to upsert entry localization.');
    }
    return { version, localization };
  });
}
/** Reads the current version number for an entry+locale — 0 if none exist yet. Used by callers to obtain `expectedLatestVersionNo` before editing. */
export async function getLatestVersionNo(
  db: Database,
  entryId: string,
  locale: string,
): Promise<number> {
  const [latest] = await withTransaction(db, async (tx) => {
    return await tx
      .select({ versionNo: contentVersions.versionNo })
      .from(contentVersions)
      .where(
        and(
          eq(contentVersions.entryId, entryId),
          eq(contentVersions.locale, locale),
        ),
      )
      .orderBy(desc(contentVersions.versionNo))
      .limit(1);
  });
  return latest?.versionNo ?? 0;
}
