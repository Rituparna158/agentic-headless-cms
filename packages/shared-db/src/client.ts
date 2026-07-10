import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';
import * as schema from './schema/index.js';
import {
  ConnectionError,
  InvalidDatabaseConfigError,
  mapPostgresError,
} from './errors.js';

export type Database = NodePgDatabase<typeof schema>;

export interface DatabaseClientOptions {
  connectionString: string;
  /** Max pool connections. Defaults to 10 — tune per deployment size. */
  max?: number;
  /** Close idle connections after this long. Defaults to 30s. */
  idleTimeoutMillis?: number;
  /** Fail fast if a connection can't be acquired within this window. Defaults to 5s. */
  connectionTimeoutMillis?: number;
  ssl?: PoolConfig['ssl'];
  /**
   * Called whenever an already-established, idle connection errors out in
   * the background (e.g. the network drops or Postgres terminates it). If
   * omitted, such errors are only logged — importantly, they must always be
   * handled: an unhandled 'error' event on a `pg.Pool` crashes the process.
   */
  onIdleClientError?: (error: unknown) => void;
}

export interface DatabaseClient {
  db: Database;
  pool: Pool;
  /** Runs a trivial query to verify the pool can actually reach the database. Throws `ConnectionError` on failure. */
  healthCheck(timeoutMs?: number): Promise<void>;
  /** Closes the pool. Safe to call multiple times. */
  close(): Promise<void>;
}

function assertValidConnectionString(connectionString: string): void {
  if (!connectionString || connectionString.trim().length === 0) {
    throw new InvalidDatabaseConfigError('DATABASE_URL is empty or not set.');
  }

  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new InvalidDatabaseConfigError(
      'DATABASE_URL is not a valid connection URL (expected postgres://user:pass@host:port/db).',
    );
  }

  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    throw new InvalidDatabaseConfigError(
      `DATABASE_URL must use the postgres:// or postgresql:// scheme, got "${parsed.protocol}".`,
    );
  }
}

/**
 * Factory rather than a module-level singleton so the connection string and
 * pool tuning come from each app's own config (NestJS ConfigService, env,
 * etc.) instead of being read from process.env inside this package — keeps
 * this package framework-agnostic and testable with an isolated pool per
 * test suite.
 */
export function createDatabaseClient(
  options: DatabaseClientOptions,
): DatabaseClient {
  assertValidConnectionString(options.connectionString);

  const pool = new Pool({
    connectionString: options.connectionString,
    max: options.max ?? 10,
    idleTimeoutMillis: options.idleTimeoutMillis ?? 30_000,
    connectionTimeoutMillis: options.connectionTimeoutMillis ?? 5_000,
    ssl: options.ssl,
  });

  // node-postgres emits 'error' on the pool when an *idle* client hits a
  // network-level problem in the background. If nothing listens for it,
  // Node treats it as an unhandled error and crashes the whole process —
  // this is the single most common way a Postgres blip takes down an
  // otherwise-healthy API server.
  pool.on('error', (error) => {
    if (options.onIdleClientError) {
      options.onIdleClientError(mapPostgresError(error));
    }
  });

  const db = drizzle(pool, { schema });

  let closed = false;

  return {
    db,
    pool,
    async healthCheck(timeoutMs = 5_000): Promise<void> {
      let timeoutHandle: ReturnType<typeof setTimeout>;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(
          () =>
            reject(
              new ConnectionError(
                `Database health check timed out after ${timeoutMs}ms.`,
              ),
            ),
          timeoutMs,
        );
      });

      const queryPromise = (async () => {
        const client = await pool.connect();
        try {
          await client.query('SELECT 1');
        } finally {
          client.release();
        }
      })();

      // Promise.race only subscribes to queryPromise, it doesn't consume it —
      // if the timeout wins the race and queryPromise rejects afterwards
      // (e.g. the connection attempt fails after we've already given up on
      // it), that rejection would otherwise be unhandled and crash the
      // process. This is a silent, redundant handler: the real outcome is
      // still decided by the race below.
      queryPromise.catch(() => {});

      try {
        await Promise.race([queryPromise, timeoutPromise]);
      } catch (error) {
        if (error instanceof ConnectionError) throw error;
        throw mapPostgresError(error);
      } finally {
        clearTimeout(timeoutHandle!);
      }
    },
    async close(): Promise<void> {
      if (closed) return;
      closed = true;
      await pool.end();
    },
  };
}
