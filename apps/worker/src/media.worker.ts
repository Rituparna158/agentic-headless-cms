import path from 'node:path';
import type { Job } from 'bullmq';
import { getStorageAdapter, registerWorker, QUEUE_NAMES } from '@repo/config';
import { resizeImage } from '@repo/storage';
import { logger } from '@repo/logger';

export interface MediaThumbnailJobData {
  assetId: string;
  storageKey: string;
  mimeType: string;
}

const THUMBNAIL_WIDTH = 320;

/** `abc123.jpg` -> `abc123__thumb.jpg` — deterministic from the source key */
export function buildThumbnailKey(storageKey: string): string {
  const ext = path.extname(storageKey);
  const base = storageKey.slice(0, storageKey.length - ext.length);
  return `${base}__thumb${ext}`;
}

/**
 * Resizes image and writes thumbnail to storage.
 */
async function processThumbnailJob(
  job: Job<MediaThumbnailJobData>,
): Promise<void> {
  const { storageKey, mimeType } = job.data;

  if (!mimeType.startsWith('image/')) {
    return;
  }

  const storage = getStorageAdapter();
  const original = await storage.read(storageKey);
  const thumbnail = await resizeImage(original, {
    width: THUMBNAIL_WIDTH,
    fit: 'inside',
  });

  await storage.write(buildThumbnailKey(storageKey), thumbnail, mimeType);
}

export function setupMediaWorker() {
  const worker = registerWorker<MediaThumbnailJobData>(
    QUEUE_NAMES.MEDIA_PROCESSING,
    processThumbnailJob,
  );

  worker.on('completed', (job) => {
    logger.info(
      { jobId: job.id, assetId: job.data.assetId },
      'Thumbnail generated',
    );
  });

  return worker;
}
