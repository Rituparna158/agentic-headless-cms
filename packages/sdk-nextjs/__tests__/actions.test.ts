import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createEntryAction,
  updateEntryAction,
  publishEntryAction,
  deleteEntryAction,
} from '../src/actions/content-actions.js';
import { _resetConfig } from '../src/fetch.js';

const ORIGINAL_ENV = process.env;

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

const mockEntry = {
  id: 'entry-123',
  status: 'draft',
  data: { title: 'Test Entry' },
};

describe('Content Server Actions', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env['CMS_API_URL'] = 'http://localhost:3000';
    process.env['CMS_API_TOKEN'] = 'test-token';
    if (_resetConfig) _resetConfig();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockEntry, success: true }),
      }),
    );
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    if (_resetConfig) _resetConfig();
    vi.unstubAllGlobals();
  });

  describe('createEntryAction', () => {
    it('sends POST request and revalidates tags on success', async () => {
      const action = createEntryAction('blog-post');

      const formData = new FormData();
      formData.append('title', 'Hello World');
      formData.append('$ACTION_ID_123', 'internal-nextjs-stuff');

      const result = await action(null, formData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEntry);

      const [url, options] = vi.mocked(fetch).mock.calls[0]!;
      expect(url).toContain('/api/v1/content/blog-post');
      expect(options!.method).toBe('POST');
      expect(JSON.parse(options!.body as string)).toEqual({
        title: 'Hello World',
      });

      const { revalidateTag } = await import('next/cache');
      expect(revalidateTag).toHaveBeenCalledWith(
        'cms:content:blog-post',
        undefined,
      );
      expect(revalidateTag).toHaveBeenCalledWith('cms', undefined);
    });

    it('returns error state if fetch fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Validation Failed' }),
      } as Response);

      const action = createEntryAction('blog-post');
      const result = await action(null, { title: 'Hello World' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation Failed');
    });
  });

  describe('updateEntryAction', () => {
    it('uses explicitly passed entryId', async () => {
      const action = updateEntryAction('blog-post', 'entry-456');
      const result = await action(null, { title: 'Updated' });

      expect(result.success).toBe(true);

      const [url, options] = vi.mocked(fetch).mock.calls[0]!;
      expect(url).toContain('/api/v1/content/blog-post/entry-456');
      expect(options!.method).toBe('PATCH');

      const { revalidateTag } = await import('next/cache');
      expect(revalidateTag).toHaveBeenCalledWith(
        'cms:content:blog-post:entry-456',
        undefined,
      );
    });

    it('extracts entryId from payload if not explicitly passed', async () => {
      const action = updateEntryAction('blog-post');

      const formData = new FormData();
      formData.append('id', 'entry-789');
      formData.append('title', 'Updated');

      const result = await action(null, formData);

      expect(result.success).toBe(true);

      const [url] = vi.mocked(fetch).mock.calls[0]!;
      expect(url).toContain('/api/v1/content/blog-post/entry-789');
    });
  });

  describe('publishEntryAction', () => {
    it('sends POST request to publish endpoint', async () => {
      const action = publishEntryAction('blog-post', 'entry-123');
      const result = await action(null, {});

      expect(result.success).toBe(true);

      const [url, options] = vi.mocked(fetch).mock.calls[0]!;
      expect(url).toContain('/api/v1/content/blog-post/entry-123/publish');
      expect(options!.method).toBe('POST');
    });
  });

  describe('deleteEntryAction', () => {
    it('sends DELETE request and revalidates cache', async () => {
      const action = deleteEntryAction('blog-post', 'entry-123');
      const result = await action(null, {});

      expect(result.success).toBe(true);

      const [url, options] = vi.mocked(fetch).mock.calls[0]!;
      expect(url).toContain('/api/v1/content/blog-post/entry-123');
      expect(options!.method).toBe('DELETE');
    });
  });
});
