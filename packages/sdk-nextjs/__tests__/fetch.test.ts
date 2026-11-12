import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cmsServerFetch, _resetConfig } from '../src/fetch.js';

const ORIGINAL_ENV = process.env;

describe('cmsServerFetch', () => {
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

  it('returns undefined for 204 No Content without calling json()', async () => {
    const jsonSpy = vi
      .fn()
      .mockRejectedValue(new SyntaxError('Unexpected end of JSON input'));
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: jsonSpy,
      }),
    );

    const result = await cmsServerFetch<void>(
      '/api/v1/content/posts/entry-1',
      undefined,
      undefined,
      { method: 'DELETE' },
    );

    expect(result).toBeUndefined();
    expect(jsonSpy).not.toHaveBeenCalled();
  });

  it('returns undefined for real Response with status 204 or 205', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { status: 204 }))
        .mockResolvedValueOnce(new Response(null, { status: 205 })),
    );

    await expect(
      cmsServerFetch<void>('/api/v1/content/posts/1', undefined, undefined, {
        method: 'DELETE',
      }),
    ).resolves.toBeUndefined();

    await expect(
      cmsServerFetch<void>('/api/v1/content/posts/2', undefined, undefined, {
        method: 'POST',
      }),
    ).resolves.toBeUndefined();
  });

  it('returns undefined when content-length is 0 or response body text is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(null, {
            status: 200,
            headers: { 'content-length': '0' },
          }),
        )
        .mockResolvedValueOnce(new Response('', { status: 200 })),
    );

    await expect(
      cmsServerFetch<void>('/api/v1/empty-header'),
    ).resolves.toBeUndefined();
    await expect(
      cmsServerFetch<void>('/api/v1/empty-body'),
    ).resolves.toBeUndefined();
  });

  it('unwraps data field from standard JSON API responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ data: { id: 'post-1' }, success: true }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
      ),
    );

    const data = await cmsServerFetch<{ id: string }>(
      '/api/v1/content/posts/1',
    );
    expect(data).toEqual({ id: 'post-1' });
  });

  it('throws formatted error for non-OK responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Forbidden action' }), {
          status: 403,
          statusText: 'Forbidden',
        }),
      ),
    );

    await expect(
      cmsServerFetch('/api/v1/content/posts/1'),
    ).rejects.toThrowError(
      '[sdk-nextjs] 403: Forbidden action (/api/v1/content/posts/1)',
    );
  });
});
