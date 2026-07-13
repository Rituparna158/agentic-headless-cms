import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PoolConfig } from 'pg';
import * as schema from '../schema/index.js';

export type Database = NodePgDatabase<typeof schema>;

export interface DatabaseClientOptions {
  connectionString: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  ssl?: PoolConfig['ssl'];
  onIdleClientError?: (error: unknown) => void;
}
