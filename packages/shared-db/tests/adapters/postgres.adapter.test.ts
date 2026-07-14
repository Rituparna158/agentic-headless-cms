import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PostgresAdapter } from '../../src/adapters/postgres.adapter.js';
import { InvalidDatabaseConfigError } from '../../src/errors.js';

const mPool = vi.hoisted(() => ({
  connect: vi.fn(),
  on: vi.fn(),
  end: vi.fn(),
}));

vi.mock('pg', () => {
  return {
    Pool: class {
      constructor() {
        return mPool;
      }
    },
  };
});

vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: vi.fn(() => ({})),
}));

describe('PostgresAdapter', () => {
  let adapter: PostgresAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw Invalid Database Config Error if connection string is missing or invalid', () => {
    expect(() => new PostgresAdapter({ connectionString: '' })).toThrow(
      InvalidDatabaseConfigError,
    );
    expect(
      () => new PostgresAdapter({ connectionString: 'invalid-url' }),
    ).toThrow(InvalidDatabaseConfigError);
    expect(
      () => new PostgresAdapter({ connectionString: 'mysql://localhost:3306' }),
    ).toThrow(InvalidDatabaseConfigError);
  });

  it('should initialize successfully with valid connection string', () => {
    adapter = new PostgresAdapter({
      connectionString: 'postgres://user:pass@localhost:5432/db',
    });
    expect(adapter).toBeDefined();
    expect(adapter.getDb()).toBeDefined();
  });

  it('should handle idle client errors if callback provided', () => {
    const onIdleClientError = vi.fn();
    adapter = new PostgresAdapter({
      connectionString: 'postgres://user:pass@localhost:5432/db',
      onIdleClientError,
    });

    // Simulate error event on pool
    const errorCallback = mPool.on.mock.calls.find(
      (call: unknown[]) => call[0] === 'error',
    )[1];

    expect(errorCallback).toBeDefined();
    errorCallback(new Error('idle client error'));

    expect(onIdleClientError).toHaveBeenCalled();
  });

  it('healthCheck should pass if query succeeds', async () => {
    adapter = new PostgresAdapter({
      connectionString: 'postgres://user:pass@localhost:5432/db',
    });
    mPool.connect.mockResolvedValueOnce({
      query: vi.fn().mockResolvedValue({}),
      release: vi.fn(),
    });

    await expect(adapter.healthCheck()).resolves.toBeUndefined();
  });

  it('healthCheck should fail if query throws', async () => {
    adapter = new PostgresAdapter({
      connectionString: 'postgres://user:pass@localhost:5432/db',
    });
    mPool.connect.mockResolvedValueOnce({
      query: vi.fn().mockRejectedValue(new Error('query failed')),
      release: vi.fn(),
    });

    await expect(adapter.healthCheck()).rejects.toThrow();
  });

  it('close should end the pool safely', async () => {
    adapter = new PostgresAdapter({
      connectionString: 'postgres://user:pass@localhost:5432/db',
    });

    await adapter.close();
    expect(mPool.end).toHaveBeenCalledTimes(1);
    await adapter.close();
    expect(mPool.end).toHaveBeenCalledTimes(1);
  });
});
