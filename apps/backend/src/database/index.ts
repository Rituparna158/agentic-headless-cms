import { createDatabaseClient, type DatabaseClient } from '@repo/shared-db';
import { env } from '../config/env.js';
import { logger } from '../common/logger.js';

let client: DatabaseClient | undefined;

/**
 * Lazily creates the singleton database client for this process. Does NOT
 * eagerly verify connectivity — `pg.Pool` connects on first use anyway, and
 * in Docker/Kubernetes the app container can start before the database is
 * ready to accept connections. Crashing the whole process on that ordering
 * race would be worse than letting `/health/ready` report "not ready" until
 * the database comes up, so the orchestrator withholds traffic instead of
 * crash-looping the pod.
 */
export function getDatabaseClient(): DatabaseClient {
  if (!client) {
    client = createDatabaseClient({
      connectionString: env.DATABASE_URL,
      max: env.DATABASE_POOL_MAX,
      ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
      onIdleClientError: (error) => {
        // An idle pooled connection died in the background (network blip,
        // Postgres restart, etc.). Must be handled — an unhandled 'error'
        // event on a pg.Pool crashes the entire Node process.
        logger.error({ err: error }, 'Idle database connection error');
      },
    });
  }
  return client;
}

/** Closes the pool. Called during graceful shutdown — see server.ts. */
export async function closeDatabaseClient(): Promise<void> {
  if (client) {
    await client.close();
    client = undefined;
  }
}
