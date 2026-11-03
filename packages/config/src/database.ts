import { PostgresAdapter, DatabasePort, Database } from '@repo/shared-db';
import { logger } from '@repo/logger';
import { env } from './env.js';

let adapterInstance: DatabasePort<Database> | null = null;

export function getDatabaseAdapter(): DatabasePort<Database> {
  if (adapterInstance) {
    return adapterInstance;
  }

  const client = env.DB_CLIENT;
  const connectionString = env.DATABASE_URL;

  if (client === 'postgres') {
    adapterInstance = new PostgresAdapter({
      connectionString,
      max: env.DATABASE_POOL_MAX,
      ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
      onIdleClientError: (error) => {
        logger.error({ err: error }, 'Idle Postgres client error');
      },
      slowQueryThresholdMs: env.DATABASE_SLOW_QUERY_THRESHOLD_MS ?? 100,
      onSlowQuery: (query: string, durationMs: number) => {
        const truncatedQuery =
          query.length > 500 ? `${query.slice(0, 500)}... [truncated]` : query;
        logger.warn(
          { query: truncatedQuery, durationMs },
          `Slow database query detected (${durationMs}ms)`,
        );
      },
    });
    return adapterInstance;
  }

  throw new Error(`Unsupported DB_CLIENT: ${client}`);
}

export function resetDatabaseAdapterForTest() {
  adapterInstance = null;
}
