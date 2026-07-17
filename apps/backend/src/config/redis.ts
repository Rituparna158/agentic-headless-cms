import { Redis } from 'ioredis';
import { env } from './env.js';

let connection: Redis | null = null;

/**
 * A single shared ioredis connection, reused by every BullMQ Queue/Worker —
 * each one otherwise opens its own socket, which adds up quickly once
 * several queues/workers exist. `maxRetriesPerRequest: null` is required by
 * BullMQ itself (it does its own retry/backoff at the job level; ioredis's
 * default request-level retry limit fights that and can silently drop
 * commands during a reconnect).
 */
export function getRedisConnection(): Redis {
  if (connection) {
    return connection;
  }

  connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  return connection;
}

export async function closeRedisConnection(): Promise<void> {
  if (!connection) return;
  await connection.quit();
  connection = null;
}

export function resetRedisConnectionForTest(): void {
  connection = null;
}
