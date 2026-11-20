import { describe, it, expect, vi, beforeEach } from 'vitest';

const ca = vi.hoisted(() => ({
  createPage: vi.fn(),
  publishPage: vi.fn(),
  getPage: vi.fn(),
  updatePage: vi.fn(),
  deletePage: vi.fn(),
}));
vi.mock('@/features/collections/api/collections.api', () => ({
  collectionsApi: ca,
}));

import {
  blogApi,
  toBlogPage,
  toBlogPages,
  isBlogPageEntry,
  slugifyPost,
} from '../../../../src/features/blog/api/blog.api';

const schema = (items: unknown[] = []) => ({
  id: 'news_posts',
  name: 'News posts',
  slug: 'news_posts',
  entryType: 'multi',
  fields: [{ apiId: 'title' }],
  items,
});
const blogPage = (over: Record<string, unknown> = {}, items: unknown[] = []) =>
  ({
    id: 'page1',
    slug: '/blog/news',
    status: 'published',
    data: {
      isBlogPage: true,
      blogTypeId: 'news',
      blogName: 'News',
      blogPostLabel: 'Story',
      _schemas: [schema(items)],
      ...over,
    },
  }) as never;

describe('blog helpers', () => {
  it('slugifyPost', () => {
    expect(slugifyPost('  Hello, World! ')).toBe('hello-world');
  });

  it('isBlogPageEntry', () => {
    expect(isBlogPageEntry(blogPage())).toBe(true);
    expect(isBlogPageEntry({ data: {} } as never)).toBe(false);
  });

  it('toBlogPage returns null for non-blog pages or pages without a schema', () => {
    expect(toBlogPage({ id: 'x', data: {} } as never)).toBeNull();
    expect(toBlogPage(blogPage({ _schemas: [] }))).toBeNull();
  });

  it('toBlogPage merges stored posts with legacy in-page posts, newest first', () => {
    const entries = [
      {
        id: 'p1',
        status: 'published',
        createdAt: '2026-01-02',
        data: {
          kind: 'post',
          blogTypeId: 'news',
          title: 'Stored',
          slug: 'stored',
        },
      },
      { id: 'other', data: { kind: 'post', blogTypeId: 'other' } },
    ] as never[];
    const page = blogPage({}, [
      { id: 'old1', title: 'Old', date: '2025-01-01' },
      { title: 'NoId', status: 'draft', date: '2024-01-01' },
      { id: 'p1', title: 'Dup' },
    ]);
    const blog = toBlogPage(page, entries)!;
    expect(blog).toMatchObject({
      pageId: 'page1',
      typeId: 'news',
      name: 'News',
      postLabel: 'Story',
      pageSlug: '/blog/news',
    });
    expect(blog.posts.map((p) => p.id)).toEqual(['p1', 'old1', 'post_2']);
    expect(blog.posts[1]).toMatchObject({ legacy: true, status: 'published' });
    expect(blog.posts[2]).toMatchObject({
      legacy: true,
      status: 'draft',
      slug: 'post-2',
    });
  });

  it('toBlogPage uses fallbacks for missing metadata', () => {
    const page = blogPage({
      blogName: undefined,
      blogPostLabel: undefined,
      blogTypeId: undefined,
    });
    const blog = toBlogPage(page)!;
    expect(blog).toMatchObject({
      name: 'News posts',
      postLabel: 'Post',
      typeId: 'news_posts',
    });
  });

  it('toBlogPages filters to blog pages', () => {
    expect(
      toBlogPages([blogPage(), { id: 'x', data: {} } as never]),
    ).toHaveLength(1);
  });
});

