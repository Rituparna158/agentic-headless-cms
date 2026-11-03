import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getCmsClient,
  createNextjsClient,
  _resetClientSingleton,
} from '../src/client.js';
import { _resetConfig } from '../src/fetch.js';

const ORIGINAL_ENV = process.env;

describe('getCmsClient', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    _resetClientSingleton();
    _resetConfig();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    _resetClientSingleton();
    _resetConfig();
  });

  it('creates a client from environment variables', () => {
    process.env['CMS_API_URL'] = 'http://localhost:3000';
    process.env['CMS_API_TOKEN'] = 'test-token';

    const client = getCmsClient();
    expect(client).toBeDefined();
  });

  it('returns the same singleton instance on subsequent calls', () => {
    process.env['CMS_API_URL'] = 'http://localhost:3000';
    process.env['CMS_API_TOKEN'] = 'test-token';

    const a = getCmsClient();
    const b = getCmsClient();
    expect(a).toBe(b);
  });

  it('throws if CMS_API_URL is missing', () => {
    delete process.env['CMS_API_URL'];
    process.env['CMS_API_TOKEN'] = 'test-token';

    expect(() => getCmsClient()).toThrowError(/CMS_API_URL is missing/);
  });

  it('throws if CMS_API_TOKEN is missing', () => {
    process.env['CMS_API_URL'] = 'http://localhost:3000';
    delete process.env['CMS_API_TOKEN'];

    expect(() => getCmsClient()).toThrowError(/CMS_API_TOKEN is missing/);
  });
});

describe('createNextjsClient', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    _resetConfig();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    _resetConfig();
  });

  it('creates a fresh client each call (not a singleton)', () => {
    process.env['CMS_API_URL'] = 'http://localhost:3000';
    process.env['CMS_API_TOKEN'] = 'test-token';

    const a = createNextjsClient();
    const b = createNextjsClient();
    expect(a).not.toBe(b);
  });

  it('allows overriding env vars via config', () => {
    process.env['CMS_API_URL'] = 'http://env:3000';
    process.env['CMS_API_TOKEN'] = 'env-token';

    const client = createNextjsClient({
      baseUrl: 'http://override:3000',
      apiToken: 'override-token',
    });
    expect(client).toBeDefined();
    expect(client.auth.getToken()).toBe('override-token');
  });
});
