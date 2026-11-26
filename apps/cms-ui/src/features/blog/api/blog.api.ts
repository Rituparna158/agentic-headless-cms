import { collectionsApi } from '@/features/collections/api/collections.api';
import type { PageCustomSchema, PageEntry } from '@/types/content.types';
import { buildBlogPageBody } from '../utils/blogTemplate';
import { buildFeaturedPostsSection } from '../utils/featureSection';
import type {
  BlogTypeDefinition,
  BlogShowcaseLayout,
} from '../constants/blogTypes';
import type { BlogPostStatus, BlogPost, BlogPage } from '../types/blog.types';

export type { BlogPostStatus, BlogPost, BlogPage, BlogShowcaseLayout };

const getSchemas = (page: PageEntry): PageCustomSchema[] =>
  (Array.isArray(page.data?._schemas)
    ? (page.data!._schemas as PageCustomSchema[])
    : []) ?? [];

const getBlogSchema = (page: PageEntry): PageCustomSchema | undefined =>
  getSchemas(page).find((s) => s.entryType === 'multi');

export const isBlogPageEntry = (page: PageEntry): boolean =>
  page.data?.isBlogPage === true;

/** Blog posts are entries of kind "post"; older ones sit inside the blog page. */
const postsOfBlog = (
  typeId: string,
  schema: PageCustomSchema,
  entries: PageEntry[],
): BlogPost[] => {
  const isObject = (v: unknown): v is Record<string, unknown> =>
    v !== null && typeof v === 'object' && !Array.isArray(v);

  const stored: BlogPost[] = entries
    .filter((e) => {
      const d = (e.data || e.publishedData) as
        | Record<string, unknown>
        | undefined;
      const pd =
        d && isObject(d.data) ? (d.data as Record<string, unknown>) : d;
      return pd?.kind === 'post' && pd?.blogTypeId === typeId;
    })
    .map((e) => {
      const rawData = (e.data || e.publishedData) as
        | Record<string, unknown>
        | undefined;
      const d =
        (rawData && isObject(rawData.data) ? rawData.data : rawData) || {};
      const rawImg =
        d.cover_image_url ??
        d.image ??
        d.coverImage ??
        d.cover_image ??
        d.thumbnail ??
        '';
      const imgUrl =
        typeof rawImg === 'string'
          ? rawImg
          : rawImg && typeof rawImg === 'object'
            ? (((rawImg as Record<string, unknown>).url ||
                (rawImg as Record<string, unknown>).path ||
                (rawImg as Record<string, unknown>).src ||
                '') as string)
            : '';
      return {
        ...d,
        id: e.id,
        slug: (d.slug as string) || e.slug || e.id,
        title: (d.title as string) || e.title || 'Untitled',
        image: imgUrl || (d.image as string) || '',
        cover_image_url: imgUrl || (d.cover_image_url as string) || '',
        status: (e.status === 'published'
          ? 'published'
          : 'draft') as BlogPostStatus,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      };
    });
  const ids = new Set(stored.map((p) => p.id));
  const legacy: BlogPost[] = (schema.items ?? [])
    .map((raw, i) => {
      const item = raw as Record<string, unknown>;
      const rawImg =
        item.cover_image_url ??
        item.image ??
        item.coverImage ??
        item.cover_image ??
        item.thumbnail ??
        '';
      const imgUrl =
        typeof rawImg === 'string'
          ? rawImg
          : rawImg && typeof rawImg === 'object'
            ? (((rawImg as Record<string, unknown>).url ||
                (rawImg as Record<string, unknown>).path ||
                (rawImg as Record<string, unknown>).src ||
                '') as string)
            : '';
      return {
        ...item,
        id: (item.id as string) || `post_${i + 1}`,
        slug: (item.slug as string) || `post-${i + 1}`,
        title: (item.title as string) || 'Untitled',
        image: imgUrl || (item.image as string) || '',
        cover_image_url: imgUrl || (item.cover_image_url as string) || '',
        status: (item.status === 'draft'
          ? 'draft'
          : 'published') as BlogPostStatus,
        legacy: true,
      };
    })
    .filter((p) => !ids.has(p.id)) as BlogPost[];
  const when = (p: BlogPost) =>
    String(p.date || p.updatedAt || p.createdAt || '');
  return [...stored, ...legacy].sort((a, b) => when(b).localeCompare(when(a)));
};

