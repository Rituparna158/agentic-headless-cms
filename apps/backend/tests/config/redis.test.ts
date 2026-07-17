import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRedisInstance, RedisMock } = vi.hoisted(() => {
  const mockRedisInstance = { quit: vi.fn().mockResolvedValue('OK') };
  return {
    mockRedisInstance,
    // A real `function`, not an arrow — `new Redis(...)` in redis.ts calls
    // this as a constructor, and arrow functions can never be constructed.
    RedisMock: vi.fn().mockImplementation(function () {
      return mockRedisInstance;
    }),
  };
});

vi.mock('ioredis', () => ({ Redis: RedisMock }));

describe('config/redis', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { resetRedisConnectionForTest } =
      await import('../../src/config/redis.js');
    resetRedisConnectionForTest();
  });

  it('creates a connection using REDIS_URL with maxRetriesPerRequest disabled (required by BullMQ)', async () => {
    const { getRedisConnection } = await import('../../src/config/redis.js');
    getRedisConnection();

    expect(RedisMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ maxRetriesPerRequest: null }),
    );
  });

  it('reuses the same connection instance across calls', async () => {
    const { getRedisConnection } = await import('../../src/config/redis.js');

    const first = getRedisConnection();
    const second = getRedisConnection();

    expect(first).toBe(second);
    expect(RedisMock).toHaveBeenCalledTimes(1);
  });

  it('quits and clears the connection on close', async () => {
    const { getRedisConnection, closeRedisConnection } =
      await import('../../src/config/redis.js');

    getRedisConnection();
    await closeRedisConnection();

    expect(mockRedisInstance.quit).toHaveBeenCalledTimes(1);
  });

  it('is a no-op to close when no connection was ever opened', async () => {
    const { closeRedisConnection } = await import('../../src/config/redis.js');

    await expect(closeRedisConnection()).resolves.toBeUndefined();
    expect(mockRedisInstance.quit).not.toHaveBeenCalled();
  });
});
