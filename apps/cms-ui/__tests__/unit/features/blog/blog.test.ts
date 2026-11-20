import { describe, it, expect } from 'vitest';
import { BLOG_TYPES } from '../../../../src/features/blog/constants/blogTypes';
import { toBlogPage } from '../../../../src/features/blog/api/blog.api';
import {
  buildFeaturedPostsSection,
  pagesFeaturing,
} from '../../../../src/features/blog/utils/featureSection';
import { buildBlogPageBody } from '../../../../src/features/blog/utils/blogTemplate';
import { renderTemplate } from '../../../../src/features/render/renderTemplate';
import {
  buildSiteModel,
  sourcesForPage,
} from '../../../../src/features/render/siteModel';
import type { PageEntry } from '../../../../src/types/content.types';

describe('blog presets', () => {
  it('ships several types with unique ids', () => {
    expect(BLOG_TYPES.length).toBeGreaterThanOrEqual(6);
    expect(new Set(BLOG_TYPES.map((t) => t.id)).size).toBe(BLOG_TYPES.length);
  });

  it.each(BLOG_TYPES.map((t) => [t.id, t] as const))(
    '%s has a required title, unique valid field ids, and a mix of required/optional',
    (_id, t) => {
      const ids = t.fields.map((f) => f.apiId);
      expect(new Set(ids).size).toBe(ids.length);
      ids.forEach((id) => expect(id).toMatch(/^[a-z][a-z0-9_]*$/));
      expect(t.fields.find((f) => f.apiId === 'title')?.isRequired).toBe(true);
      expect(t.fields.some((f) => f.isRequired)).toBe(true);
      expect(t.fields.some((f) => !f.isRequired)).toBe(true);
      t.fields
        .filter((f) => f.dataType === 'select')
        .forEach((f) => expect(f.options?.length).toBeGreaterThan(0));
    },
  );
});

const blogPage = (items: Array<Record<string, unknown>>): PageEntry =>
  ({
    id: 'p1',
    slug: '/blog/engineering',
    status: 'published',
    data: {
      isBlogPage: true,
      blogTypeId: 'engineering',
      blogName: 'Engineering',
      _schemas: [
        {
          id: 's',
          name: 'Posts',
          slug: 's',
          entryType: 'multi',
          fields: [],
          values: {},
          items,
        },
      ],
    },
  }) as unknown as PageEntry;

describe('toBlogPage', () => {
  it('ignores normal pages', () => {
    expect(toBlogPage({ id: 'x', data: {} } as PageEntry)).toBeNull();
  });

  it('maps posts, treating items without a status as published', () => {
    const b = toBlogPage(
      blogPage([
        { id: 'a', title: 'A', slug: 'a' },
        { id: 'b', title: 'B', slug: 'b', status: 'draft' },
      ]),
    )!;
    expect(b.typeId).toBe('engineering');
    expect(b.posts.map((p) => p.status)).toEqual(['published', 'draft']);
  });
});

describe('generated blog page', () => {
  const body = buildBlogPageBody('Engineering Blog', 'engineering_posts');
  const model = buildSiteModel(
    [
      {
        id: 'p1',
        slug: '/blog/engineering',
        status: 'published',
        data: {
          title: 'Engineering Blog',
          slug: '/blog/engineering',
          body,
          isBlogPage: true,
          _schemas: [
            {
              slug: 'engineering_posts',
              entryType: 'multi',
              items: [
                {
                  id: 'a',
                  slug: 'live',
                  title: 'Live Post',
                  excerpt: 'Hello',
                  author: 'Ann',
                  date: '2026-11-06',
                  cover_image_url: 'https://x.test/a.jpg',
                  content: '<p>Body</p>',
                  status: 'published',
                },
                {
                  id: 'b',
                  slug: 'secret',
                  title: 'Secret Draft',
                  status: 'draft',
                },
              ],
            },
          ],
        },
      } as unknown as PageEntry,
    ],
    'live',
  );
  const page = model.pages[0]!;
  const hrefs = {
    post: (i: Record<string, unknown>) => `/blog/engineering/${String(i.slug)}`,
    list: '/blog/engineering',
  };
  const sources = sourcesForPage(model, page);

  it('lists only published posts, bound to its own schema, with no warnings', () => {
    const r = renderTemplate(body.html, {
      page: page.scope,
      item: null,
      sources,
      hrefs,
    });
    expect(r.html).toContain('Live Post');
    expect(r.html).not.toContain('Secret Draft');
    expect(r.html).not.toContain('cms-post-reader');
    expect(r.diagnostics.filter((d) => d.level !== 'info')).toEqual([]);
  });

  it('shows the selected post with a link back to the list', () => {
    const post = page.posts[0]!;
    const r = renderTemplate(body.html, {
      page: page.scope,
      item: post,
      sources,
      hrefs,
    });
    expect(r.html).toContain('cms-post-reader');
    expect(r.html).toContain('Live Post');
    expect(r.html).toContain('href="/blog/engineering"');
    expect(r.html).not.toContain('cms-dynamic-feed');
  });
});

