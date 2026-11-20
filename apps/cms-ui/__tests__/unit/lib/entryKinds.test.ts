import { describe, it, expect } from 'vitest';
import { isPageEntry, NON_PAGE_KIND_PARAM } from '../../../src/lib/entryKinds';

describe('isPageEntry', () => {
  it('counts pages, with or without a kind', () => {
    expect(isPageEntry({ data: { title: 'Home' } })).toBe(true);
    expect(isPageEntry({ data: { kind: 'page' } })).toBe(true);
    expect(isPageEntry({})).toBe(true);
  });
  it('leaves out posts, menus, tags, sections, redirects and messages', () => {
    for (const kind of [
      'post',
      'menus',
      'tag',
      'section',
      'redirect',
      'submission',
    ]) {
      expect(isPageEntry({ data: { kind } })).toBe(false);
      expect(NON_PAGE_KIND_PARAM).toContain(kind);
    }
  });
  it('leaves out old-style articles', () => {
    expect(isPageEntry({ data: { isArticle: true } })).toBe(false);
  });
});
