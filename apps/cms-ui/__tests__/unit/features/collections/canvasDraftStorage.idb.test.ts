import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  saveCanvasDraft,
  getCanvasDraft,
  deleteCanvasDraft,
  listCanvasDrafts,
  clearAllCanvasDrafts,
  purgeStaleDrafts,
} from '../../../../src/features/collections/storage/canvasDraftStorage';

const draft = (pageId: string, updatedAt = Date.now()) =>
  ({
    pageId,
    schemaSlug: 'pages',
    title: pageId,
    slug: `/${pageId}`,
    body: {},
    updatedAt,
    isDirty: true,
    builderType: 'grapesjs',
  }) as never;

describe('canvasDraftStorage (IndexedDB)', () => {
  beforeEach(async () => {
    await clearAllCanvasDrafts();
  });

  it('persists, reads, lists and deletes drafts', async () => {
    await saveCanvasDraft(draft('a'));
    await saveCanvasDraft(draft('b'));
    expect((await getCanvasDraft('a'))?.title).toBe('a');
    expect(await getCanvasDraft('missing')).toBeNull();
    expect((await listCanvasDrafts()).map((d) => d.pageId).sort()).toEqual([
      'a',
      'b',
    ]);
    await deleteCanvasDraft('a');
    expect(await getCanvasDraft('a')).toBeNull();
  });

  it('overwrites a draft with the same page id', async () => {
    await saveCanvasDraft(draft('a'));
    await saveCanvasDraft({
      ...(draft('a') as object),
      title: 'changed',
    } as never);
    expect((await getCanvasDraft('a'))?.title).toBe('changed');
    expect(await listCanvasDrafts()).toHaveLength(1);
  });

  it('purges only stale drafts', async () => {
    await saveCanvasDraft(draft('old', Date.now() - 10_000));
    await saveCanvasDraft(draft('new'));
    expect(await purgeStaleDrafts(5_000)).toBe(1);
    expect((await listCanvasDrafts()).map((d) => d.pageId)).toEqual(['new']);
  });

  it('clearAll empties the store', async () => {
    await saveCanvasDraft(draft('a'));
    await clearAllCanvasDrafts();
    expect(await listCanvasDrafts()).toEqual([]);
  });

  describe('when IndexedDB fails', () => {
    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(window.indexedDB, 'open').mockImplementation(() => {
        throw new Error('blocked');
      });
    });
    afterEach(() => vi.restoreAllMocks());

    it('falls back to memory for save/get/list', async () => {
      await saveCanvasDraft(draft('mem'));
      expect((await getCanvasDraft('mem'))?.pageId).toBe('mem');
      expect((await listCanvasDrafts()).map((d) => d.pageId)).toContain('mem');
    });

    it('swallows delete/clear/purge errors', async () => {
      await expect(deleteCanvasDraft('x')).resolves.toBeUndefined();
      await expect(clearAllCanvasDrafts()).resolves.toBeUndefined();
      await expect(purgeStaleDrafts(0)).resolves.toBeTypeOf('number');
    });
  });

  it('rejects when opening the database errors', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const open = window.indexedDB.open.bind(window.indexedDB);
    vi.spyOn(window.indexedDB, 'open').mockImplementation((...a) => {
      const req = open(...a);
      setTimeout(() => req.onerror?.({ target: req } as never), 0);
      return req;
    });
    await saveCanvasDraft(draft('e'));
    vi.restoreAllMocks();
  });
});
