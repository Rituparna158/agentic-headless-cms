import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getContentList, getContentEntry } from '../src/server/content.js';
import { _resetConfig } from '../src/fetch.js';

const ORIGINAL_ENV = process.env;

const mockEntry = {
  id: 'entry-1',
  status: 'published' as const,
  data: { title: 'Hello World' },
  publishedData: null,
};

const mockListResult = {
  data: [mockEntry],
  meta: { pagination: { page: 1, pageSize: 10, total: 1, pageCount: 1 } },
};

describe('getContentList', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env['CMS_API_URL'] = 'http://localhost:3000';
    process.env['CMS_API_TOKEN'] = 'test-token';
    _resetConfig();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockListResult, success: true }),
      }),
    );
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    _resetConfig();
    vi.unstubAllGlobals();
  });

  it('calls the correct URL', async () => {
    await getContentList('blog-post');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/content/blog-post'),
      expect.any(Object),
    );
  });

  it('passes ISR tags with cms and content tags', async () => {
    await getContentList('blog-post');

    const [, options] = vi.mocked(fetch).mock.calls[0]!;
    // next is injected as a key on the options object
    expect((options as Record<string, unknown>)['next']).toMatchObject({
      tags: expect.arrayContaining(['cms', 'cms:content:blog-post']),
    });
  });

  it('forwards pagination options as query params', async () => {
    await getContentList('blog-post', { page: 2, pageSize: 5 });

    const [url] = vi.mocked(fetch).mock.calls[0]!;
    expect(url).toContain('page=2');
    expect(url).toContain('pageSize=5');
  });

  it('allows custom next tags', async () => {
    await getContentList('blog-post', { nextTags: ['custom-tag'] });

    const [, options] = vi.mocked(fetch).mock.calls[0]!;
    expect((options as Record<string, unknown>)['next']).toMatchObject({
      tags: ['custom-tag'],
    });
  });

  it('returns the data from the API response', async () => {
    const result = await getContentList('blog-post');
    expect(result).toEqual(mockListResult);
  });
});

describe('getContentEntry', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env['CMS_API_URL'] = 'http://localhost:3000';
    process.env['CMS_API_TOKEN'] = 'test-token';
    _resetConfig();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockEntry, success: true }),
      }),
    );
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    _resetConfig();
    vi.unstubAllGlobals();
  });

  it('calls the correct URL including entryId', async () => {
    await getContentEntry('blog-post', 'entry-1');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/content/blog-post/entry-1'),
      expect.any(Object),
    );
  });

  it('passes entry-level ISR tags', async () => {
    await getContentEntry('blog-post', 'entry-1');

    const [, options] = vi.mocked(fetch).mock.calls[0]!;
    expect((options as Record<string, unknown>)['next']).toMatchObject({
      tags: expect.arrayContaining([
        'cms',
        'cms:content:blog-post',
        'cms:content:blog-post:entry-1',
      ]),
    });
  });

  it('returns the entry', async () => {
    const result = await getContentEntry('blog-post', 'entry-1');
    expect(result).toEqual(mockEntry);
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Entry not found' }),
      }),
    );

    await expect(getContentEntry('blog-post', 'missing')).rejects.toThrow(
      /404/,
    );
  });
});
