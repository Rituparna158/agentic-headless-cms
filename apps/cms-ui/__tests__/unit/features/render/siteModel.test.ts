import { describe, it, expect } from 'vitest';
import {
  buildSiteModel,
  resolvePath,
  normalizeSlug,
  sourcesForPage,
} from '../../../../src/features/render/siteModel';
import type { PageEntry } from '../../../../src/types/content.types';

const layout = { builder: 'grapesjs', html: '<h1>{{title}}</h1>', css: '' };

const blog = (over: Record<string, unknown> = {}): PageEntry =>
  ({
    id: 'blog',
    slug: '/blog',
    status: 'published',
    data: {
      title: 'Blog',
      slug: '/blog',
      body: layout,
      _schemas: [
        {
          slug: 'posts',
          entryType: 'multi',
          items: [
            { id: 'a', slug: 'live-post', title: 'Live', status: 'published' },
            { id: 'b', slug: 'secret', title: 'Secret', status: 'draft' },
            { id: 'c', slug: 'legacy', title: 'Legacy' },
          ],
        },
      ],
      ...over,
    },
  }) as unknown as PageEntry;

const home = (status = 'published'): PageEntry =>
  ({
    id: 'home',
    slug: '/',
    status,
    data: { title: 'Home', slug: '/', body: layout },
  }) as unknown as PageEntry;

describe('normalizeSlug', () => {
  it('adds a leading slash and strips trailing ones', () => {
    expect(normalizeSlug('about/')).toBe('/about');
    expect(normalizeSlug('')).toBe('/');
    expect(normalizeSlug('/')).toBe('/');
  });
});

describe('Live vs Draft', () => {
  it('draft mode includes unpublished pages and draft posts', () => {
    const m = buildSiteModel([home('draft'), blog()], 'draft');
    expect(m.pages.map((p) => p.id)).toEqual(['home', 'blog']);
    expect(m.schemaOwners.posts![0]!.items.map((p) => p.slug)).toContain(
      'secret',
    );
  });

  it('live mode hides unpublished pages and draft posts', () => {
    const m = buildSiteModel([home('draft'), blog()], 'live');
    expect(m.pages.map((p) => p.id)).toEqual(['blog']);
    const slugs = m.schemaOwners.posts![0]!.items.map((p) => p.slug);
    expect(slugs).toEqual(['live-post', 'legacy']); // posts without a status count as live
  });

  it('live mode renders the published snapshot, not later edits', () => {
    const entry = blog({ title: 'Edited title' });
    (entry as unknown as Record<string, unknown>).publishedData = {
      title: 'Published title',
      slug: '/blog',
      body: layout,
    };
    expect(buildSiteModel([entry], 'live').pages[0]!.title).toBe(
      'Published title',
    );
    expect(buildSiteModel([entry], 'draft').pages[0]!.title).toBe(
      'Edited title',
    );
  });
});

describe('resolvePath', () => {
  const model = buildSiteModel([home(), blog()], 'draft');

  it('finds pages by slug and the home page for "/"', () => {
    expect(resolvePath(model, '/blog')?.page.id).toBe('blog');
    expect(resolvePath(model, '/')?.page.id).toBe('home');
  });

  it('finds a page by id (older links)', () => {
    expect(resolvePath(model, 'blog')?.page.id).toBe('blog');
  });

  it('resolves /page/post-slug to the page and that post', () => {
    const r = resolvePath(model, '/blog/live-post');
    expect(r?.page.id).toBe('blog');
    expect(r?.post?.title).toBe('Live');
  });

  it('returns null for unknown addresses', () => {
    expect(resolvePath(model, '/nope')).toBeNull();
    expect(resolvePath(model, '/blog/unknown-post')).toBeNull();
  });
});

describe('which blog a page can use', () => {
  const second = (): PageEntry =>
    ({
      id: 'news',
      slug: '/news',
      status: 'published',
      data: {
        title: 'News',
        slug: '/news',
        body: layout,
        _schemas: [
          {
            slug: 'news_posts',
            entryType: 'multi',
            items: [{ id: 'n1', slug: 'n-one', title: 'News One' }],
          },
        ],
      },
    }) as unknown as PageEntry;

  it('a page prefers the blog it owns', () => {
    const m = buildSiteModel([home(), blog(), second()], 'draft');
    const s = sourcesForPage(m, m.pages.find((p) => p.id === 'blog')!);
    expect(s.defaultSchema).toBe('posts');
    expect(s.schemas.posts!.map((p) => p.slug)).toContain('live-post');
  });

  it('a page without a blog can still reach another blog by name', () => {
    const m = buildSiteModel([home(), blog(), second()], 'draft');
    const s = sourcesForPage(m, m.pages.find((p) => p.id === 'home')!);
    expect(s.defaultSchema).toBeUndefined();
    expect(s.schemas.news_posts!.map((p) => p.slug)).toEqual(['n-one']);
    expect(s.siteSchemaKeys).toEqual(['posts', 'news_posts']);
  });

  it('flags a schema name that exists on several other pages', () => {
    const dup = {
      ...second(),
      id: 'dup',
      data: {
        ...(second().data as object),
        slug: '/dup',
        _schemas: [
          {
            slug: 'posts',
            entryType: 'multi',
            items: [{ id: 'z', slug: 'z', title: 'Z' }],
          },
        ],
      },
    } as unknown as PageEntry;
    const m = buildSiteModel([home(), blog(), dup], 'draft');
    expect(
      sourcesForPage(m, m.pages.find((p) => p.id === 'home')!).ambiguousSchemas,
    ).toEqual(['posts']);
    // the owner of its own copy is not ambiguous
    expect(
      sourcesForPage(m, m.pages.find((p) => p.id === 'blog')!).ambiguousSchemas,
    ).toEqual([]);
  });

  it('tags each post with the page that owns it', () => {
    const m = buildSiteModel([blog()], 'draft');
    expect(m.pages[0]!.posts[0]!._pageId).toBe('blog');
  });
});