describe('blogApi', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('createBlogType creates and publishes the page', async () => {
    ca.createPage.mockResolvedValue({ id: 'new' });
    ca.publishPage.mockResolvedValue({});
    const res = await blogApi.createBlogType(
      'site',
      { id: 'news', name: 'News', postLabel: 'Story', fields: [] },
      '/blog',
    );
    expect(res).toEqual({ id: 'new' });
    expect(ca.createPage.mock.calls[0]![1]).toMatchObject({
      slug: '/blog/news',
      isBlogPage: true,
      blogTypeId: 'news',
    });
    expect(ca.publishPage).toHaveBeenCalledWith('site', 'new');
  });

  it('createBlogType keeps the draft when publishing fails', async () => {
    ca.createPage.mockResolvedValue({ id: 'new' });
    ca.publishPage.mockRejectedValue(new Error('x'));
    await expect(
      blogApi.createBlogType(
        'site',
        { id: 'n', name: 'N', postLabel: 'P', fields: [] },
        '/b',
      ),
    ).resolves.toEqual({ id: 'new' });
  });

  describe('savePost', () => {
    const post = {
      id: 'p1',
      title: 'T',
      slug: 't',
      cover_image_url: 'img',
      status: 'draft',
    } as never;

    it('throws when the blog has no post schema', async () => {
      ca.getPage.mockResolvedValue(blogPage({ _schemas: [] }));
      await expect(
        blogApi.savePost('s', 'page1', post, { publish: false }),
      ).rejects.toThrow(/no post schema/);
    });

    it('creates a new post entry and publishes it', async () => {
      ca.getPage.mockResolvedValue(blogPage());
      ca.createPage.mockResolvedValue({ id: 'e1', status: 'draft' });
      ca.publishPage.mockResolvedValue({ id: 'e1', status: 'published' });
      const res = await blogApi.savePost('s', 'page1', post, {
        publish: true,
        isNew: true,
      });
      expect(ca.createPage.mock.calls[0]![1]).toMatchObject({
        kind: 'post',
        blogTypeId: 'news',
        image: 'img',
      });
      expect(res).toMatchObject({
        id: 'e1',
        status: 'published',
        legacy: false,
      });
    });

    it('updates an existing post', async () => {
      ca.getPage.mockResolvedValue(blogPage());
      ca.updatePage.mockResolvedValue({
        id: 'p1',
        status: 'draft',
        createdAt: 'c',
      });
      const res = await blogApi.savePost('s', 'page1', post, {
        publish: false,
      });
      expect(ca.updatePage).toHaveBeenCalledWith(
        's',
        'p1',
        expect.objectContaining({ kind: 'post' }),
      );
      expect(res).toMatchObject({ id: 'p1', status: 'draft', createdAt: 'c' });
    });

    it('migrates a legacy post: creates the entry, strips the old copy, republishes', async () => {
      ca.getPage.mockResolvedValue(
        blogPage({}, [{ id: 'old' }, { id: 'keep' }]),
      );
      ca.createPage.mockResolvedValue({ id: 'e2', status: 'draft' });
      ca.updatePage.mockResolvedValue({});
      ca.publishPage.mockResolvedValue({});
      await blogApi.savePost(
        's',
        'page1',
        { ...(post as object), id: 'old', legacy: true } as never,
        {
          publish: false,
        },
      );
      const written = ca.updatePage.mock.calls[0]![2];
      expect(written._schemas[0].items).toEqual([{ id: 'keep' }]);
      expect(ca.publishPage).toHaveBeenCalledWith('s', 'page1');
    });

    it('does not republish a draft blog page after migrating', async () => {
      ca.getPage.mockResolvedValue(blogPage({}, [{ id: 'old' }]));
      (await ca.getPage()).status = 'draft';
      ca.createPage.mockResolvedValue({ id: 'e2' });
      ca.updatePage.mockResolvedValue({});
      await blogApi.savePost(
        's',
        'page1',
        { ...(post as object), id: 'old', legacy: true } as never,
        {
          publish: false,
        },
      );
      expect(ca.publishPage).not.toHaveBeenCalled();
    });
  });

  it('migratePosts saves only legacy posts', async () => {
    ca.getPage.mockResolvedValue(blogPage());
    ca.createPage.mockResolvedValue({ id: 'e', status: 'published' });
    ca.updatePage.mockResolvedValue({});
    ca.publishPage.mockResolvedValue({ id: 'e', status: 'published' });
    const blog = {
      pageId: 'page1',
      posts: [
        { id: 'a', legacy: true, status: 'published', title: 'A', slug: 'a' },
        { id: 'b', title: 'B', slug: 'b' },
      ],
    } as never;
    expect(await blogApi.migratePosts('s', blog)).toBe(1);
  });

  describe('featureOnPage', () => {
    const opts = { schemaSlug: 'news_posts', title: 'Latest', limit: 3 };

    it('refuses legacy array bodies', async () => {
      ca.getPage.mockResolvedValue({
        id: 'p',
        data: { body: [{ type: 'x' }] },
      });
      await expect(blogApi.featureOnPage('s', 'p', opts)).rejects.toThrow(
        /older layout builder/,
      );
    });

    it('appends the section to the existing grapesjs body', async () => {
      ca.getPage.mockResolvedValue({
        id: 'p',
        title: 'Home',
        slug: '/',
        data: { body: { html: '<p>hi</p>', css: 'p{}' } },
      });
      ca.updatePage.mockResolvedValue({});
      await blogApi.featureOnPage('s', 'p', opts);
      const body = ca.updatePage.mock.calls[0]![2].body;
      expect(body.builder).toBe('grapesjs');
      expect(body.html.startsWith('<p>hi</p>')).toBe(true);
      expect(body.html.length).toBeGreaterThan('<p>hi</p>'.length);
      expect(body.css).toBe('p{}');
    });

    it('creates a body from scratch', async () => {
      ca.getPage.mockResolvedValue({ id: 'p', data: {} });
      ca.updatePage.mockResolvedValue({});
      await blogApi.featureOnPage('s', 'p', opts);
      expect(ca.updatePage.mock.calls[0]![2]).toMatchObject({
        title: 'Page',
        slug: '/',
      });
    });
  });

  describe('deletePost', () => {
    it('deletes a stored post entry', async () => {
      ca.deletePage.mockResolvedValue({});
      await blogApi.deletePost('s', 'page1', { id: 'p1' } as never);
      expect(ca.deletePage).toHaveBeenCalledWith('s', 'p1');
    });

    it('removes a legacy post from the blog page and republishes', async () => {
      ca.getPage.mockResolvedValue(
        blogPage({}, [{ id: 'old' }, { id: 'keep' }]),
      );
      ca.updatePage.mockResolvedValue({});
      ca.publishPage.mockResolvedValue({});
      await blogApi.deletePost('s', 'page1', {
        id: 'old',
        legacy: true,
      } as never);
      expect(ca.updatePage.mock.calls[0]![2]._schemas[0].items).toEqual([
        { id: 'keep' },
      ]);
      expect(ca.publishPage).toHaveBeenCalledWith('s', 'page1');
    });
  });
});
