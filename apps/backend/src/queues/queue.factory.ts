import { Queue, Worker, type Processor, type WorkerOptions } from 'bullmq';
import { getRedisConnection } from '../config/redis.js';
import { env } from '../config/env.js';
import { logger } from '../common/logger.js';
import type { QueueName } from './queue-names.constants.js';

const queues = new Map<QueueName, Queue>();
const workers = new Map<QueueName, Worker>();

/**
 * One Queue instance per name, reused across callers — mirrors
 * getStorageAdapter()/getDatabaseAdapter()'s singleton-getter shape.
 * Default job options implement the "failed jobs are retried" acceptance
 * criteria: exponential backoff, configurable via QUEUE_JOB_ATTEMPTS /
 * QUEUE_JOB_BACKOFF_DELAY_MS rather than hardcoded, so retry policy can be
 * tuned per environment without a code change.
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
 * name (test/dev hot-reload safety) — production wiring calls this exactly
 * once per queue at startup.
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

/** Closes every registered worker and queue — called from server.ts's shutdown() sequence. */
export async function closeAllQueues(): Promise<void> {
  await Promise.all([...workers.values()].map((worker) => worker.close()));
  await Promise.all([...queues.values()].map((queue) => queue.close()));
  workers.clear();
  queues.clear();
}
