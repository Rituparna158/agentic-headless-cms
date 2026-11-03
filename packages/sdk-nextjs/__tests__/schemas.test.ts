import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSchemas, getSchema } from '../src/server/schemas.js';
import { _resetConfig } from '../src/fetch.js';

const ORIGINAL_ENV = process.env;

const mockSchema = {
  id: 'schema-1',
  slug: 'blog-post',
  name: 'Blog Post',
  definition: { fields: [] },
};

describe('getSchemas', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env['CMS_API_URL'] = 'http://localhost:3000';
    process.env['CMS_API_TOKEN'] = 'test-token';
    _resetConfig();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { data: [mockSchema], meta: { total: 1 } },
          success: true,
        }),
      }),
    );
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    _resetConfig();
    vi.unstubAllGlobals();
  });

  it('calls /api/v1/schemas', async () => {
    await getSchemas();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/schemas'),
      expect.any(Object),
    );
  });

  it('passes schemas ISR tags', async () => {
    await getSchemas();
    const [, options] = vi.mocked(fetch).mock.calls[0]!;
    expect((options as Record<string, unknown>)['next']).toMatchObject({
      tags: expect.arrayContaining(['cms', 'cms:schemas']),
    });
  });
});

describe('getSchema', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env['CMS_API_URL'] = 'http://localhost:3000';
    process.env['CMS_API_TOKEN'] = 'test-token';
    _resetConfig();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockSchema, success: true }),
      }),
    );
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    _resetConfig();
    vi.unstubAllGlobals();
  });

  it('calls /api/v1/schemas/slug/:slug', async () => {
    await getSchema('blog-post');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/schemas/slug/blog-post'),
      expect.any(Object),
    );
  });

  it('passes schema-specific ISR tags', async () => {
    await getSchema('blog-post');
    const [, options] = vi.mocked(fetch).mock.calls[0]!;
    expect((options as Record<string, unknown>)['next']).toMatchObject({
      tags: expect.arrayContaining([
        'cms',
        'cms:schemas',
        'cms:schemas:blog-post',
      ]),
    });
  });

  it('returns the schema', async () => {
    const result = await getSchema('blog-post');
    expect(result).toEqual(mockSchema);
  });
});