describe('featuring a blog on another page', () => {
  const section = buildFeaturedPostsSection({
    schemaSlug: 'engineering_posts',
    title: 'Latest <b>',
    limit: 2,
  });
  const posts = [1, 2, 3].map((n) => ({
    id: `p${n}`,
    slug: `p-${n}`,
    title: `Post ${n}`,
    _pageId: 'blog',
  }));

  it('shows exactly the chosen blog, limited, with links to the blog page', () => {
    const r = renderTemplate(section, {
      page: { title: 'Home' },
      item: null,
      sources: {
        schemas: {
          engineering_posts: posts,
          news_posts: [{ id: 'n', slug: 'n', title: 'Other blog' }],
        },
        entries: [],
        siteSchemaKeys: ['engineering_posts', 'news_posts'],
      },
      hrefs: { post: (i) => `/blog/engineering/${String(i.slug)}`, list: '/' },
    });
    expect(r.html).toContain('Post 1');
    expect(r.html).toContain('Post 2');
    expect(r.html).not.toContain('Post 3');
    expect(r.html).not.toContain('Other blog');
    expect(r.html).toContain('data-entry-href="/blog/engineering/p-1"');
    expect(r.html).toContain('Latest &lt;b&gt;'); // heading is escaped
  });

  it('detects pages that already feature a blog', () => {
    const pages = [
      { id: 'home', data: { body: { html: section } } },
      { id: 'blog', data: { body: { html: section } } },
      { id: 'about', data: { body: { html: '<p>hi</p>' } } },
    ] as unknown as PageEntry[];
    expect(
      pagesFeaturing(pages, 'engineering_posts', 'blog').map((p) => p.id),
    ).toEqual(['home']);
  });
});

describe('posts stored as their own entries', () => {
  it('feeds a blog page from post entries and respects Live mode', async () => {
    const { buildSiteModel } =
      await import('../../../../src/features/render/siteModel');
    const { toBlogPages } =
      await import('../../../../src/features/blog/api/blog.api');
    const blogPage = {
      id: 'b',
      slug: '/blog/engineering',
      status: 'published',
      data: {
        title: 'Engineering Blog',
        slug: '/blog/engineering',
        isBlogPage: true,
        blogTypeId: 'engineering',
        body: { builder: 'grapesjs', html: '<p>x</p>', css: '' },
        _schemas: [
          {
            slug: 'engineering_posts',
            entryType: 'multi',
            fields: [],
            items: [],
          },
        ],
      },
    };
    const post = (id: string, status: string, extra = {}) => ({
      id,
      slug: id,
      status,
      data: {
        kind: 'post',
        blogTypeId: 'engineering',
        title: id,
        slug: id,
        ...extra,
      },
    });
    const entries = [
      blogPage,
      post('one', 'published'),
      post('two', 'draft'),
    ] as never[];
    const draft = buildSiteModel(entries, 'draft');
    expect(draft.pages.map((p) => p.id)).toEqual(['b']);
    expect(draft.pages[0]!.posts.map((p) => p.slug).sort()).toEqual([
      'one',
      'two',
    ]);
    const live = buildSiteModel(entries, 'live');
    expect(live.pages[0]!.posts.map((p) => p.slug)).toEqual(['one']);
    const blogs = toBlogPages(entries);
    expect(blogs[0]!.posts).toHaveLength(2);
    expect(blogs[0]!.posts.every((p) => !p.legacy)).toBe(true);
  });

  it('marks posts still inside the page as legacy', async () => {
    const { toBlogPages } =
      await import('../../../../src/features/blog/api/blog.api');
    const page = {
      id: 'b',
      slug: '/blog',
      status: 'published',
      data: {
        title: 'B',
        isBlogPage: true,
        blogTypeId: 'engineering',
        _schemas: [
          {
            slug: 'engineering_posts',
            entryType: 'multi',
            fields: [],
            items: [{ id: 'x', title: 'Old' }],
          },
        ],
      },
    } as never;
    expect(toBlogPages([page])[0]!.posts[0]!.legacy).toBe(true);
  });
});
