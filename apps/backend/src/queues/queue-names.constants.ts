export const QUEUE_NAMES = {
  MEDIA_PROCESSING: 'media-processing',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
