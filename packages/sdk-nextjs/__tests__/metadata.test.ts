import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateMetadataFromEntry, toPlainText } from '../src/index.js';
import { _resetConfig } from '../src/fetch.js';

const ORIGINAL_ENV = process.env;

const BASE_SCHEMA = {
  id: 'schema-1',
  name: 'Post',
  slug: 'posts',
  type: 'collection' as const,
  status: 'published' as const,
  version: 1,
  createdAt: '2026-08-25T12:00:00.000Z',
  updatedAt: '2026-08-25T12:00:00.000Z',
  definition: {
    fields: [
      {
        apiId: 'slug',
        displayName: 'Slug',
        dataType: 'text' as const,
        isRequired: true,
        isUnique: true,
        isLocalized: false,
        isRepeatable: false,
        sortOrder: 1,
      },
      {
        apiId: 'title',
        displayName: 'Title',
        dataType: 'text' as const,
        isRequired: true,
        isUnique: false,
        isLocalized: false,
        isRepeatable: false,
        sortOrder: 2,
      },
      {
        apiId: 'excerpt',
        displayName: 'Excerpt',
        dataType: 'richtext' as const,
        isRequired: false,
        isUnique: false,
        isLocalized: false,
        isRepeatable: false,
        sortOrder: 3,
      },
      {
        apiId: 'coverImage',
        displayName: 'Cover Image',
        dataType: 'media' as const,
        isRequired: false,
        isUnique: false,
        isLocalized: false,
        isRepeatable: false,
        sortOrder: 4,
      },
    ],
  },
};

describe('generateMetadataFromEntry', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env['CMS_API_URL'] = 'http://localhost:3000/api/v1';
    process.env['CMS_API_TOKEN'] = 'test-token';
    _resetConfig();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    _resetConfig();
    vi.unstubAllGlobals();
  });

  it('resolves a media UUID string via getMediaAsset without duplicating /api/v1 in image URL', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/v1/content/posts/entry-1')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'entry-1',
              status: 'published',
              data: {
                slug: 'my-slug',
                title: 'Real Title',
                excerpt: '<p>Real Excerpt</p>',
                coverImage: 'media-uuid-1',
              },
              publishedData: {
                slug: 'my-slug',
                title: 'Real Title',
                excerpt: '<p>Real Excerpt</p>',
                coverImage: 'media-uuid-1',
              },
            },
          }),
        };
      }
      if (url.includes('/api/v1/schemas/slug/posts')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: BASE_SCHEMA }),
        };
      }
      if (url.includes('/api/v1/media/media-uuid-1')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { id: 'media-uuid-1', url: '/uploads/cover.jpg' },
          }),
        };
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const meta = await generateMetadataFromEntry('posts', 'entry-1', {
      titleField: 'title',
      descriptionField: 'excerpt',
    });

    expect(meta).toEqual({
      title: 'Real Title',
      description: 'Real Excerpt',
      openGraph: {
        title: 'Real Title',
        description: 'Real Excerpt',
        images: [{ url: 'http://localhost:3000/uploads/cover.jpg' }],
      },
    });
  });

  it('omits openGraph.images cleanly if media resolution fails', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/v1/media/missing-id')) {
        return {
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => ({}),
        };
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const meta = await generateMetadataFromEntry('posts', 'entry-1', {
      entry: {
        id: 'entry-1',
        status: 'published',
        createdAt: '2026-08-25T12:00:00.000Z',
        updatedAt: '2026-08-25T12:00:00.000Z',
        data: { slug: 'hello', title: 'World', coverImage: 'missing-id' },
        publishedData: {
          slug: 'hello',
          title: 'World',
          coverImage: 'missing-id',
        },
      },
      schema: BASE_SCHEMA,
      titleField: 'title',
    });

    expect(meta.title).toBe('World');
    expect(meta.openGraph?.images).toBeUndefined();
  });

  it('passes draft: true to getContentEntry and resolves draft metadata', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/v1/content/posts/draft-1')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'draft-1',
              status: 'draft',
              data: { slug: 'draft-slug', title: 'Draft Headline' },
              publishedData: null,
            },
          }),
        };
      }
      if (url.includes('/api/v1/schemas/slug/posts')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: BASE_SCHEMA }),
        };
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const meta = await generateMetadataFromEntry('posts', 'draft-1', {
      draft: true,
      titleField: 'title',
    });

    expect(meta.title).toBe('Draft Headline');
  });

  it('exports toPlainText helper from sdk-nextjs', () => {
    expect(typeof toPlainText).toBe('function');
    expect(toPlainText('<p>Summary</p>')).toBe('Summary');
  });
});
