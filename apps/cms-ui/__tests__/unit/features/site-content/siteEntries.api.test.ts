import { describe, it, expect, vi, beforeEach } from 'vitest';

const ca = vi.hoisted(() => ({
  createPage: vi.fn(),
  updatePage: vi.fn(),
  publishPage: vi.fn(),
  deletePage: vi.fn(),
}));
vi.mock('@/features/collections/api/collections.api', () => ({
  collectionsApi: ca,
}));

import {
  siteEntries,
  ofKind,
  slugify,
} from '../../../../src/features/site-content/api/siteEntries.api';

describe('siteEntries', () => {
  beforeEach(() => vi.resetAllMocks());

  it('ofKind filters by data.kind', () => {
    const list = [
      { id: '1', data: { kind: 'tag' } },
      { id: '2', data: { kind: 'redirect' } },
      { id: '3' },
    ] as never[];
    expect(
      ofKind(list, 'tag' as never).map((e: { id: string }) => e.id),
    ).toEqual(['1']);
  });

  it('re-exports slugify', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('save creates + publishes with the kind', async () => {
    ca.createPage.mockResolvedValue({ id: 'n' });
    ca.publishPage.mockResolvedValue({ id: 'n' });
    await siteEntries.save(
      's',
      null,
      'tag' as never,
      { title: 'T', slug: 't' } as never,
    );
    expect(ca.createPage).toHaveBeenCalledWith('s', {
      title: 'T',
      slug: 't',
      kind: 'tag',
    });
    expect(ca.publishPage).toHaveBeenCalledWith('s', 'n');
  });

  it('save updates when an id exists', async () => {
    ca.updatePage.mockResolvedValue({ id: 'e1' });
    ca.publishPage.mockResolvedValue({ id: 'e1' });
    await siteEntries.save(
      's',
      'e1',
      'redirect' as never,
      { title: 'R', slug: 'r' } as never,
    );
    expect(ca.updatePage).toHaveBeenCalledWith(
      's',
      'e1',
      expect.objectContaining({ kind: 'redirect' }),
    );
  });

  it('remove deletes the page', async () => {
    ca.deletePage.mockResolvedValue(undefined);
    await siteEntries.remove('s', 'e1');
    expect(ca.deletePage).toHaveBeenCalledWith('s', 'e1');
  });
});
