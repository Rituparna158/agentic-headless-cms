import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { ERROR_MESSAGES } from '@repo/constants';
import { StorageNotFoundError } from './errors.js';

export function buildStorageKey(originalFilename: string): string {
  const ext = path.extname(originalFilename);
  return `${randomUUID()}${ext}`;
}

export function extractStorageKey(asset: { metadata: unknown }): string {
  const metadata = asset.metadata as { storageKey?: string } | null;
  if (!metadata?.storageKey) {
    throw new StorageNotFoundError(ERROR_MESSAGES.MEDIA.ASSET_NOT_FOUND);
  }
  return metadata.storageKey;
}
