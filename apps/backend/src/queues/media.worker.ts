import path from 'node:path';
import type { Job } from 'bullmq';
import { getStorageAdapter } from '../config/storage.js';
import { resizeImage } from '../modules/media/image-processing.js';
import { logger } from '../common/logger.js';
import { registerWorker } from './queue.factory.js';
import { QUEUE_NAMES } from './queue-names.constants.js';

export interface MediaThumbnailJobData {
  assetId: string;
  storageKey: string;
  mimeType: string;
}

const THUMBNAIL_WIDTH = 320;

/** `abc123.jpg` -> `abc123__thumb.jpg` — deterministic from the source key, so no extra DB column is needed to look it up. */
export function buildThumbnailKey(storageKey: string): string {
  const ext = path.extname(storageKey);
  const base = storageKey.slice(0, storageKey.length - ext.length);
  return `${base}__thumb${ext}`;
}

/**
 * The one concrete example of the "move heavy work off the request thread"
 * pattern this issue asks for: generating a thumbnail variant is pure CPU
 * (sharp) that the upload request has no need to wait on. Non-image assets
 * (mimeType not image/*) are a no-op success, not a failure — nothing to
 * thumbnail, and retrying pdf/video uploads forever against this queue
 * would be pointless.
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
