import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getContentList, getContentEntry } from '../src/server/content.js';

const ORIGINAL_ENV = process.env;

const mockEntry = {
  id: 'entry-1',
  status: 'draft' as const,
  data: { title: 'Working Draft' },
  publishedData: { title: 'Published Data' },
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
    vi.unstubAllGlobals();
  });

  it('calls the correct URL', async () => {
    await getContentList('blog-post', { draft: true });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/content/blog-post'),
      expect.any(Object),
    );
  });

  it('passes ISR tags with cms and content tags', async () => {
    await getContentList('blog-post', { draft: true });
    const [, options] = vi.mocked(fetch).mock.calls[0]!;
    expect((options as Record<string, unknown>)['next']).toMatchObject({
      tags: expect.arrayContaining(['cms', 'cms:content:blog-post']),
    });
  });

  it('forwards pagination options as query params', async () => {
    await getContentList('blog-post', { page: 2, pageSize: 5, draft: true });
    const [url] = vi.mocked(fetch).mock.calls[0]!;
    expect(url).toContain('page=2');
    expect(url).toContain('pageSize=5');
  });

  it('allows custom next tags', async () => {
    await getContentList('blog-post', {
      nextTags: ['custom-tag'],
      draft: true,
    });
    const [, options] = vi.mocked(fetch).mock.calls[0]!;
    expect((options as Record<string, unknown>)['next']).toMatchObject({
      tags: ['custom-tag'],
    });
  });

  it('returns the raw draft data when draft: true', async () => {
    const result = await getContentList('blog-post', { draft: true });
    expect(result).toEqual(mockListResult);
  });

  it('filters out unpublished items and maps to publishedData when draft: false', async () => {
    // Override fetch for this test
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            data: [
              mockEntry,
              { ...mockEntry, id: 'entry-2', publishedData: null },
            ],
            meta: mockListResult.meta,
          },
          success: true,
        }),
      }),
    );

    const result = await getContentList('blog-post', { draft: false });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.id).toBe('entry-1');
    expect(result.data[0]!.status).toBe('published');
    expect(result.data[0]!.data).toEqual({ title: 'Published Data' });
  });
});

describe('getContentEntry', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env['CMS_API_URL'] = 'http://localhost:3000';
    process.env['CMS_API_TOKEN'] = 'test-token';

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
    vi.unstubAllGlobals();
  });

  it('calls the correct URL', async () => {
    await getContentEntry('blog-post', 'entry-1', { draft: true });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/content/blog-post/entry-1'),
      expect.any(Object),
    );
  });

  it('passes ISR tags for the specific entry', async () => {
    await getContentEntry('blog-post', 'entry-1', { draft: true });
    const [, options] = vi.mocked(fetch).mock.calls[0]!;
    expect((options as Record<string, unknown>)['next']).toMatchObject({
      tags: expect.arrayContaining([
        'cms',
        'cms:content:blog-post',
        'cms:content:blog-post:entry-1',
      ]),
    });
  });

  it('returns raw draft data when draft: true', async () => {
    const result = await getContentEntry('blog-post', 'entry-1', {
      draft: true,
    });
    expect(result).toEqual(mockEntry);
  });

  it('maps to publishedData when draft: false', async () => {
    const result = await getContentEntry('blog-post', 'entry-1', {
      draft: false,
    });
    expect(result.status).toBe('published');
    expect(result.data).toEqual({ title: 'Published Data' });
  });

  it('throws an error if draft: false but entry has no publishedData', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { ...mockEntry, publishedData: null },
          success: true,
        }),
      }),
    );

    await expect(
      getContentEntry('blog-post', 'entry-1', { draft: false }),
    ).rejects.toThrow('Entry not found or not published');
  });

  it('throws an API error if response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Entry not found' }),
      }),
    );

    await expect(
      getContentEntry('blog-post', 'entry-1', { draft: true }),
    ).rejects.toThrow('[sdk-nextjs] 404: Entry not found');
  });
});
