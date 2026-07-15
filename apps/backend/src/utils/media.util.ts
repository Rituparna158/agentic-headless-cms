import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { ERROR_MESSAGES } from '@repo/shared-types';
import { NotFoundError } from '../common/errors/http-error.js';
import type { MediaAssetRecord } from '../modules/media/media.repository.js';

export function buildStorageKey(originalFilename: string): string {
  const ext = path.extname(originalFilename);
  return `${randomUUID()}${ext}`;
}

export function extractStorageKey(asset: MediaAssetRecord): string {
  const metadata = asset.metadata as { storageKey?: string } | null;
  if (!metadata?.storageKey) {
    throw new NotFoundError(ERROR_MESSAGES.MEDIA.ASSET_NOT_FOUND);
  }
  return metadata.storageKey;
}
