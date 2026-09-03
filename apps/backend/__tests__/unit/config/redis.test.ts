import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getRedisConnection,
  resetRedisConnectionForTest,
  closeRedisConnection,
  assertMinimumRedisVersion,
  UnsupportedRedisVersionError,
} from '@repo/config';

const { mockRedisInstance, RedisMock } = vi.hoisted(() => {
  const mockRedisInstance = {
    quit: vi.fn().mockResolvedValue('OK'),
    info: vi.fn().mockResolvedValue('redis_version:7.2.4\r\n'),
    on: vi.fn(),
  };
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
  beforeEach(() => {
    vi.clearAllMocks();
    resetRedisConnectionForTest();
  });

  it('creates a connection using REDIS_URL with maxRetriesPerRequest disabled (required by BullMQ)', () => {
    getRedisConnection();

    expect(RedisMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ maxRetriesPerRequest: null }),
    );
  });

  it('reuses the same connection instance across calls', () => {
    const first = getRedisConnection();
    const second = getRedisConnection();

    expect(first).toBe(second);
    expect(RedisMock).toHaveBeenCalledTimes(1);
  });

  it('quits and clears the connection on close', async () => {
    getRedisConnection();
    await closeRedisConnection();

    expect(mockRedisInstance.quit).toHaveBeenCalledTimes(1);
  });

  it('is a no-op to close when no connection was ever opened', async () => {
    await expect(closeRedisConnection()).resolves.toBeUndefined();
    expect(mockRedisInstance.quit).not.toHaveBeenCalled();
  });

  describe('assertMinimumRedisVersion', () => {
    it('resolves when the server reports a version >= 5.0.0', async () => {
      const { assertMinimumRedisVersion } = await import('@repo/config');
      mockRedisInstance.info.mockResolvedValueOnce('redis_version:7.2.4\r\n');

      await expect(assertMinimumRedisVersion()).resolves.toBeUndefined();
    });

    it('resolves when the server reports exactly the minimum version', async () => {
      mockRedisInstance.info.mockResolvedValueOnce('redis_version:5.0.0\r\n');

      await expect(assertMinimumRedisVersion()).resolves.toBeUndefined();
    });

    it('rejects with UnsupportedRedisVersionError when the server is too old', async () => {
      mockRedisInstance.info.mockResolvedValue('redis_version:3.0.504\r\n');

      await expect(assertMinimumRedisVersion()).rejects.toBeInstanceOf(
        UnsupportedRedisVersionError,
      );
      await expect(assertMinimumRedisVersion()).rejects.toThrow(
        /Redis version 3\.0\.504 is not supported.*>= 5\.0\.0/,
      );
    });

    it('rejects when the redis_version cannot be parsed from INFO output', async () => {
      mockRedisInstance.info.mockResolvedValueOnce('some_other_field:1\r\n');

      await expect(assertMinimumRedisVersion()).rejects.toThrow(
        /Unable to determine Redis server version/,
      );
    });
  });
});
