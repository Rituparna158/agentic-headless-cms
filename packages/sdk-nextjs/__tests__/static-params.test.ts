import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateCmsStaticParams } from '../src/server/static-params.js';
import { _resetConfig } from '../src/fetch.js';

const ORIGINAL_ENV = process.env;

function makeEntry(id: string) {
  return {
    id,
    status: 'published' as const,
    data: { title: `Post ${id}` },
    publishedData: null,
  };
}

describe('generateCmsStaticParams', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env['CMS_API_URL'] = 'http://localhost:3000';
    process.env['CMS_API_TOKEN'] = 'test-token';
    _resetConfig();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    _resetConfig();
    vi.unstubAllGlobals();
  });

  it('returns an array of { slug: id } by default', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            data: [makeEntry('abc'), makeEntry('def')],
            meta: {
              pagination: { page: 1, pageSize: 1000, total: 2, pageCount: 1 },
            },
          },
          success: true,
        }),
      }),
    );

    const result = await generateCmsStaticParams('blog-post');

    expect(result).toEqual([{ slug: 'abc' }, { slug: 'def' }]);
  });

  it('uses the custom paramKey when provided', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            data: [makeEntry('xyz')],
            meta: {
              pagination: { page: 1, pageSize: 1000, total: 1, pageCount: 1 },
            },
          },
          success: true,
        }),
      }),
    );

    const result = await generateCmsStaticParams('articles', {
      paramKey: 'id',
    });

    expect(result).toEqual([{ id: 'xyz' }]);
  });

  it('requests the correct URL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { data: [], meta: { pagination: { total: 0 } } },
          success: true,
        }),
      }),
    );

    await generateCmsStaticParams('blog-post');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/content/blog-post'),
      expect.any(Object),
    );
  });

  it('requests pageSize=1000 by default', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { data: [], meta: { pagination: { total: 0 } } },
          success: true,
        }),
      }),
    );

    await generateCmsStaticParams('blog-post');

    const [url] = vi.mocked(fetch).mock.calls[0]!;
    expect(url).toContain('pageSize=1000');
  });
});
