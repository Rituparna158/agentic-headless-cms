import { collectionsApi } from '@/features/collections/api/collections.api';
import type { PageEntry } from '@/types/content.types';
import type {
  MenuItem,
  MenuDefinition,
  StoredMenus,
  StoredMenuItem,
  StoredMenuDefinition,
} from '../types/menus.types';

export type {
  MenuItem,
  MenuDefinition,
  StoredMenus,
  StoredMenuItem,
  StoredMenuDefinition,
};

export const isMenusEntry = (e: PageEntry): boolean => e.data?.kind === 'menus';

export const findMenusEntry = (entries: PageEntry[]): PageEntry | null =>
  entries.find(isMenusEntry) ?? null;

export const readMenus = (entry: PageEntry | null): StoredMenus | null => {
  const d = entry?.data as Record<string, unknown> | undefined;
  if (!d || !Array.isArray(d.menus)) return null;
  return {
    menus: d.menus as StoredMenuDefinition[],
    items: (d.items as Record<string, StoredMenuItem[]>) ?? {},
  };
};

/**
 * Menus are one entry of kind "menus" in the site's own collection.
 * Saving also publishes it, so the live site shows the same navigation.
 */
export const menusApi = {
  save: async (
    siteSlug: string,
    existing: PageEntry | null,
    value: StoredMenus,
  ): Promise<PageEntry> => {
    const data = {
      kind: 'menus',
      title: 'Navigation menus',
      slug: '__menus',
      menus: value.menus,
      items: value.items,
    };
    const saved = existing
      ? await collectionsApi.updatePage(siteSlug, existing.id, data)
      : await collectionsApi.createPage(siteSlug, data);
    return collectionsApi.publishPage(siteSlug, saved.id);
  },
};
