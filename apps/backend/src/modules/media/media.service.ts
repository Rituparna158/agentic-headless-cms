import { ERROR_MESSAGES } from '@repo/shared-types';
import { getStorageAdapter } from '../../config/storage.js';
import { NotFoundError } from '../../common/errors/http-error.js';
import { MediaRepository, type MediaAssetRecord } from './media.repository.js';
import type {
  UploadMediaInput,
  ServedFile,
  ListMediaOptions,
} from '../../types/media.types.js';
import {
  readImageDimensions,
  resizeImage,
  type ResizeOptions,
} from './image-processing.js';

import { buildStorageKey, extractStorageKey } from '../../utils/media.util.js';

export class MediaService {
  private repository = new MediaRepository();

  async upload(input: UploadMediaInput): Promise<MediaAssetRecord> {
    const storage = getStorageAdapter();
    const key = buildStorageKey(input.originalFilename);

    // Only meaningful for images; sharp rejects non-image buffers, which
    // readImageDimensions treats as "not an image" rather than an error.
    const dimensions = await readImageDimensions(input.buffer);

    const { url } = await storage.write(key, input.buffer, input.mimeType);

    return this.repository.create({
      filename: input.originalFilename,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.length,
      width: dimensions?.width,
      height: dimensions?.height,
      url,
      altText: input.altText,
      // No dedicated storageKey column on media_assets — stashed in the
      // free-form metadata jsonb column instead, alongside `url`, so
      // findByStorageKey() can resolve the file-serving route back to a row.
      metadata: { storageKey: key },
      storageProvider: storage.providerName,
      folderId: input.folderId,
      actorType: 'user',
      uploadedByUserId: input.actorUserId,
    });
  }

  async list(options: ListMediaOptions) {
    return this.repository.list(options);
  }

  async getById(id: string): Promise<MediaAssetRecord> {
    const asset = await this.repository.findById(id);
    if (!asset) {
      throw new NotFoundError(ERROR_MESSAGES.MEDIA.ASSET_NOT_FOUND);
    }
    return asset;
  }

  async getByStorageKey(key: string): Promise<MediaAssetRecord> {
    const asset = await this.repository.findByStorageKey(key);
    if (!asset) {
      throw new NotFoundError(ERROR_MESSAGES.MEDIA.ASSET_NOT_FOUND);
    }
    return asset;
  }

  /** Reads the raw bytes for an asset, applying an on-the-fly resize when requested and the asset is an image. */
  async getFile(
    asset: MediaAssetRecord,
    resize?: ResizeOptions,
  ): Promise<ServedFile> {
    const storage = getStorageAdapter();
    const key = extractStorageKey(asset);
    let buffer = await storage.read(key);

    if (resize && asset.mimeType.startsWith('image/')) {
      buffer = await resizeImage(buffer, resize);
    }

    return { buffer, mimeType: asset.mimeType, filename: asset.filename };
  }

  async delete(id: string): Promise<void> {
    const asset = await this.getById(id);
    const key = extractStorageKey(asset);

    // Soft-delete the row first — if the storage delete fails, the asset
    // is still hidden from listings/serving rather than left fully live
    // with a half-completed delete.
    await this.repository.softDelete(id);
    await getStorageAdapter().delete(key);
  }
}
