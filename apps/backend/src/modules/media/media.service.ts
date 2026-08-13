import { ERROR_MESSAGES } from '@repo/constants';
import { getStorageAdapter } from '@repo/config';
import { NotFoundError, ApiError } from '@repo/utils';
import { logger } from '@repo/logger';
import { eventBus } from '@repo/events';
import { EVENT_NAMES, AUDIT_ACTIONS } from '@repo/constants';
import { MediaRepository, type MediaAssetRecord } from '@repo/repository';
import type {
  UploadMediaInput,
  ServedFile,
  ListMediaOptions,
} from '@repo/types';
import {
  readImageDimensions,
  resizeImage,
  type ResizeOptions,
  buildStorageKey,
  extractStorageKey,
} from '@repo/storage';
import { getAuditContext } from '../../utils/audit.js';
import { SERVICE_ERRORS } from '../../utils/error-constants.js';

export class MediaService {
  private repository = new MediaRepository();

  async upload(input: UploadMediaInput): Promise<MediaAssetRecord> {
    try {
      logger.info(
        { filename: input.originalFilename },
        'MediaService: upload start',
      );
      const storage = getStorageAdapter();
      const key = buildStorageKey(input.originalFilename);

      logger.debug('MediaService: reading image dimensions');
      const dimensions = await readImageDimensions(input.buffer);

      logger.debug('MediaService: writing file to storage');
      const { url } = await storage.write(key, input.buffer, input.mimeType);

      logger.debug('MediaService: creating DB asset record');
      const asset = await this.repository.create({
        filename: input.originalFilename,
        mimeType: input.mimeType,
        sizeBytes: input.buffer.length,
        width: dimensions?.width,
        height: dimensions?.height,
        url,
        altText: input.altText,
        metadata: { storageKey: key },
        storageProvider: storage.providerName,
        folderId: input.folderId,
        actorType: 'user',
        uploadedByUserId: input.actorUserId,
      });

      logger.debug(
        { assetId: asset.id },
        'MediaService: upload success, emitting audit log',
      );
      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.CREATE,
        resourceType: 'media',
        resourceId: asset.id,
        actorUserId: actorUserId || input.actorUserId,
        actorAgentId,
        beforeState: null,
        afterState: asset,
        context,
      });

      return asset;
    } catch (error) {
      logger.error({ err: error }, 'MediaService Error in upload:');
      throw new ApiError(500, SERVICE_ERRORS.UPLOAD_MEDIA_FAILED);
    }
  }

  async list(options: ListMediaOptions) {
    try {
      logger.info({ options }, 'MediaService: list');
      return await this.repository.list(options);
    } catch (error) {
      logger.error({ err: error }, 'MediaService Error in list:');
      throw new ApiError(500, SERVICE_ERRORS.LIST_MEDIA_FAILED);
    }
  }

  async getById(id: string): Promise<MediaAssetRecord> {
    try {
      logger.info({ id }, 'MediaService: getById');
      const asset = await this.repository.findById(id);
      if (!asset) {
        logger.error({ id }, 'MediaService: asset not found by ID');
        throw new NotFoundError(ERROR_MESSAGES.MEDIA.ASSET_NOT_FOUND);
      }
      return asset;
    } catch (error) {
      logger.error({ err: error }, 'MediaService Error in getById:');
      if (error instanceof NotFoundError) throw error;
      throw new ApiError(500, SERVICE_ERRORS.FETCH_MEDIA_FAILED);
    }
  }

  async getByStorageKey(key: string): Promise<MediaAssetRecord> {
    try {
      logger.info({ key }, 'MediaService: getByStorageKey');
      const asset = await this.repository.findByStorageKey(key);
      if (!asset) {
        logger.error({ key }, 'MediaService: asset not found by storage key');
        throw new NotFoundError(ERROR_MESSAGES.MEDIA.ASSET_NOT_FOUND);
      }
      return asset;
    } catch (error) {
      logger.error({ err: error }, 'MediaService Error in getByStorageKey:');
      if (error instanceof NotFoundError) throw error;
      throw new ApiError(500, SERVICE_ERRORS.FETCH_MEDIA_FAILED);
    }
  }

  async getFile(
    asset: MediaAssetRecord,
    resize?: ResizeOptions,
  ): Promise<ServedFile> {
    try {
      logger.info({ assetId: asset.id, resize }, 'MediaService: getFile');
      const storage = getStorageAdapter();
      const key = extractStorageKey(asset);

      logger.debug('MediaService: reading file from storage');
      let buffer = await storage.read(key);

      if (resize && asset.mimeType.startsWith('image/')) {
        logger.debug('MediaService: resizing image');
        buffer = await resizeImage(buffer, resize);
      }

      return { buffer, mimeType: asset.mimeType, filename: asset.filename };
    } catch (error) {
      logger.error({ err: error }, 'MediaService Error in getFile:');
      throw new ApiError(500, SERVICE_ERRORS.FETCH_MEDIA_FAILED);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      logger.info({ id }, 'MediaService: delete start');
      const asset = await this.getById(id);
      const key = extractStorageKey(asset);

      logger.debug({ id }, 'MediaService: soft deleting record');
      await this.repository.softDelete(id);

      logger.debug({ id }, 'MediaService: deleting file from storage');
      await getStorageAdapter().delete(key);

      logger.debug({ id }, 'MediaService: delete success, emitting audit log');
      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.DELETE,
        resourceType: 'media',
        resourceId: id,
        actorUserId,
        actorAgentId,
        beforeState: asset,
        afterState: null,
        context,
      });
    } catch (error) {
      logger.error({ err: error }, 'MediaService Error in delete:');
      throw new ApiError(500, SERVICE_ERRORS.DELETE_MEDIA_FAILED);
    }
  }

  async deleteBulk(ids: string[]): Promise<void> {
    try {
      logger.info({ ids }, 'MediaService: deleteBulk start');
      const assets = await Promise.all(ids.map((id) => this.getById(id)));
      logger.debug({ ids }, 'MediaService: soft deleting records in bulk');
      await this.repository.softDeleteBulk(ids);
      const storage = getStorageAdapter();
      const { actorUserId, actorAgentId, context } = getAuditContext();

      await Promise.all(
        assets.map(async (asset) => {
          const key = extractStorageKey(asset);
          logger.debug(
            { id: asset.id },
            'MediaService: deleting file from storage',
          );
          await storage.delete(key);

          eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
            action: AUDIT_ACTIONS.DELETE,
            resourceType: 'media',
            resourceId: asset.id,
            actorUserId,
            actorAgentId,
            beforeState: asset,
            afterState: null,
            context,
          });
        }),
      );
    } catch (error) {
      logger.error({ err: error }, 'MediaService Error in deleteBulk:');
      throw new ApiError(500, 'Failed to bulk delete media');
    }
  }
}
