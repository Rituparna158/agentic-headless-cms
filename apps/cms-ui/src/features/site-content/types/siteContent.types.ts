export type EntryKind = 'tag' | 'section' | 'redirect' | 'menus';

export type SiteContentTab = 'sections' | 'tags' | 'redirects';

export type SiteEntrySaveData = { title: string; slug: string } & Record<
  string,
  unknown
>;
