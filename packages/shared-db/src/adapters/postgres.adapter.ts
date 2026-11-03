import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../schema/index.js';
import {
  ConnectionError,
  InvalidDatabaseConfigError,
  mapPostgresError,
} from '../errors.js';
import { DatabasePort } from '../ports/database.port.js';
import type {
  Database,
  DatabaseClientOptions,
} from '../types/postgres.adapter.types.js';

export class PostgresAdapter implements DatabasePort<Database> {
  private readonly _db: Database;
  private readonly _pool: Pool;
  private _closed = false;

  constructor(options: DatabaseClientOptions) {
    if (
      !options.connectionString ||
      options.connectionString.trim().length === 0
    ) {
      throw new InvalidDatabaseConfigError('DATABASE_URL is empty or not set.');
    }

    let parsed: URL;
    try {
      parsed = new URL(options.connectionString);
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

    this._pool = new Pool({
      connectionString: options.connectionString,
      max: options.max ?? 10,
      idleTimeoutMillis: options.idleTimeoutMillis ?? 30_000,
      connectionTimeoutMillis: options.connectionTimeoutMillis ?? 5_000,
      ssl: options.ssl,
    });

    this._pool.on('error', (error) => {
      if (options.onIdleClientError) {
        options.onIdleClientError(mapPostgresError(error));
      }
    });

    const slowQueryThreshold = options.slowQueryThresholdMs ?? 100;
    if (options.onSlowQuery) {
      const onSlowQuery = options.onSlowQuery;
      const origPoolQuery = this._pool.query.bind(this._pool);
      this._pool.query = (async (...args: unknown[]) => {
        const start = Date.now();
        const text =
          typeof args[0] === 'string'
            ? args[0]
            : (args[0] as { text?: string } | undefined)?.text;
        try {
          return await (origPoolQuery as (...a: unknown[]) => Promise<unknown>)(
            ...args,
          );
        } finally {
          const duration = Date.now() - start;
          if (duration >= slowQueryThreshold && text) {
            onSlowQuery(text, duration);
          }
        }
      }) as typeof this._pool.query;

      this._pool.on('connect', (client) => {
        const origClientQuery = client.query.bind(client);
        client.query = (async (...args: unknown[]) => {
          const start = Date.now();
          const text =
            typeof args[0] === 'string'
              ? args[0]
              : (args[0] as { text?: string } | undefined)?.text;
          try {
            return await (
              origClientQuery as (...a: unknown[]) => Promise<unknown>
            )(...args);
          } finally {
            const duration = Date.now() - start;
            if (duration >= slowQueryThreshold && text) {
              onSlowQuery(text, duration);
            }
          }
        }) as typeof client.query;
      });
    }

    this._db = drizzle(this._pool, { schema });
  }

  getDb(): Database {
    return this._db;
  }

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
      const client = await this._pool.connect();
      try {
        await client.query('SELECT 1');
      } finally {
        client.release();
      }
    })();

    queryPromise.catch(() => {});

    try {
      await Promise.race([queryPromise, timeoutPromise]);
    } catch (error) {
      if (error instanceof ConnectionError) throw error;
      throw mapPostgresError(error);
    } finally {
      clearTimeout(timeoutHandle!);
    }
  }

  async close(): Promise<void> {
    if (this._closed) return;
    this._closed = true;
    await this._pool.end();
  }
}
