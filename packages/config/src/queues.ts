import { Queue, Worker, type Processor, type WorkerOptions } from 'bullmq';
import { getRedisConnection } from './redis.js';
import { env } from './env.js';
import { logger } from '@repo/logger';

export const QUEUE_NAMES = {
  MEDIA_PROCESSING: 'media-processing',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

const queues = new Map<QueueName, Queue>();
const workers = new Map<QueueName, Worker>();

/**
 * One Queue instance per name, reused across callers.
 */
export function getQueue(name: QueueName): Queue {
  const existing = queues.get(name);
  if (existing) return existing;

  const queue = new Queue(name, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: env.QUEUE_JOB_ATTEMPTS,
      backoff: { type: 'exponential', delay: env.QUEUE_JOB_BACKOFF_DELAY_MS },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    },
  });
  queues.set(name, queue);
  return queue;
}

/**
 * Registers a worker for `name`, replacing any existing one for the same
 * name.
 */
export function registerWorker<T = unknown>(
  name: QueueName,
  processor: Processor<T>,
  options?: Partial<WorkerOptions>,
): Worker<T> {
  const worker = new Worker<T>(name, processor, {
    connection: getRedisConnection(),
    ...options,
  });

  worker.on('failed', (job, error) => {
    logger.error(
      {
        queue: name,
        jobId: job?.id,
        attemptsMade: job?.attemptsMade,
        err: error,
      },
      'Queue job failed',
    );
  });

  workers.set(name, worker);
  return worker;
}

/** Closes every registered worker and queue. */
export async function closeAllQueues(): Promise<void> {
  await Promise.all([...workers.values()].map((worker) => worker.close()));
  await Promise.all([...queues.values()].map((queue) => queue.close()));
  workers.clear();
  queues.clear();
}
