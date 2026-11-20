import { describe, it, expect, vi, beforeEach } from 'vitest';

const ca = vi.hoisted(() => ({
  createPage: vi.fn(),
  updatePage: vi.fn(),
  publishPage: vi.fn(),
}));
vi.mock('@/features/collections/api/collections.api', () => ({
  collectionsApi: ca,
}));

import {
  menusApi,
  isMenusEntry,
  findMenusEntry,
  readMenus,
} from '../../../../src/features/menus/api/menus.api';
import {
  DEFAULT_MENUS,
  MAX_MENU_DEPTH,
  getMenuStorageKey,
} from '../../../../src/features/menus/constants/menus.constants';

const entry = (kind?: string, extra: Record<string, unknown> = {}) =>
  ({ id: 'm1', data: { kind, ...extra } }) as never;

describe('menus helpers', () => {
  it('identifies and finds the menus entry', () => {
    expect(isMenusEntry(entry('menus'))).toBe(true);
    expect(isMenusEntry(entry('post'))).toBe(false);
    expect(findMenusEntry([entry('post'), entry('menus')])).toMatchObject({
      id: 'm1',
    });
    expect(findMenusEntry([entry('post')])).toBeNull();
  });

  it('readMenus tolerates missing data', () => {
    expect(readMenus(null)).toBeNull();
    expect(readMenus(entry('menus'))).toBeNull();
    expect(readMenus(entry('menus', { menus: [{ id: 'a' }] }))).toEqual({
      menus: [{ id: 'a' }],
      items: {},
    });
    expect(
      readMenus(entry('menus', { menus: [], items: { a: [] } }))?.items,
    ).toEqual({ a: [] });
  });

  it('exposes sensible constants', () => {
    expect(DEFAULT_MENUS.length).toBeGreaterThan(0);
    expect(MAX_MENU_DEPTH).toBeGreaterThan(0);
    expect(getMenuStorageKey('s1')).toBe('cms-ui:menus:s1');
  });
});

describe('menusApi.save', () => {
  beforeEach(() => vi.resetAllMocks());
  const value = { menus: [{ id: 'a', name: 'A' }], items: { a: [] } } as never;

  it('creates then publishes when there is no entry yet', async () => {
    ca.createPage.mockResolvedValue({ id: 'new' });
    ca.publishPage.mockResolvedValue({ id: 'new', status: 'published' });
    const res = await menusApi.save('site', null, value);
    expect(ca.createPage.mock.calls[0]![1]).toMatchObject({
      kind: 'menus',
      slug: '__menus',
    });
    expect(ca.publishPage).toHaveBeenCalledWith('site', 'new');
    expect(res).toMatchObject({ status: 'published' });
  });

  it('updates the existing entry', async () => {
    ca.updatePage.mockResolvedValue({ id: 'm1' });
    ca.publishPage.mockResolvedValue({ id: 'm1' });
    await menusApi.save('site', { id: 'm1' } as never, value);
    expect(ca.updatePage).toHaveBeenCalledWith(
      'site',
      'm1',
      expect.objectContaining({ kind: 'menus' }),
    );
    expect(ca.createPage).not.toHaveBeenCalled();
  });
});
