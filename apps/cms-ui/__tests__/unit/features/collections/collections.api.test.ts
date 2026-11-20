import { describe, it, expect, vi, beforeEach } from 'vitest';

const rh = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));
vi.mock('@/api/requestHandler', () => ({ requestHandler: rh }));

import { collectionsApi } from '../../../../src/features/collections/api/collections.api';

const page = (id: string, slug: string) => ({ id, data: { slug } });
const ok = (data: unknown) => Promise.resolve({ data });

describe('collectionsApi', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('listSchemas builds the query and returns data', async () => {
    rh.get.mockReturnValue(ok({ data: [] }));
    const res = await collectionsApi.listSchemas({
      page: 2,
      pageSize: 5,
      search: 'x',
      sortBy: 'name',
      sortOrder: 'desc',
    });
    const [url, cfg] = rh.get.mock.calls[0]!;
    expect(Object.fromEntries(new URLSearchParams(url.split('?')[1]))).toEqual({
      page: '2',
      pageSize: '5',
      search: 'x',
      sortBy: 'name',
      sortOrder: 'desc',
    });
    expect(cfg.endpointLabel).toBe('collectionsApi.listSchemas');
    expect(res).toEqual({ data: [] });
  });

  it('listSchemas without params has an empty query', async () => {
    rh.get.mockReturnValue(ok({ data: [] }));
    await collectionsApi.listSchemas();
    expect(rh.get.mock.calls[0]![0]).toBe('/schemas?');
  });

  it('createSchema posts default collection fields', async () => {
    rh.post.mockReturnValue(ok({ id: 's1' }));
    const res = await collectionsApi.createSchema({ name: 'N', slug: 'n' });
    const [url, body] = rh.post.mock.calls[0]!;
    expect(url).toBe('/schemas');
    expect(body).toMatchObject({ name: 'N', slug: 'n', type: 'collection' });
    expect(Array.isArray(body.fields)).toBe(true);
    expect(res).toEqual({ id: 's1' });
  });

  it('updateSchema / deleteSchema', async () => {
    rh.put.mockReturnValue(ok({ id: 's1' }));
    rh.delete.mockReturnValue(ok(null));
    await collectionsApi.updateSchema('s1', { name: 'A' });
    await collectionsApi.deleteSchema('s1');
    await collectionsApi.deleteSchema('s1', true);
    expect(rh.put.mock.calls[0]![0]).toBe('/schemas/s1');
    expect(rh.delete.mock.calls[0]![0]).toBe('/schemas/s1?force=false');
    expect(rh.delete.mock.calls[1]![0]).toBe('/schemas/s1?force=true');
  });

  it('listPages defaults to status=all and builds sort/search', async () => {
    rh.get.mockReturnValue(ok({ data: [] }));
    await collectionsApi.listPages('pages');
    expect(rh.get.mock.calls[0]![0]).toBe('/content/pages?status=all');
    await collectionsApi.listPages('pages', {
      page: 1,
      pageSize: 10,
      search: '  hi ',
      sortBy: 'title',
    });
    const q = new URLSearchParams(rh.get.mock.calls[1]![0].split('?')[1]);
    expect(q.get('sort')).toBe('title:asc');
    expect(q.get('search')).toBe('hi');
    await collectionsApi.listPages('pages', {
      sortBy: 'title',
      sortOrder: 'desc',
    });
    expect(rh.get.mock.calls[2]![0]).toContain('sort=title%3Adesc');
  });

  it('page CRUD and publish/unpublish hit entry endpoints', async () => {
    rh.get.mockReturnValue(ok({ id: 'e1' }));
    rh.post.mockReturnValue(ok({ id: 'e1' }));
    rh.put.mockReturnValue(ok({ id: 'e1' }));
    rh.delete.mockReturnValue(ok(null));
    await collectionsApi.getPage('pages', 'e1');
    await collectionsApi.createPage('pages', { title: 't', slug: 's' });
    await collectionsApi.updatePage('pages', 'e1', { title: 't', slug: 's' });
    await collectionsApi.deletePage('pages', 'e1');
    await collectionsApi.publishPage('pages', 'e1');
    await collectionsApi.unpublishPage('pages', 'e1');
    expect(rh.get.mock.calls[0]![0]).toBe('/content/pages/e1');
    expect(rh.post.mock.calls[0]![0]).toBe('/content/pages');
    expect(rh.put.mock.calls[0]![0]).toBe('/content/pages/e1');
    expect(rh.delete.mock.calls[0]![0]).toBe('/content/pages/e1');
    expect(rh.post.mock.calls[1]![0]).toBe('/content/pages/e1/publish');
    expect(rh.post.mock.calls[2]![0]).toBe('/content/pages/e1/unpublish');
  });

  it('getSchemaBySlug / getVersions / revertVersion', async () => {
    rh.get.mockReturnValue(ok([]));
    rh.post.mockReturnValue(ok({ id: 'e1' }));
    await collectionsApi.getSchemaBySlug('pages');
    await collectionsApi.getVersions('pages', 'e1');
    await collectionsApi.revertVersion('pages', 'e1', 3);
    expect(rh.get.mock.calls[0]![0]).toBe('/schemas/slug/pages');
    expect(rh.post.mock.calls[0]![1]).toEqual({ versionNo: 3 });
  });

  describe('getPageBySlug', () => {
    it('returns the first strategy match (slug with leading slash)', async () => {
      rh.get.mockReturnValueOnce(ok({ data: [page('p1', '/about')] }));
      const res = await collectionsApi.getPageBySlug('pages', 'about');
      expect(res).toMatchObject({ id: 'p1' });
      expect(decodeURIComponent(rh.get.mock.calls[0]![0])).toContain(
        '[$eq]=/about',
      );
    });

    it('falls back to the raw slug when the first lookup is empty', async () => {
      rh.get
        .mockReturnValueOnce(ok({ data: [] }))
        .mockReturnValueOnce(ok({ data: [page('p2', 'about')] }));
      const res = await collectionsApi.getPageBySlug('pages', '/about');
      expect(res).toMatchObject({ id: 'p2' });
    });

    it('falls back to a local list match when filters fail', async () => {
      rh.get
        .mockRejectedValueOnce(new Error('x'))
        .mockRejectedValueOnce(new Error('x'))
        .mockReturnValueOnce(ok({ data: [page('p3', '/about')] }));
      const res = await collectionsApi.getPageBySlug('pages', 'about');
      expect(res).toMatchObject({ id: 'p3' });
    });

    it('finally tries the entry id directly', async () => {
      rh.get
        .mockReturnValueOnce(ok({ data: [] }))
        .mockReturnValueOnce(ok({ data: [] }))
        .mockReturnValueOnce(ok({ data: [] }))
        .mockReturnValueOnce(ok({ id: 'abc' }));
      const res = await collectionsApi.getPageBySlug('pages', 'abc');
      expect(res).toEqual({ id: 'abc' });
      expect(rh.get.mock.calls[3]![0]).toBe('/content/pages/abc');
    });

    it('throws when nothing matches', async () => {
      rh.get.mockRejectedValue(new Error('nope'));
      await expect(
        collectionsApi.getPageBySlug('pages', 'missing'),
      ).rejects.toThrow(/not found in pages/);
    });
  });
});
