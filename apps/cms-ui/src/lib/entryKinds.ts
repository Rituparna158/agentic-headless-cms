/**
 * Entries of a website that are not pages the visitor can open on their own:
 * posts live under Posts, the rest is site furniture or messages from visitors.
 * Sent to the server as `excludeKind` so counts and paging stay correct.
 */
export const NON_PAGE_KINDS = [
  'post',
  'menus',
  'tag',
  'section',
  'redirect',
  'submission',
] as const;

export const NON_PAGE_KIND_PARAM = NON_PAGE_KINDS.join(',');

export const isPageEntry = (entry: {
  data?: Record<string, unknown>;
}): boolean =>
  entry.data?.isArticle !== true &&
  !(NON_PAGE_KINDS as readonly string[]).includes(entry.data?.kind as string);