export const toBlogPage = (
  page: PageEntry,
  entries: PageEntry[] = [],
): BlogPage | null => {
  if (!isBlogPageEntry(page)) return null;
  const schema = getBlogSchema(page);
  if (!schema) return null;
  const typeId = (page.data?.blogTypeId as string) || schema.slug;
  return {
    pageId: page.id,
    typeId,
    name: (page.data?.blogName as string) || schema.name,
    postLabel: (page.data?.blogPostLabel as string) || 'Post',
    pageSlug: page.slug || '',
    pageStatus: page.status || 'draft',
    fields: schema.fields ?? [],
    posts: postsOfBlog(typeId, schema, entries),
    page,
  };
};

export const toBlogPages = (entries: PageEntry[]): BlogPage[] =>
  entries
    .map((p) => toBlogPage(p, entries))
    .filter((b): b is BlogPage => b !== null);

export const slugifyPost = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const pageWriteData = (page: PageEntry, schemas: PageCustomSchema[]) => ({
  ...(page.data ?? {}),
  title: page.title || (page.data?.title as string) || 'Blog',
  slug: page.slug || (page.data?.slug as string) || '/blog',
  _schemas: schemas,
});

export const blogApi = {
  /** Creates (and publishes) the pre-wired blog page for a blog type. */
  createBlogType: async (
    siteSlug: string,
    def: Pick<BlogTypeDefinition, 'id' | 'name' | 'postLabel' | 'fields'>,
    urlPrefix: string,
    layout: BlogShowcaseLayout = 'grid',
  ): Promise<PageEntry> => {
    const slug = `${urlPrefix}/${def.id}`;
    const schema: PageCustomSchema = {
      id: `${def.id}_posts`,
      name: `${def.name} posts`,
      slug: `${def.id}_posts`,
      entryType: 'multi',
      fields: def.fields,
      values: {},
      items: [],
    };
    const created = await collectionsApi.createPage(siteSlug, {
      title: `${def.name} Blog`,
      slug,
      description: `${def.name} blog posts`,
      isBlogPage: true,
      blogTypeId: def.id,
      blogName: def.name,
      blogPostLabel: def.postLabel,
      blogLayout: layout,
      body: buildBlogPageBody(`${def.name} Blog`, schema.slug, layout),
      _schemas: [schema],
    });
    try {
      await collectionsApi.publishPage(siteSlug, created.id);
    } catch {
      // The page stays a draft; it is published with the first post.
    }
    return created;
  },

  /** Updates the showcase layout of an existing blog page. */
  updateBlogLayout: async (
    siteSlug: string,
    pageId: string,
    layout: BlogShowcaseLayout,
  ): Promise<PageEntry> => {
    const page = (await collectionsApi.getPage(
      siteSlug,
      pageId,
    )) as unknown as PageEntry;
    const schema = getBlogSchema(page);
    if (!schema) throw new Error('This blog type has no post schema.');
    const blogName =
      (page.data?.blogName as string) || schema.name || page.title || 'Blog';
    const newBody = buildBlogPageBody(blogName, schema.slug, layout);
    const updated = await collectionsApi.updatePage(siteSlug, pageId, {
      ...(page.data ?? {}),
      title: page.title || (page.data?.title as string) || 'Blog',
      slug: page.slug || (page.data?.slug as string) || '/blog',
      blogLayout: layout,
      body: newBody,
    });
    if (page.status === 'published') {
      await collectionsApi.publishPage(siteSlug, pageId);
    }
    return updated;
  },

  /** Creates or updates a post as its own entry. */
  savePost: async (
    siteSlug: string,
    pageId: string,
    post: BlogPost,
    options: { publish: boolean; isNew?: boolean },
  ): Promise<BlogPost> => {
    const page = await collectionsApi.getPage(siteSlug, pageId);
    const schema = getBlogSchema(page);
    if (!schema) throw new Error('This blog type has no post schema.');
    const blogTypeId = (page.data?.blogTypeId as string) || schema.slug;
    const now = new Date().toISOString();

    const {
      id: _id,
      legacy,
      status: _status,
      createdAt: _c,
      updatedAt: _u,
      ...fields
    } = post;
    void _id;
    void _status;
    void _c;
    void _u;

    const rawImg =
      post.cover_image_url ??
      (post as Record<string, unknown>).image ??
      (fields as Record<string, unknown>).cover_image_url ??
      (fields as Record<string, unknown>).image ??
      (fields as Record<string, unknown>).coverImage ??
      (fields as Record<string, unknown>).cover_image ??
      (fields as Record<string, unknown>).thumbnail ??
      '';
    const imgUrl =
      typeof rawImg === 'string'
        ? rawImg
        : rawImg && typeof rawImg === 'object'
          ? (((rawImg as Record<string, unknown>).url ||
              (rawImg as Record<string, unknown>).path ||
              (rawImg as Record<string, unknown>).src ||
              '') as string)
          : '';

    const data = {
      ...fields,
      kind: 'post',
      blogTypeId,
      title: post.title,
      slug: post.slug,
      image: imgUrl,
      cover_image_url: imgUrl,
    };

    let entry: PageEntry;
    if (options.isNew || legacy) {
      entry = await collectionsApi.createPage(siteSlug, data);
      if (legacy) {
        // The old copy inside the blog page is replaced by the new entry
        const schemas = getSchemas(page).map((s) =>
          s.entryType === 'multi'
            ? { ...s, items: (s.items ?? []).filter((i) => i.id !== post.id) }
            : s,
        );
        await collectionsApi.updatePage(
          siteSlug,
          pageId,
          pageWriteData(page, schemas),
        );
        if (page.status === 'published') {
          await collectionsApi.publishPage(siteSlug, pageId);
        }
      }
    } else {
      entry = await collectionsApi.updatePage(siteSlug, post.id, data);
    }
    if (options.publish) {
      entry = await collectionsApi.publishPage(siteSlug, entry.id);
    }
    return {
      ...post,
      id: entry.id,
      legacy: false,
      status: entry.status === 'published' ? 'published' : 'draft',
      createdAt: entry.createdAt ?? now,
      updatedAt: entry.updatedAt ?? now,
    };
  },

  /** Moves every old in-page post of a blog into its own entry. */
  migratePosts: async (siteSlug: string, blog: BlogPage): Promise<number> => {
    const legacy = blog.posts.filter((p) => p.legacy);
    for (const post of legacy) {
      await blogApi.savePost(siteSlug, blog.pageId, post, {
        publish: post.status === 'published',
      });
    }
    return legacy.length;
  },

  /**
   * Adds a "latest posts" section for a blog to another page's layout.
   * Saved as a draft: the page owner publishes it when ready.
   */
  featureOnPage: async (
    siteSlug: string,
    pageId: string,
    opts: { schemaSlug: string; title: string; limit: number },
  ): Promise<void> => {
    const page = (await collectionsApi.getPage(
      siteSlug,
      pageId,
    )) as unknown as PageEntry;
    const body = page.data?.body;
    if (Array.isArray(body) && body.length > 0) {
      throw new Error(
        'This page uses the older layout builder and cannot show a blog section.',
      );
    }
    const current =
      body && typeof body === 'object'
        ? (body as { html?: string; css?: string })
        : {};
    const section = buildFeaturedPostsSection(opts);
    await collectionsApi.updatePage(siteSlug, pageId, {
      ...(page.data ?? {}),
      title: page.title || (page.data?.title as string) || 'Page',
      slug: page.slug || (page.data?.slug as string) || '/',
      body: {
        builder: 'grapesjs',
        html: `${current.html ?? ''}${section}`,
        css: current.css ?? '',
      },
    });
  },

  deletePost: async (
    siteSlug: string,
    pageId: string,
    post: BlogPost,
  ): Promise<void> => {
    if (!post.legacy) {
      await collectionsApi.deletePage(siteSlug, post.id);
      return;
    }
    const page = await collectionsApi.getPage(siteSlug, pageId);
    const schemas = getSchemas(page).map((s) =>
      s.entryType === 'multi'
        ? { ...s, items: (s.items ?? []).filter((i) => i.id !== post.id) }
        : s,
    );
    await collectionsApi.updatePage(
      siteSlug,
      pageId,
      pageWriteData(page, schemas),
    );
    if (page.status === 'published') {
      await collectionsApi.publishPage(siteSlug, pageId);
    }
  },
};
