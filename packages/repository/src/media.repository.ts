import { and, desc, eq, isNull, sql, inArray } from 'drizzle-orm';
import {
  mediaAssets,
  RecordNotFoundError,
  withTransaction,
} from '@repo/shared-db';
import { getDatabaseAdapter } from '@repo/config';
import { logger } from '@repo/logger';
import type { CreateMediaAssetInput, ListMediaOptions } from '@repo/types';
import { ApiError } from '@repo/utils';
import { REPO_ERRORS } from './error-constants.js';
export type MediaAssetRecord = typeof mediaAssets.$inferSelect;
export class MediaRepository {
  private get db() {
    return getDatabaseAdapter().getDb();
  }
  async create(
    input: CreateMediaAssetInput,
    options: { applicationId?: string } = {},
  ): Promise<MediaAssetRecord> {
    try {
      logger.info(
        { filename: input.filename },
        'MediaRepository: creating media asset',
      );
      const [asset] = await withTransaction(this.db, async (tx) => {
        return await tx
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
            ...(options.applicationId
              ? { applicationId: options.applicationId }
              : {}),
          })
          .returning();
      });
      if (!asset) {
        logger.error(
          { filename: input.filename },
          'MediaRepository: insert of media asset returned no row',
        );
        throw new RecordNotFoundError('Insert of media asset returned no row.');
      }
      logger.debug({ assetId: asset.id }, 'MediaRepository: create complete');
      return asset;
    } catch (error) {
      logger.error({ err: error }, 'MediaRepository Error in create:');
      if (error instanceof RecordNotFoundError) throw error;
      throw new ApiError(500, REPO_ERRORS.CREATE_MEDIA_FAILED);
    }
  }
  async findById(
    id: string,
    applicationId?: string,
  ): Promise<MediaAssetRecord | null> {
    try {
      logger.info({ id }, 'MediaRepository: finding media asset by ID');
      const conditions = [
        eq(mediaAssets.id, id),
        isNull(mediaAssets.deletedAt),
      ];
      if (applicationId)
        conditions.push(eq(mediaAssets.applicationId, applicationId));
      const [asset] = await withTransaction(this.db, async (tx) => {
        return await tx
          .select()
          .from(mediaAssets)
          .where(and(...conditions))
          .limit(1);
      });
      logger.debug({ found: !!asset }, 'MediaRepository: findById result');
      return asset ?? null;
    } catch (error) {
      logger.error({ err: error }, 'MediaRepository Error in findById:');
      throw new ApiError(500, REPO_ERRORS.FETCH_MEDIA_FAILED);
    }
  }
  async findByStorageKey(
    key: string,
    applicationId?: string,
  ): Promise<MediaAssetRecord | null> {
    try {
      logger.info(
        { key },
        'MediaRepository: finding media asset by storage key',
      );
      const conditions: import('drizzle-orm').SQL[] = [
        isNull(mediaAssets.deletedAt),
        sql`${mediaAssets.metadata} ->> 'storageKey' = ${key}`,
      ];
      if (applicationId)
        conditions.push(eq(mediaAssets.applicationId, applicationId));
      const [asset] = await withTransaction(this.db, async (tx) => {
        return await tx
          .select()
          .from(mediaAssets)
          .where(and(...conditions))
          .limit(1);
      });
      logger.debug(
        { found: !!asset },
        'MediaRepository: findByStorageKey result',
      );
      return asset ?? null;
    } catch (error) {
      logger.error(
        { err: error },
        'MediaRepository Error in findByStorageKey:',
      );
      throw new ApiError(500, REPO_ERRORS.FETCH_MEDIA_FAILED);
    }
  }
  async list(
    options: ListMediaOptions,
  ): Promise<{ assets: MediaAssetRecord[]; total: number }> {
    try {
      logger.info({ options }, 'MediaRepository: listing media assets');
      const baseWhere =
        options.folderId === 'root'
          ? and(isNull(mediaAssets.deletedAt), isNull(mediaAssets.folderId))
          : options.folderId
            ? and(
                isNull(mediaAssets.deletedAt),
                eq(mediaAssets.folderId, options.folderId),
              )
            : isNull(mediaAssets.deletedAt);
      const where = options.applicationId
        ? and(baseWhere, eq(mediaAssets.applicationId, options.applicationId))
        : baseWhere;
      const page = options.page ?? 1;
      const pageSize = options.pageSize ?? 10;
      const [assets, [countRow]] = await Promise.all([
        this.db
          .select()
          .from(mediaAssets)
          .where(where)
          .orderBy(desc(mediaAssets.createdAt))
          .limit(pageSize)
          .offset((page - 1) * pageSize),
        this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(mediaAssets)
          .where(where),
      ]);
      logger.debug(
        { count: assets.length, total: countRow?.count ?? 0 },
        'MediaRepository: list complete',
      );
      return { assets, total: countRow?.count ?? 0 };
    } catch (error) {
      logger.error({ err: error }, 'MediaRepository Error in list:');
      throw new ApiError(500, REPO_ERRORS.LIST_MEDIA_FAILED);
    }
  }
  async softDelete(id: string): Promise<MediaAssetRecord> {
    try {
      logger.info({ id }, 'MediaRepository: soft deleting media asset');
      const [deleted] = await withTransaction(this.db, async (tx) => {
        return await tx
          .update(mediaAssets)
          .set({ deletedAt: new Date() })
          .where(and(eq(mediaAssets.id, id), isNull(mediaAssets.deletedAt)))
          .returning();
      });
      if (!deleted) {
        logger.error(
          { id },
          'MediaRepository: softDelete failed, media asset does not exist or already deleted',
        );
        throw new RecordNotFoundError(
          `Media asset ${id} does not exist or is already deleted.`,
        );
      }
      logger.info({ id }, 'MediaRepository: softDelete complete');
      return deleted;
    } catch (error) {
      logger.error({ err: error }, 'MediaRepository Error in softDelete:');
      if (error instanceof RecordNotFoundError) throw error;
      throw new ApiError(500, REPO_ERRORS.DELETE_MEDIA_FAILED);
    }
  }
  async softDeleteBulk(ids: string[]): Promise<MediaAssetRecord[]> {
    try {
      logger.info(
        { ids },
        'MediaRepository: soft deleting media assets in bulk',
      );
      const deleted = await withTransaction(this.db, async (tx) => {
        return await tx
          .update(mediaAssets)
          .set({ deletedAt: new Date() })
          .where(
            and(inArray(mediaAssets.id, ids), isNull(mediaAssets.deletedAt)),
          )
          .returning();
      });
      logger.info(
        { count: deleted.length },
        'MediaRepository: softDeleteBulk complete',
      );
      return deleted;
    } catch (error) {
      logger.error({ err: error }, 'MediaRepository Error in softDeleteBulk:');
      throw new ApiError(500, 'Failed to bulk delete media assets.');
    }
  }
}
