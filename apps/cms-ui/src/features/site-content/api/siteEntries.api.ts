import { collectionsApi } from '@/features/collections/api/collections.api';
import type { PageEntry } from '@/types/content.types';
import { toSlug as slugify } from '@/utils/apiId.util';
import type { EntryKind, SiteEntrySaveData } from '../types/siteContent.types';

export type { EntryKind };
export { slugify };

/** Entries of one kind from the website's entry list (already loaded). */
export const ofKind = (entries: PageEntry[], kind: EntryKind): PageEntry[] =>
  entries.filter((e) => e.data?.kind === kind);

/**
 * Tags, shared sections and redirects are entries of their own kind in the
 * website's collection. Saving publishes them: they have no draft state.
 */
export const siteEntries = {
  save: async (
    siteSlug: string,
    existingId: string | null,
    kind: EntryKind,
    data: SiteEntrySaveData,
  ): Promise<PageEntry> => {
    const payload = { ...data, kind };
    const saved = existingId
      ? await collectionsApi.updatePage(siteSlug, existingId, payload)
      : await collectionsApi.createPage(siteSlug, payload);
    return collectionsApi.publishPage(siteSlug, saved.id);
  },
  remove: (siteSlug: string, id: string) =>
    collectionsApi.deletePage(siteSlug, id),
};
