import { postsApi } from '@/features/posts/api/posts.api';
import type { PageEntry } from '@/types/content.types';
import { readThemeConfig } from '@/features/theme/api/theme.api';
import { DEFAULT_THEME_CONFIG } from '@/features/theme/constants/theme.constants';
import {
  GENERAL_STARTER_PAGES,
  ECOMMERCE_STARTER_PAGES,
} from '@/features/collections/constants/starter-pages.constants';
import { readingTime } from './seo';
import type {
  MenuLink,
  Rec,
  RenderMode,
  RenderSources,
  PageLayout,
  SitePage,
  SiteSection,
  SiteTag,
  SchemaOwner,
  SiteModel,
  RawSchema,
  ResolvedPath,
} from './types';

export type {
  PageLayout,
  SitePage,
  SiteSection,
  SiteTag,
  SchemaOwner,
  SiteModel,
  RawSchema,
  ResolvedPath,
};

export const normalizeSlug = (slug: string | undefined | null): string => {
  const cleaned = (slug ?? '').trim().replace(/^\/+|\/+$/g, '');
  return cleaned ? `/${cleaned}` : '/';
};

const isObject = (v: unknown): v is Rec =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * The data a page should be rendered with. "draft" is the latest saved
 * content; "live" is only what has been published (pages that were never
 * published are not visible).
 */
export const dataForMode = (entry: PageEntry, mode: RenderMode): Rec | null => {
  if (mode === 'draft') return isObject(entry.data) ? (entry.data as Rec) : {};
  if (entry.status !== 'published') return null;
  const published = entry.publishedData;
  if (isObject(published) && Object.keys(published).length > 0) {
    // Some backends wrap the snapshot as { data: {...} }
    return isObject(published.data) ? (published.data as Rec) : published;
  }
  return isObject(entry.data) ? (entry.data as Rec) : {};
};

const schemasOf = (data: Rec): RawSchema[] =>
  Array.isArray(data._schemas) ? (data._schemas as RawSchema[]) : [];

const toPost = (item: Rec, index: number, pageId: string): Rec => {
  const rawImg =
    item.image ??
    item.cover_image_url ??
    item.coverImage ??
    item.cover_image ??
    item.thumbnail;
  const imgUrl =
    typeof rawImg === 'string'
      ? rawImg
      : rawImg && typeof rawImg === 'object'
        ? (rawImg as Rec).url ||
          (rawImg as Rec).path ||
          (rawImg as Rec).src ||
          ''
        : '';
  return {
    ...item,
    image: imgUrl || (item.image as string) || '',
    cover_image_url: imgUrl || (item.cover_image_url as string) || '',
    reading_time:
      item.reading_time ||
      (typeof item.content === 'string' && item.content
        ? `${readingTime(item.content)} min read`
        : undefined),
    id: (item.id as string) || `${pageId}_item_${index + 1}`,
    slug: (item.slug as string) || `item-${index + 1}`,
    _pageId: pageId,
  };
};

const flattenEntry = (entry: PageEntry, data: Rec): Rec => {
  const { _schemas: _s, body, ...rest } = data;
  void _s;
  const bodyObj = isObject(body) && body.builder !== 'grapesjs' ? body : null;
  return {
    ...(bodyObj ?? {}),
    ...rest,
    ...(bodyObj ? { body: bodyObj } : {}),
    id: entry.id,
    title: (data.title as string) || entry.title || '',
    slug: (data.slug as string) || entry.slug || entry.id,
  };
};

/** Posts with a future publish date are not visible to visitors yet. */
const isScheduledForLater = (item: Rec, now = Date.now()): boolean => {
  const at = Date.parse(String(item.publishAt ?? ''));
  return Number.isFinite(at) && at > now;
};

/** A blog post stored as its own entry (not inside a page's JSON). */
export const isPostEntry = (entry: PageEntry): boolean => {
  const d = entry.data as Rec | undefined;
  const p = entry.publishedData as Rec | undefined;
  const pd = p && isObject(p.data) ? (p.data as Rec) : p;
  return d?.kind === 'post' || pd?.kind === 'post';
};

