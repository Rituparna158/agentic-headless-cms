import { eventBus } from '../common/events/event-bus.js';
import { EVENT_NAMES } from '../constants/events.constants.js';
import { logger } from '../common/logger.js';
import { getQueue } from './queue.factory.js';
import { QUEUE_NAMES } from './queue-names.constants.js';
import type { MediaThumbnailJobData } from './media.worker.js';

/**
 * Mirrors audit.listener.ts's shape: subscribe on the shared event bus,
 * enqueue inside a void-async try/catch so a queue outage degrades to a
 * logged error rather than taking the upload request down with it — the
 * asset itself is already saved by the time this fires (see
 * media.controller.ts's uploadMedia, which emits after the DB write).
 */
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
