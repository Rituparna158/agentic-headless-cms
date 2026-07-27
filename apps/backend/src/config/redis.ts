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

const MINIMUM_REDIS_VERSION = '5.0.0';

function isVersionAtLeast(actual: string, minimum: string): boolean {
  const actualParts = actual
    .split('.')
    .map((part) => Number.parseInt(part, 10));
  const minimumParts = minimum
    .split('.')
    .map((part) => Number.parseInt(part, 10));

  for (let i = 0; i < minimumParts.length; i++) {
    const actualPart = actualParts[i] ?? 0;
    const minimumPart = minimumParts[i] ?? 0;

    if (actualPart !== minimumPart) {
      return actualPart > minimumPart;
    }
  }

  return true;
}

export class UnsupportedRedisVersionError extends Error {
  constructor(public readonly currentVersion: string) {
    super(
      `Redis version ${currentVersion} is not supported — BullMQ requires Redis >= ${MINIMUM_REDIS_VERSION} (Redis Streams support). ` +
        'Upgrade your local Redis instance (e.g. via Docker: `docker compose up redis`) or point REDIS_URL at a modern Redis server.',
    );
    this.name = 'UnsupportedRedisVersionError';
  }
}

// Runs once at bootstrap, before any queue/worker opens a connection
export async function assertMinimumRedisVersion(): Promise<void> {
  const info = await getRedisConnection().info('server');
  const match = /redis_version:(\S+)/.exec(info);
  const currentVersion = match?.[1];

  if (!currentVersion) {
    throw new Error(
      'Unable to determine Redis server version from INFO server output.',
    );
  }

  if (!isVersionAtLeast(currentVersion, MINIMUM_REDIS_VERSION)) {
    throw new UnsupportedRedisVersionError(currentVersion);
  }
}