/** Post entries of a blog, newest first, shaped like schema items. */
const postsFromEntries = (
  entries: PageEntry[],
  mode: RenderMode,
): Record<string, Rec[]> => {
  const byBlog: Record<string, Rec[]> = {};
  for (const entry of entries) {
    if (!isPostEntry(entry)) continue;
    const data = dataForMode(entry, mode);
    if (!data) continue;
    const blogId =
      (data.blogTypeId as string | undefined) ||
      ((entry.data as Rec | undefined)?.blogTypeId as string | undefined);
    if (!blogId) continue;
    const { body: _b, ...rest } = data;
    void _b;
    const rawImg =
      data.image ??
      data.cover_image_url ??
      data.coverImage ??
      data.cover_image ??
      data.thumbnail ??
      (entry.data as Rec | undefined)?.image ??
      (entry.data as Rec | undefined)?.cover_image_url;
    const imgUrl =
      typeof rawImg === 'string'
        ? rawImg
        : rawImg && typeof rawImg === 'object'
          ? (rawImg as Rec).url ||
            (rawImg as Rec).path ||
            (rawImg as Rec).src ||
            ''
          : '';

    (byBlog[blogId] ??= []).push({
      ...rest,
      id: entry.id,
      slug: (data.slug as string) || entry.slug || entry.id,
      title: (data.title as string) || entry.title || 'Untitled',
      image: imgUrl || (rest.image as string) || '',
      cover_image_url: imgUrl || (rest.cover_image_url as string) || '',
      status: entry.status === 'published' ? 'published' : 'draft',
      _createdAt: entry.createdAt,
    });
    if (mode === 'live' && isScheduledForLater(byBlog[blogId]!.at(-1)!))
      byBlog[blogId]!.pop();
  }
  const when = (r: Rec) =>
    String(r.date || r.publishedAt || r._createdAt || '') || '';
  for (const list of Object.values(byBlog))
    list.sort((a, b) => when(b).localeCompare(when(a)));
  return byBlog;
};

