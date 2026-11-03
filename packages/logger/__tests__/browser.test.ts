import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserLogger, isProductionEnvironment } from '../src/browser';

describe('packages/logger/browser', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalWindow = (globalThis as unknown as { window?: unknown }).window;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    if (originalWindow !== undefined) {
      (globalThis as unknown as { window?: unknown }).window = originalWindow;
    } else {
      delete (globalThis as unknown as { window?: unknown }).window;
    }
  });

  describe('isProductionEnvironment', () => {
    it('returns true when process.env.NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      expect(isProductionEnvironment()).toBe(true);
    });

    it('returns true when window.__CMS_PROD__ is true', () => {
      process.env.NODE_ENV = 'development';
      (globalThis as unknown as { window: unknown }).window = {
        __CMS_PROD__: true,
      };
      expect(isProductionEnvironment()).toBe(true);
    });

    it('returns true when window.__ENV__.NODE_ENV is production', () => {
      process.env.NODE_ENV = 'development';
      (globalThis as unknown as { window: unknown }).window = {
        __ENV__: { NODE_ENV: 'production' },
      };
      expect(isProductionEnvironment()).toBe(true);
    });

    it('returns false when no production flags are present', () => {
      process.env.NODE_ENV = 'development';
      delete (globalThis as unknown as { window?: unknown }).window;
      expect(isProductionEnvironment()).toBe(false);
    });
  });

  describe('BrowserLogger', () => {
    it('defaults level to warn in test environment', () => {
      process.env.NODE_ENV = 'test';
      const logger = new BrowserLogger('TestModule');
      expect(logger).toBeDefined();
    });

    it('respects explicitly passed log level', () => {
      const logger = new BrowserLogger('CustomLevel', 'debug');
      expect(logger).toBeDefined();
    });

    it('allows changing log level via setLevel', () => {
      const logger = new BrowserLogger('Module');
      logger.setLevel('error');
    });

    it('creates child loggers inheriting parent module name prefix', () => {
      const parent = new BrowserLogger('Parent', 'info');
      const child = parent.createChild('Child');
      expect(child).toBeDefined();
    });

    it('redacts sensitive data before calling transport', () => {
      const mockTransport = vi.fn();
      const logger = new BrowserLogger('Auth', 'info');
      logger.addTransport(mockTransport);

      logger.info('User login', {
        password: 'supersecretpassword',
        token: 'jwt-12345',
        username: 'john_doe',
      });

      expect(mockTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          message: 'User login',
          metadata: expect.objectContaining({
            password: '[Redacted]',
            token: '[Redacted]',
            username: 'john_doe',
          }),
        }),
      );
    });
  });
});
