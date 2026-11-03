import { eventBus } from '@repo/events';
import { EVENT_NAMES } from '@repo/constants';
import { logger } from '@repo/logger';
import { getQueue, QUEUE_NAMES } from '@repo/config';
export interface MediaThumbnailJobData {
  assetId: string;
  storageKey: string;
  mimeType: string;
}
export function setupMediaQueueListener() {
  eventBus.on(EVENT_NAMES.MEDIA_UPLOADED, (payload) => {
    void (async () => {
      try {
        await getQueue(QUEUE_NAMES.MEDIA_PROCESSING).add('generate-thumbnail', {
          assetId: payload.assetId,
          storageKey: payload.storageKey,
          mimeType: payload.mimeType,
        } satisfies MediaThumbnailJobData);
      } catch (error) {
        logger.error(
          { err: error, payload },
          'Failed to enqueue media-processing job',
        );
      }
    })();
  });
}