export function buildSiteModel(
  entries: PageEntry[],
  mode: RenderMode,
): SiteModel {
  const postsByBlog = postsFromEntries(entries, mode);
  const pages: SitePage[] = [];
  const owners: Record<string, SchemaOwner[]> = {};
  const schemaKeys: string[] = [];
  const contentEntries: Rec[] = [];
  const menus: Record<string, MenuLink[]> = {};
  const tags: SiteTag[] = [];
  const comments: Rec[] = [];
  const sections: SiteSection[] = [];
  const redirects: { from: string; to: string }[] = [];
  let siteTheme = DEFAULT_THEME_CONFIG;

  for (const entry of entries) {
    const data = dataForMode(entry, mode);
    if (!data) continue;
    if (data.isArticle === true) continue; // legacy article entries are not pages
    if (data.kind === 'post') continue; // posts are merged into their blog below
    if (data.kind === 'submission') {
      // Form messages are private; only comments can be shown on the site
      if (data.submissionType === 'comment' && data.postSlug) {
        comments.push({
          id: entry.id,
          name: String(data.name ?? ''),
          message: String(data.message ?? ''),
          date: String(data.receivedAt ?? entry.createdAt ?? ''),
          postSlug: String(data.postSlug),
          _pending: entry.status !== 'published',
        });
      }
      continue;
    }
    if (data.kind === 'tag') {
      const slug = String(data.slug ?? '').trim();
      if (slug)
        tags.push({
          slug,
          name: String(data.title ?? slug),
          description: data.description ? String(data.description) : undefined,
        });
      continue;
    }
    if (data.kind === 'section') {
      const role =
        data.role === 'header' || data.role === 'footer' ? data.role : null;
      sections.push({
        id: entry.id,
        slug: String(data.slug ?? entry.id),
        name: String(data.title ?? 'Section'),
        html: String(data.html ?? ''),
        css: String(data.css ?? ''),
        role,
      });
      continue;
    }
    if (data.kind === 'redirect') {
      const from = String(data.from ?? '').trim();
      const to = String(data.to ?? '').trim();
      if (from && to) redirects.push({ from: normalizeSlug(from), to });
      continue;
    }
    if (data.kind === 'theme') {
      siteTheme = readThemeConfig(entry);
      continue;
    }
    if (data.kind === 'menus') {
      const items = isObject(data.items) ? (data.items as Rec) : {};
      for (const [id, list] of Object.entries(items)) {
        if (Array.isArray(list))
          menus[id] = (list as Rec[]).map((l) => ({
            label: String(l.label ?? ''),
            path: String(l.path ?? '/'),
            depth: Number(l.depth ?? 0),
          }));
      }
      continue;
    }

    const body = data.body;
    let layout =
      isObject(body) &&
      body.builder === 'grapesjs' &&
      typeof body.html === 'string'
        ? { html: body.html as string, css: (body.css as string) || '' }
        : null;
    const customDesign = Array.isArray(body) && body.length > 0 ? body : null;

    if (!layout && !customDesign) {
      const pageSlug = normalizeSlug((data.slug as string) || entry.slug);
      const rawTitle = ((data.title as string) || entry.title || '')
        .toLowerCase()
        .trim();
      const match = [...GENERAL_STARTER_PAGES, ...ECOMMERCE_STARTER_PAGES].find(
        (sp) =>
          normalizeSlug(sp.slug) === pageSlug ||
          (pageSlug === '/' &&
            (sp.key === 'home' || sp.key === 'store_home')) ||
          sp.key === (data.slug || entry.slug) ||
          sp.title.toLowerCase().trim() === rawTitle,
      );
      if (match?.body && typeof match.body.html === 'string') {
        layout = { html: match.body.html, css: match.body.css || '' };
      }
    }

    const scope: Rec = flattenEntry(entry, data);
    let defaultSchema: string | undefined;
    let posts: Rec[] = [];
    const ownSchemas: Record<string, Rec[]> = {};

    for (const s of schemasOf(data)) {
      if (s.entryType === 'multi' && Array.isArray(s.items)) {
        const key = s.slug || s.id || '';
        const strippedKey = key.replace(/_posts$/, '');
        const blogId =
          data.isBlogPage === true ? (data.blogTypeId as string) : '';
        const stored: Rec[] = blogId
          ? (postsByBlog[blogId] ??
            (key ? postsByBlog[key] : undefined) ??
            (strippedKey ? postsByBlog[strippedKey] : undefined) ??
            [])
          : ((key ? postsByBlog[key] : undefined) ?? []);
        const storedIds = new Set(stored.map((p: Rec) => p.id));
        const items = [
          ...stored,
          ...s.items.filter((it) => !storedIds.has(it.id as string)),
        ]
          .filter(
            (it) =>
              mode === 'draft' ||
              (it.status !== 'draft' && !isScheduledForLater(it)),
          )
          .map((it, i) => toPost(it, i, entry.id));
        for (const alias of new Set(
          [s.slug, s.id].filter(Boolean) as string[],
        )) {
          ownSchemas[alias] = items;
          (owners[alias] ??= []).push({ pageId: entry.id, items });
        }
        if (key && !schemaKeys.includes(key)) schemaKeys.push(key);
        if (!defaultSchema) {
          defaultSchema = key;
          posts = items;
        }
      }
      if (isObject(s.values)) {
        for (const [k, v] of Object.entries(s.values)) {
          if (scope[k] === undefined) scope[k] = v;
          if (s.slug) scope[`${s.slug}.${k}`] = v;
        }
      }
    }

    const slug = normalizeSlug((data.slug as string) || entry.slug);
    const isContentEntry =
      isObject(body) && body.builder !== 'grapesjs' && data.isBlogPage !== true;
    if (isContentEntry) contentEntries.push(scope);

    pages.push({
      id: entry.id,
      slug,
      title: (data.title as string) || entry.title || 'Untitled',
      status: entry.status || 'draft',
      layout,
      customDesign,
      scope,
      defaultSchema,
      posts,
      ownSchemas,
      seo: isObject(data.seo) ? (data.seo as Rec) : null,
      raw: entry,
    });
  }

  return {
    pages,
    schemaOwners: owners,
    schemaKeys,
    entries: contentEntries,
    menus,
    tags,
    comments,
    sections,
    redirects,
    theme: siteTheme,
  };
}

