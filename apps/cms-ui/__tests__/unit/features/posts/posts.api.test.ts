import { describe, it, expect, vi, beforeEach } from 'vitest';

const rh = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));
vi.mock('@/api/requestHandler', () => ({ requestHandler: rh }));

import {
  postsApi,
  extractArrayPayload,
} from '../../../../src/features/posts/api/posts.api';

describe('extractArrayPayload', () => {
  it.each([
    [null, []],
    [undefined, []],
    ['str', []],
    [
      [1, 2],
      [1, 2],
    ],
    [{ data: [1] }, [1]],
    [{ data: { data: [2] } }, [2]],
    [{ items: [3] }, [3]],
    [{ entries: [4] }, [4]],
    [{ nothing: true }, []],
    [{ data: { other: 1 } }, []],
  ])('%j -> %j', (input, out) => {
    expect(extractArrayPayload(input)).toEqual(out);
  });
});

const schema = (over: Record<string, unknown> = {}) => ({
  id: 's1',
  name: 'Site',
  slug: 'site',
  type: 'collection',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-02',
  ...over,
});

describe('postsApi', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('listCollections', () => {
    it('keeps only collections and enriches them with stats + lineage', async () => {
      rh.get.mockImplementation(async (url: string) => {
        if (url === '/schemas') {
          return {
            data: {
              data: [
                schema({
                  metadata: {
                    is_public: true,
                    parent_schema_id: 'p',
                    parent_schema_name: 'Parent',
                    fork_count: 2,
                  },
                  fields: [{ apiId: 'a' }],
                }),
                schema({ id: 's2', slug: 'cmp', type: 'component' }),
                schema({
                  id: 's3',
                  slug: 'def',
                  definition: { fields: [{ apiId: 'd' }], metadata: {} },
                }),
              ],
            },
          };
        }
        return { data: { meta: { pagination: { total: 7 } } } };
      });
      const res = await postsApi.listCollections();
      expect(res.map((c) => c.id)).toEqual(['s1', 's3']);
      expect(res[0]).toMatchObject({
        entryCount: 7,
        linkedPagesCount: 7,
        isPublic: true,
        fields: [{ apiId: 'a' }],
        lineage: {
          isForked: true,
          forkCount: 2,
          forkedFrom: { schemaId: 'p', schemaName: 'Parent' },
        },
      });
      expect(res[1]!.fields).toEqual([{ apiId: 'd' }]);
      expect(res[1]!.lineage!.isForked).toBe(false);
    });

    it('survives a failing per-schema entry query', async () => {
      rh.get.mockImplementation(async (url: string) => {
        if (url === '/schemas') return { data: [schema({ entryCount: 4 })] };
        throw new Error('boom');
      });
      const res = await postsApi.listCollections();
      expect(res[0]!.entryCount).toBe(4);
      expect(res[0]!.linkedPagesCount).toBe(0);
    });
  });

  describe('listPagesForCollection', () => {
    it('reads every page and normalises titles/slugs', async () => {
      rh.get
        .mockResolvedValueOnce({
          data: {
            data: [{ id: '1', data: { title: 'A' } }],
            meta: { pagination: { pageCount: 2 } },
          },
        })
        .mockResolvedValueOnce({
          data: {
            data: [{ id: '2', data: {} }],
            meta: { pagination: { pageCount: 2 } },
          },
        });
      const res = await postsApi.listPagesForCollection('site');
      expect(rh.get).toHaveBeenCalledTimes(2);
      expect(res[0]).toMatchObject({ title: 'A', slug: '1' });
      expect(res[1]).toMatchObject({ title: 'Untitled Page', slug: '2' });
    });

    it('returns [] on failure', async () => {
      rh.get.mockRejectedValue(new Error('x'));
      expect(await postsApi.listPagesForCollection('site')).toEqual([]);
    });
  });

  describe('listPagesPaged', () => {
    it('sends trimmed search and exclusion filters, returns pagination', async () => {
      rh.get.mockResolvedValue({
        data: {
          data: [{ id: '1', title: 'T', slug: 's', data: {} }],
          meta: { pagination: { total: 40, page: 2, pageSize: 5 } },
        },
      });
      const res = await postsApi.listPagesPaged('site', {
        page: 2,
        pageSize: 5,
        search: ' q ',
        excludeKind: 'post',
        status: 'draft',
      });
      expect(rh.get.mock.calls[0]![1].params).toEqual({
        page: 2,
        pageSize: 5,
        status: 'draft',
        search: 'q',
        excludeKind: 'post',
      });
      expect(res).toMatchObject({ total: 40, page: 2, pageSize: 5 });
    });

    it('falls back to defaults when meta is missing', async () => {
      rh.get.mockResolvedValue({ data: { data: [{ id: '1', data: {} }] } });
      const res = await postsApi.listPagesPaged('site');
      expect(res).toMatchObject({ total: 1, page: 1, pageSize: 10 });
      expect(rh.get.mock.calls[0]![1].params).toEqual({
        page: 1,
        pageSize: 10,
        status: 'all',
      });
    });
  });

  describe('createDynamicSchema', () => {
    it('normalises field ids and returns the created collection', async () => {
      rh.post.mockResolvedValue({
        data: {
          id: 'n1',
          name: 'N',
          slug: 'n',
          createdAt: 'c',
          updatedAt: 'u',
        },
      });
      const res = await postsApi.createDynamicSchema({
        name: 'N',
        slug: 'n',
        type: 'collection',
        isPublic: true,
        fields: [{ apiId: 'My Field!', displayName: 'My', dataType: 'text' }],
      } as never);
      const body = rh.post.mock.calls[0]![1];
      expect(body.fields[0]).toMatchObject({
        apiId: 'my_field_',
        isRequired: false,
        sortOrder: 0,
        validation: null,
      });
      expect(body.metadata).toMatchObject({
        is_public: true,
        category: 'custom',
      });
      expect(res).toMatchObject({ id: 'n1', isPublic: true, entryCount: 0 });
    });

    it('unwraps double-nested responses', async () => {
      rh.post.mockResolvedValue({
        data: { data: { id: 'n2', name: 'N', slug: 'n', fields: [] } },
      });
      const res = await postsApi.createDynamicSchema({
        name: 'N',
        slug: 'n',
        type: 'collection',
        fields: [],
        lineage: {
          forkedFrom: { schemaId: 'p', schemaName: 'P', schemaSlug: 'p' },
          forkCount: 1,
        },
      } as never);
      expect(res.id).toBe('n2');
      expect(res.lineage!.isForked).toBe(true);
    });
  });

  it('toggleSchemaPublic flips the flag', async () => {
    rh.put.mockResolvedValue({});
    await postsApi.toggleSchemaPublic('s1', {
      is_public: true,
      category: 'x',
    } as never);
    await postsApi.toggleSchemaPublic('s1');
    expect(rh.put.mock.calls[0]![1].metadata).toMatchObject({
      is_public: false,
      category: 'x',
    });
    expect(rh.put.mock.calls[1]![1].metadata).toMatchObject({
      is_public: true,
    });
  });

  describe('entries', () => {
    it('listEntries maps entries and pagination', async () => {
      rh.get.mockResolvedValue({
        data: {
          data: [
            {
              id: '1',
              status: 'published',
              data: { title: 'T', slug: 's', x: 1 },
            },
            { id: '2', data: {} },
          ],
          meta: { pagination: { total: 9, page: 3, pageSize: 2 } },
        },
      });
      const res = await postsApi.listEntries('site', { search: 'q' });
      expect(rh.get.mock.calls[0]![1].params).toEqual({
        status: 'all',
        search: 'q',
      });
      expect(res.entries[0]).toMatchObject({
        status: 'published',
        title: 'T',
        locale: 'en',
      });
      expect(res.entries[1]).toMatchObject({
        status: 'draft',
        title: 'Untitled',
      });
      expect(res).toMatchObject({ total: 9, page: 3, pageSize: 2 });
    });

    it('listEntries defaults pagination', async () => {
      rh.get.mockResolvedValue({ data: { data: [] } });
      const res = await postsApi.listEntries('site');
      expect(res).toMatchObject({ total: 0, page: 1, pageSize: 20 });
    });

    it('createEntry trims title/slug and unwraps the response', async () => {
      rh.post.mockResolvedValue({
        data: { data: { id: 'e1', status: 'published', data: { extra: 1 } } },
      });
      const res = await postsApi.createEntry('site', {
        title: '  Hi ',
        slug: ' s ',
        body: 1,
      });
      expect(rh.post.mock.calls[0]![1]).toEqual({
        body: 1,
        title: 'Hi',
        slug: 's',
      });
      expect(res).toMatchObject({
        id: 'e1',
        title: 'Hi',
        slug: 's',
        status: 'published',
      });
      expect(res.data).toMatchObject({ extra: 1 });
    });

    it('createEntry generates defaults for blank input', async () => {
      rh.post.mockResolvedValue({ data: { id: 'e1' } });
      await postsApi.createEntry('site', {});
      const body = rh.post.mock.calls[0]![1];
      expect(body.title).toBe('Untitled');
      expect(body.slug).toMatch(/^entry-/);
    });

    it('updateEntry / deleteEntry / publishEntry', async () => {
      rh.put.mockResolvedValue({ data: { id: 'e1' } });
      rh.delete.mockResolvedValue({});
      rh.post.mockResolvedValue({});
      const res = await postsApi.updateEntry('site', 'e1', {
        title: ' ',
        slug: '',
      });
      expect(rh.put.mock.calls[0]![0]).toBe('/content/site/e1');
      expect(rh.put.mock.calls[0]![1]).toEqual({
        title: 'Untitled',
        slug: 'entry',
      });
      expect(res.id).toBe('e1');
      await postsApi.deleteEntry('site', 'e1');
      await postsApi.publishEntry('site', 'e1');
      expect(rh.delete).toHaveBeenCalledWith('/content/site/e1');
      expect(rh.post).toHaveBeenCalledWith('/content/site/e1/publish');
    });

    it('batchImportEntries counts successes and collects errors', async () => {
      rh.post
        .mockResolvedValueOnce({ data: { id: '1' } })
        .mockRejectedValueOnce(new Error('bad row'))
        .mockRejectedValueOnce('weird');
      const res = await postsApi.batchImportEntries('site', [
        { title: 'a' },
        { title: 'b' },
        { title: 'c' },
      ]);
      expect(res.importedCount).toBe(1);
      expect(res.errors).toEqual(['bad row', 'Failed to import entry c']);
    });
  });

  describe('templates & forking', () => {
    const collection = (over = {}) =>
      ({
        id: 'c1',
        name: 'Blog',
        slug: 'blog',
        fields: [{ apiId: 'title' }, { apiId: 'extra', isRequired: true }],
        metadata: { category: 'editorial', fork_count: 1 },
        ...over,
      }) as never;

    it('getSharedTemplates adds public collections to the built-ins', () => {
      const base = postsApi.getSharedTemplates().length;
      const res = postsApi.getSharedTemplates([
        collection({ metadata: { is_public: true, fork_count: 3 } }),
        collection({ id: 'c2' }),
      ]);
      expect(res.length).toBe(base + 1);
      expect(res.at(-1)).toMatchObject({
        id: 'public-c1',
        forkCount: 3,
        authorSite: 'Universal Registry',
      });
    });

    it('forkSchema keeps default fields, makes extras optional and bumps fork_count', async () => {
      rh.post.mockResolvedValue({
        data: { id: 'new', name: 'x', slug: 'x', fields: [] },
      });
      rh.put.mockResolvedValue({});
      await postsApi.forkSchema(collection());
      const body = rh.post.mock.calls[0]![1];
      expect(body.name).toBe('Blog (Forked)');
      expect(body.slug).toMatch(/^blog-fork-/);
      const extra = body.fields.find(
        (f: { apiId: string }) => f.apiId === 'extra',
      );
      expect(extra.isRequired).toBe(false);
      expect(rh.put.mock.calls[0]![0]).toBe('/schemas/c1');
      expect(rh.put.mock.calls[0]![1].metadata.fork_count).toBe(2);
    });

    it('forkSchema tolerates a failing parent update', async () => {
      rh.post.mockResolvedValue({ data: { id: 'new', name: 'x', slug: 'x' } });
      rh.put.mockRejectedValue(new Error('nope'));
      await expect(
        postsApi.forkSchema(collection(), 'N', 'n'),
      ).resolves.toMatchObject({ id: 'new' });
    });

    it('forkTemplate records lineage from the template', async () => {
      rh.post.mockResolvedValue({ data: { id: 'f1', name: 'x', slug: 'x' } });
      const tpl = {
        id: 'tpl',
        title: 'Tpl',
        category: 'cat',
        description: 'd',
        authorSite: 'a',
        schema: { slug: 'tpl-slug', fields: [{ apiId: 'zzz' }] },
      } as never;
      await postsApi.forkTemplate(tpl, 'Name', 'name');
      const body = rh.post.mock.calls[0]![1];
      expect(body).toMatchObject({ name: 'Name', slug: 'name' });
      expect(body.metadata).toMatchObject({
        parent_schema_id: 'tpl',
        parent_schema_slug: 'tpl-slug',
        category: 'cat',
      });
    });

    it('forkTemplate generates a name and slug', async () => {
      rh.post.mockResolvedValue({ data: { id: 'f1', name: 'x', slug: 'x' } });
      await postsApi.forkTemplate({
        id: 't',
        title: 'T',
        category: 'c',
        description: 'd',
        authorSite: 'a',
        schema: { slug: 'ts' },
      } as never);
      const body = rh.post.mock.calls[0]![1];
      expect(body.name).toBe('T (Forked)');
      expect(body.slug).toMatch(/^ts-forked-/);
    });
  });
});
