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
  /**
   * Optimistic concurrency guard: the version number the caller last read.
   * If the entry has moved on since, the write is rejected with
   * `ConcurrentModificationError` instead of silently clobbering a
   * concurrent edit. Omit only for writes that are intentionally
   * last-write-wins (e.g. system-generated versions).
   */
  expectedLatestVersionNo?: number;
}

export interface EntryVersionResult {
  version: typeof contentVersions.$inferSelect;
  localization: typeof entryLocalizations.$inferSelect;
}

/**
 * Writes a new content version and keeps `entry_localizations` (the
 * current-state read path) in sync in the same transaction. Per the
 * schema's documented invariant, these two tables must never drift —
 * `entry_localizations` is a denormalized projection of the latest
 * `content_versions` row, kept separate purely for read performance.
 *
 * Handles two concrete race conditions:
 *
 * 1. **Version-number collisions.** Two concurrent writers to the same
 *    entry+locale must never compute the same "next" version_no. This is
 *    serialized with a transaction-scoped Postgres advisory lock keyed to
 *    `(entryId, locale)` — writers to the *same* entry+locale queue up for
 *    the brief moment it takes to read-latest-and-insert; writers to
 *    *different* entries never contend, since the lock key is scoped per
 *    entry. (An earlier version of this function tried optimistic
 *    insert-and-retry-on-conflict instead: it doesn't work, because
 *    Postgres aborts the *entire* transaction on the first constraint
 *    violation, and even wrapped in savepoints, a naive "retry N times"
 *    budget doesn't scale — under M-way concurrency a losing writer can
 *    need up to M retries to find a free slot. The advisory lock avoids
 *    the problem entirely instead of budgeting around it.)
 *
 * 2. **Lost updates.** If the caller passes `expectedLatestVersionNo`, the
 *    check happens *after* acquiring the same advisory lock used for
 *    version-number allocation, so it's judged against a value no
 *    concurrent writer can change out from under it. A stale value throws
 *    `ConcurrentModificationError` instead of silently overwriting another
 *    editor's concurrent change — the caller re-fetches and lets the user
 *    decide.
 */
export async function createEntryVersion(
  db: Database,
  input: CreateEntryVersionInput,
): Promise<EntryVersionResult> {
  return withTransaction(db, async (tx) => {
    const entry = await tx.query.contentEntries.findFirst({
      where: eq(contentEntries.id, input.entryId),
      columns: { id: true, deletedAt: true },
    });

    if (!entry || entry.deletedAt) {
      throw new RecordNotFoundError(
        `Content entry ${input.entryId} does not exist or has been deleted.`,
      );
    }

    // Released automatically at transaction end (commit or rollback) — no
    // separate unlock call needed, and no risk of leaking the lock if an
    // error is thrown below.
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
  const [latest] = await db
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

  return latest?.versionNo ?? 0;
}
