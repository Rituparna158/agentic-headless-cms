import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveCanvasDraft,
  getCanvasDraft,
  deleteCanvasDraft,
  listCanvasDrafts,
  clearAllCanvasDrafts,
  purgeStaleDrafts,
  CanvasDraftRecord,
} from '@/features/collections/storage/canvasDraftStorage';

describe('CanvasDraftStorage (Offline Persistence Driver)', () => {
  beforeEach(async () => {
    await clearAllCanvasDrafts();
  });

  const sampleDraft: CanvasDraftRecord = {
    pageId: 'page-123',
    schemaSlug: 'pages',
    title: 'Landing Page',
    slug: 'landing-page',
    body: { builder: 'grapesjs', html: '<div>Hello World</div>' },
    updatedAt: Date.now(),
    isDirty: true,
    builderType: 'grapesjs',
    componentState: {
      hero: { 'hero-1': { title: 'Test Hero' } },
    },
  };

  it('saves and retrieves a canvas draft by pageId', async () => {
    await saveCanvasDraft(sampleDraft);
    const retrieved = await getCanvasDraft('page-123');

    expect(retrieved).not.toBeNull();
    expect(retrieved?.pageId).toBe('page-123');
    expect(retrieved?.title).toBe('Landing Page');
    expect(retrieved?.isDirty).toBe(true);
    expect(retrieved?.componentState).toEqual({
      hero: { 'hero-1': { title: 'Test Hero' } },
    });
  });

  it('deletes a draft on request', async () => {
    await saveCanvasDraft(sampleDraft);
    expect(await getCanvasDraft('page-123')).not.toBeNull();

    await deleteCanvasDraft('page-123');
    expect(await getCanvasDraft('page-123')).toBeNull();
  });

  it('lists all saved drafts across multiple pages', async () => {
    await saveCanvasDraft(sampleDraft);
    await saveCanvasDraft({
      ...sampleDraft,
      pageId: 'page-456',
      title: 'About Page',
    });

    const all = await listCanvasDrafts();
    expect(all.length).toBe(2);
    expect(all.some((d) => d.pageId === 'page-123')).toBe(true);
    expect(all.some((d) => d.pageId === 'page-456')).toBe(true);
  });

  it('purges stale drafts older than threshold', async () => {
    const staleTime = Date.now() - 1000 * 60 * 60 * 24 * 10; // 10 days ago
    await saveCanvasDraft({
      ...sampleDraft,
      pageId: 'stale-page',
      updatedAt: staleTime,
    });
    await saveCanvasDraft({
      ...sampleDraft,
      pageId: 'fresh-page',
      updatedAt: Date.now(),
    });

    const purged = await purgeStaleDrafts(1000 * 60 * 60 * 24 * 7); // 7 days max age
    expect(purged).toBe(1);

    expect(await getCanvasDraft('stale-page')).toBeNull();
    expect(await getCanvasDraft('fresh-page')).not.toBeNull();
  });
});