/** WordPress-style permalinks: a page, or a page plus a post slug. */
export function resolvePath(
  model: SiteModel,
  rawPath: string,
): ResolvedPath | null {
  const path = normalizeSlug(rawPath);
  const bySlug = (slug: string) => model.pages.find((p) => p.slug === slug);

  const exact =
    bySlug(path) ??
    model.pages.find((p) => p.id === rawPath.replace(/^\/+/, ''));
  if (exact) return { page: exact, post: null };

  if (path === '/') {
    const home = bySlug('/home') ?? bySlug('/index') ?? model.pages[0];
    return home ? { page: home, post: null } : null;
  }

  // Tag archive: <page>/tag/<tag-slug>
  const tagMatch = path.match(/^(.*)\/tag\/([^/]+)$/);
  if (tagMatch) {
    const owner = bySlug(tagMatch[1] || '/');
    const tag = model.tags.find((t) => t.slug === tagMatch[2]);
    if (owner && tag)
      return { page: pageForTag(owner, tag.slug), post: null, tag };
  }

  const lastSlash = path.lastIndexOf('/');
  const parentPath = lastSlash <= 0 ? '/' : path.slice(0, lastSlash);
  const postSlug = path.slice(lastSlash + 1);
  const parent = bySlug(parentPath);
  if (parent) {
    const isBlog =
      parent.raw?.data?.isBlogPage === true ||
      parent.raw?.data?.kind === 'blog' ||
      parent.slug.includes('blog') ||
      parent.defaultSchema === 'posts' ||
      parent.defaultSchema === 'blog';
    const isGenericItemSlug = /^item-\d+$/.test(postSlug);
    if (!isGenericItemSlug || isBlog) {
      const post = parent.posts.find(
        (p) => p.slug === postSlug || p.id === postSlug,
      );
      if (post) return { page: parent, post };
    }
  }
  return null;
}

/** The same page, listing only the posts that carry the tag. */
export function pageForTag(page: SitePage, tagSlug: string): SitePage {
  const has = (p: Rec) =>
    Array.isArray(p.tags) && (p.tags as unknown[]).includes(tagSlug);
  const own: Record<string, Rec[]> = {};
  for (const [k, v] of Object.entries(page.ownSchemas)) own[k] = v.filter(has);
  return { ...page, posts: page.posts.filter(has), ownSchemas: own };
}

/** Where an old address now points, if a redirect exists for it. */
export function findRedirect(model: SiteModel, rawPath: string): string | null {
  const path = normalizeSlug(rawPath);
  return model.redirects.find((r) => r.from === path)?.to ?? null;
}

/** Loads every entry of a site (all pages of results, not just the first). */
export async function fetchAllSiteEntries(
  siteSlug: string,
): Promise<PageEntry[]> {
  const pageSize = 100;
  const all: PageEntry[] = [];
  for (let page = 1; page <= 50; page++) {
    const res = await postsApi.listPagesPaged(siteSlug, {
      page,
      pageSize,
      status: 'all',
    });
    all.push(...res.items);
    if (all.length >= res.total || res.items.length < pageSize) break;
  }
  return all;
}

/**
 * The data sources a page's feeds can use. A schema the page owns always wins;
 * otherwise the schema from the (only) page that has it. A name used by
 * several other pages is ambiguous and reported instead of guessed.
 */
export function sourcesForPage(
  model: SiteModel,
  page: SitePage | null,
  item?: Rec | null,
): RenderSources {
  const schemas: Record<string, Rec[]> = {};
  const ambiguous: string[] = [];
  for (const [key, owners] of Object.entries(model.schemaOwners)) {
    const own = page?.ownSchemas[key];
    if (own) {
      schemas[key] = own;
      continue;
    }
    schemas[key] = owners[0]?.items ?? [];
    if (new Set(owners.map((o) => o.pageId)).size > 1) ambiguous.push(key);
  }
  if (page && item) {
    schemas.related = relatedPosts(page, item, 3);
    schemas.comments = model.comments
      .filter((c) => c.postSlug === item.slug)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }
  return {
    schemas,
    entries: model.entries,
    defaultSchema: page?.defaultSchema,
    siteSchemaKeys: model.schemaKeys,
    ambiguousSchemas: ambiguous,
  };
}

/** The posts before and after a post on its page (newest first). */
export function neighborsOf(
  page: SitePage,
  item: Rec,
): { prev: Rec | null; next: Rec | null } {
  const i = page.posts.findIndex((p) => p.id === item.id);
  if (i === -1) return { prev: null, next: null };
  // The list is newest first: "next" is the older post
  return { prev: page.posts[i - 1] ?? null, next: page.posts[i + 1] ?? null };
}

/** Other posts that share a tag with the post, best match first. */
export function relatedPosts(page: SitePage, item: Rec, limit: number): Rec[] {
  const mine = new Set(Array.isArray(item.tags) ? (item.tags as string[]) : []);
  if (mine.size === 0) return [];
  return page.posts
    .filter((p) => p.id !== item.id && Array.isArray(p.tags))
    .map((p) => ({
      p,
      score: (p.tags as string[]).filter((t) => mine.has(t)).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}
