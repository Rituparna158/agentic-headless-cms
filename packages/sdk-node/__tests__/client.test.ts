import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createNodeClient, AgenticCmsNodeClient } from '../src/client.js';

describe('createNodeClient', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('reads configuration from process.env', () => {
    process.env.CMS_API_URL = 'http://localhost:3000';
    process.env.CMS_API_TOKEN = 'test-token-123';

    const client = createNodeClient();

    expect(client).toBeInstanceOf(AgenticCmsNodeClient);
    // @ts-expect-error accessing private property for testing
    expect(client.transport.baseUrl).toBe('http://localhost:3000');
    expect(client.auth.getToken()).toBe('test-token-123');
  });

  it('allows overriding process.env with config', () => {
    process.env.CMS_API_URL = 'http://localhost:3000';
    process.env.CMS_API_TOKEN = 'test-token-123';

    const client = createNodeClient({
      baseUrl: 'http://override:3000',
      apiToken: 'override-token',
    });

    // @ts-expect-error accessing private property for testing
    expect(client.transport.baseUrl).toBe('http://override:3000');
    expect(client.auth.getToken()).toBe('override-token');
  });

  it('throws an error if CMS_API_URL is missing', () => {
    delete process.env.CMS_API_URL;
    process.env.CMS_API_TOKEN = 'test-token-123';

    expect(() => createNodeClient()).toThrowError(/CMS_API_URL is missing/);
  });

  it('throws an error if CMS_API_TOKEN is missing', () => {
    process.env.CMS_API_URL = 'http://localhost:3000';
    delete process.env.CMS_API_TOKEN;

    expect(() => createNodeClient()).toThrowError(/CMS_API_TOKEN is missing/);
  });
});
