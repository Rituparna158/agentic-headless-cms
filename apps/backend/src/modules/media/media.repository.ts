import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { mediaAssets, RecordNotFoundError } from '@repo/shared-db';
import { getDatabaseAdapter } from '../../config/database.js';
import type {
  CreateMediaAssetInput,
  ListMediaOptions,
} from '../../types/media.types.js';

export type MediaAssetRecord = typeof mediaAssets.$inferSelect;

export class MediaRepository {
  private get db() {
    return getDatabaseAdapter().getDb();
  }

  async create(input: CreateMediaAssetInput): Promise<MediaAssetRecord> {
    const [asset] = await this.db
      .insert(mediaAssets)
      .values({
        filename: input.filename,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        width: input.width ?? null,
        height: input.height ?? null,
        url: input.url,
        altText: input.altText ?? null,
        metadata: input.metadata ?? null,
        storageProvider: input.storageProvider,
        folderId: input.folderId ?? null,
        actorType: input.actorType,
        uploadedByUserId: input.uploadedByUserId ?? null,
        uploadedByAgentId: input.uploadedByAgentId ?? null,
      })
      .returning();

    if (!asset) {
      throw new RecordNotFoundError('Insert of media asset returned no row.');
    }

    return asset;
  }

  async findById(id: string): Promise<MediaAssetRecord | null> {
    const [asset] = await this.db
      .select()
      .from(mediaAssets)
      .where(and(eq(mediaAssets.id, id), isNull(mediaAssets.deletedAt)))
      .limit(1);

    return asset ?? null;
  }

  /**
   * Looks up an asset by its storage key (stashed in `metadata.storageKey`
   * at upload time — see media.service.ts) rather than its id. Needed
   * because the file-serving route is reached via the literal `url` a
   * client was given, which encodes the storage key, not the DB id.
   */
  async findByStorageKey(key: string): Promise<MediaAssetRecord | null> {
    const [asset] = await this.db
      .select()
      .from(mediaAssets)
      .where(
        and(
          isNull(mediaAssets.deletedAt),
          sql`${mediaAssets.metadata} ->> 'storageKey' = ${key}`,
        ),
      )
      .limit(1);

    return asset ?? null;
  }

  async list(
    options: ListMediaOptions,
  ): Promise<{ assets: MediaAssetRecord[]; total: number }> {
    const where = options.folderId
      ? and(
          isNull(mediaAssets.deletedAt),
          eq(mediaAssets.folderId, options.folderId),
        )
      : isNull(mediaAssets.deletedAt);

    const [assets, [countRow]] = await Promise.all([
      this.db
        .select()
        .from(mediaAssets)
        .where(where)
        .orderBy(desc(mediaAssets.createdAt))
        .limit(options.pageSize)
        .offset((options.page - 1) * options.pageSize),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(mediaAssets)
        .where(where),
    ]);

    return { assets, total: countRow?.count ?? 0 };
  }

  /** Soft-deletes the row (audit trail) — the caller is responsible for removing the underlying object from storage. */
  async softDelete(id: string): Promise<MediaAssetRecord> {
    const [deleted] = await this.db
      .update(mediaAssets)
      .set({ deletedAt: new Date() })
      .where(and(eq(mediaAssets.id, id), isNull(mediaAssets.deletedAt)))
      .returning();

    if (!deleted) {
      throw new RecordNotFoundError(
        `Media asset ${id} does not exist or is already deleted.`,
      );
    }

    return deleted;
  }
}
