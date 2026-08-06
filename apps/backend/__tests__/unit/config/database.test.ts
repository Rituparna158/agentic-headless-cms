import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDatabaseAdapter, resetDatabaseAdapterForTest } from '@repo/config';
import { PostgresAdapter } from '@repo/shared-db';
import { env } from '@repo/config';

vi.mock('@repo/shared-db', () => {
  const PostgresAdapter = vi.fn();
  return { PostgresAdapter };
});

// No mock needed for @repo/config, direct mutation of imported env works due to ESM reference sharing.

describe('Database Configuration DI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDatabaseAdapterForTest();
    env.DB_CLIENT = 'postgres';
    env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
    env.DATABASE_POOL_MAX = 10;
    env.DATABASE_SSL = false;
  });

  it('should return PostgresAdapter when DB_CLIENT is postgres', () => {
    const adapter = getDatabaseAdapter();

    expect(adapter).toBeDefined();
    expect(PostgresAdapter).toHaveBeenCalledWith({
      connectionString: 'postgres://user:pass@localhost:5432/db',
      max: 10,
      ssl: undefined,
      onIdleClientError: expect.any(Function),
    });
  });

  it('should throw error if DB_CLIENT is unsupported', () => {
    env.DB_CLIENT = 'mysql';
    expect(() => getDatabaseAdapter()).toThrow(/Unsupported DB_CLIENT/);
  });
});
