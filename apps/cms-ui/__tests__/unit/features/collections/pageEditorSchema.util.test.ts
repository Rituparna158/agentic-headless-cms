import { describe, it, expect } from 'vitest';
import {
  extractPageCustomSchemas,
  buildSchemaFields,
  buildAvailableSchemas,
  extractSchemaValues,
  buildCollectionAvailableSchemas,
  buildCollectionSchemaFields,
  extractCollectionSchemaValues,
} from '@/features/collections/utils/pageEditorSchema.util';

describe('pageEditorSchema.util', () => {
  it('extractPageCustomSchemas returns empty array for undefined or non-array input', () => {
    expect(extractPageCustomSchemas(undefined)).toEqual([]);
    expect(extractPageCustomSchemas({})).toEqual([]);
    expect(
      extractPageCustomSchemas({ _schemas: 'invalid' as unknown as unknown[] }),
    ).toEqual([]);
  });

  it('extractPageCustomSchemas parses raw schemas and formats fields', () => {
    const raw = {
      _schemas: [
        {
          id: 'schema-1',
          name: 'Hero Banner',
          slug: 'hero-banner',
          fields: [
            {
              apiId: 'hero_title',
              displayName: 'Hero Title',
              name: 'Title',
              dataType: 'text',
            },
            {
              // missing apiId, should be filtered out
              displayName: 'Invalid Field',
            },
          ],
        },
        {
          id: 'minimal-schema',
          fields: [{ apiId: 'field_one' }],
        },
        null,
      ],
    };

    const extracted = extractPageCustomSchemas(raw);
    expect(extracted).toHaveLength(2);
    expect(extracted[0]?.id).toBe('schema-1');
    expect(extracted[0]?.name).toBe('Hero Banner');
    expect(extracted[0]?.slug).toBe('hero-banner');
    expect(extracted[0]?.fields).toEqual([
      {
        apiId: 'hero_title',
        displayName: 'Hero Title',
        name: 'Title',
        dataType: 'text',
      },
    ]);
    expect(extracted[1]?.id).toBe('minimal-schema');
    expect(extracted[1]?.name).toBe('Custom Schema');
    expect(extracted[1]?.slug).toBe('minimal-schema');
    expect(extracted[1]?.fields[0]?.apiId).toBe('field_one');
  });

  it('buildSchemaFields extracts unique fields across all schemas', () => {
    const schemas = [
      {
        id: 's1',
        name: 'Section A',
        slug: 'section-a',
        fields: [
          { apiId: 'heading', displayName: 'Heading', dataType: 'text' },
          { apiId: 'subheading', name: 'Subheading', dataType: 'text' },
        ],
      },
      {
        id: 's2',
        name: 'Section B',
        slug: 'section-b',
        fields: [
          // Duplicate apiId 'heading' should be omitted
          {
            apiId: 'heading',
            displayName: 'Duplicate Heading',
            dataType: 'text',
          },
          { apiId: 'cta_url', displayName: 'CTA URL', dataType: 'text' },
        ],
      },
    ];

    const fields = buildSchemaFields(schemas);
    expect(fields).toHaveLength(3);
    expect(fields.map((f) => f.apiId)).toEqual([
      'heading',
      'subheading',
      'cta_url',
    ]);
    expect(fields[0]?.name).toBe('Section A: Heading');
    expect(fields[1]?.name).toBe('Section A: Subheading');
    expect(fields[2]?.name).toBe('Section B: CTA URL');
  });

  it('buildAvailableSchemas formats schema structure for canvas editor', () => {
    const schemas = [
      {
        id: 's1',
        name: 'Navbar',
        slug: 'navbar',
        fields: [
          { apiId: 'logo_url', displayName: 'Logo Image', dataType: 'image' },
        ],
      },
    ];

    const available = buildAvailableSchemas(schemas);
    expect(available).toEqual([
      {
        id: 's1',
        name: 'Navbar',
        slug: 'navbar',
        fields: [
          {
            id: 'logo_url',
            name: 'Logo Image',
            apiId: 'logo_url',
            dataType: 'image',
          },
        ],
      },
    ]);
  });

  it('extractSchemaValues aggregates values from nested schemas in pageData', () => {
    expect(extractSchemaValues(undefined)).toEqual({});
    expect(extractSchemaValues({})).toEqual({});

    const pageData = {
      _schemas: [
        {
          values: {
            title: 'Welcome to CMS',
            count: 42,
          },
        },
        null,
        {
          values: {
            theme: 'dark',
          },
        },
      ],
    };

    const values = extractSchemaValues(pageData);
    expect(values).toEqual({
      title: 'Welcome to CMS',
      count: 42,
      theme: 'dark',
    });
  });

  describe('Collection-wide schema utilities', () => {
    const mockCollectionPages = [
      {
        id: 'page-1',
        title: 'Blog Post One',
        data: {
          title: 'Blog Post One',
          _schemas: [
            {
              id: 'blog-schema',
              name: 'Blog Post',
              slug: 'blog-post',
              fields: [
                { apiId: 'author', displayName: 'Author', dataType: 'text' },
                {
                  apiId: 'content',
                  displayName: 'Article Content',
                  dataType: 'richtext',
                },
              ],
              values: {
                author: 'Jane Doe',
                content: '<p>Full blog content from page 1</p>',
              },
            },
          ],
        },
      },
      {
        id: 'page-2',
        title: 'About Page',
        data: {
          title: 'About Page',
          _schemas: [
            {
              id: 'about-schema',
              name: 'About Section',
              slug: 'about-section',
              fields: [
                { apiId: 'bio', displayName: 'Biography', dataType: 'text' },
              ],
              values: {
                bio: 'We build headless CMS.',
              },
            },
          ],
        },
      },
    ];

    it('buildCollectionAvailableSchemas includes schemas from both current page and other collection pages', () => {
      const currentPageData = {
        title: 'Overview Page',
        _schemas: [
          {
            id: 'overview-schema',
            name: 'Overview Grid',
            slug: 'overview-grid',
            fields: [
              { apiId: 'headline', displayName: 'Headline', dataType: 'text' },
            ],
          },
        ],
      };

      const schemas = buildCollectionAvailableSchemas(
        currentPageData,
        mockCollectionPages,
        'page-overview',
      );

      expect(schemas).toHaveLength(3);
      // Current page schema
      expect(schemas[0]?.id).toBe('overview-schema');
      expect(schemas[0]?.name).toBe('Overview Grid');
      expect(schemas[0]?.isCurrentPage).toBe(true);
      expect(schemas[0]?.pageTitle).toBe('Overview Page');

      // Other collection pages schemas
      expect(schemas[1]?.name).toBe('Blog Post');
      expect(schemas[1]?.isCurrentPage).toBe(false);
      expect(schemas[1]?.pageTitle).toBe('Blog Post One');
      expect(schemas[1]?.fields[0]?.apiId).toBe('author');

      expect(schemas[2]?.name).toBe('About Section');
      expect(schemas[2]?.isCurrentPage).toBe(false);
      expect(schemas[2]?.pageTitle).toBe('About Page');
    });

    it('buildCollectionAvailableSchemas works when current page has NO schemas at all', () => {
      const emptyCurrentPageData = {
        title: 'Blog Listing',
        _schemas: [],
      };

      const schemas = buildCollectionAvailableSchemas(
        emptyCurrentPageData,
        mockCollectionPages,
        'page-empty',
      );

      // Successfully exposes the other pages' schemas so empty page can use them
      expect(schemas).toHaveLength(2);
      expect(schemas[0]?.name).toBe('Blog Post');
      expect(schemas[0]?.isCurrentPage).toBe(false);
      expect(schemas[0]?.pageTitle).toBe('Blog Post One');
      expect(schemas[1]?.name).toBe('About Section');
    });

    it('buildCollectionSchemaFields displays origin page tag for other pages and clean names for current page', () => {
      const available = [
        {
          id: 's1',
          name: 'Hero',
          slug: 'hero',
          isCurrentPage: true,
          pageTitle: 'Current Page',
          fields: [
            { id: 'title', name: 'Title', apiId: 'title', dataType: 'text' },
          ],
        },
        {
          id: 's2',
          name: 'Blog Post',
          slug: 'blog-post',
          isCurrentPage: false,
          pageTitle: 'First Blog',
          fields: [
            { id: 'author', name: 'Author', apiId: 'author', dataType: 'text' },
          ],
        },
      ];

      const fields = buildCollectionSchemaFields(available);
      expect(fields).toHaveLength(2);
      expect(fields[0]?.name).toBe('Hero: Title');
      expect(fields[1]?.name).toBe('[First Blog] Blog Post: Author');
    });

    it('extractCollectionSchemaValues merges collection values with current page values taking priority', () => {
      const currentPageData = {
        _schemas: [
          {
            slug: 'blog-post',
            values: {
              author: 'Custom Current Author', // overrides Jane Doe from page-1
            },
          },
        ],
      };

      const values = extractCollectionSchemaValues(
        currentPageData,
        mockCollectionPages,
        'current-page',
      );

      // Current page overrides page-1
      expect(values.author).toBe('Custom Current Author');
      // Fallback from page-1 is available
      expect(values.content).toBe('<p>Full blog content from page 1</p>');
      // Fallback from page-2 is available
      expect(values.bio).toBe('We build headless CMS.');
      // Scoped slug access also populated
      expect(values['blog-post.author']).toBe('Custom Current Author');
    });

    it('handles fallback titles and missing IDs in schemas gracefully', () => {
      const available = [
        {
          id: 's-fallback',
          name: 'Fallback Section',
          slug: 'fallback-section',
          isCurrentPage: false,
          pageTitle: '', // falsy
          fields: [{ id: 'f1', name: '', apiId: 'f1', dataType: 'text' }],
        },
      ];

      const fields = buildCollectionSchemaFields(available);
      expect(fields[0]?.name).toBe('[Other Page] Fallback Section: f1');

      const noTitlePages = [
        {
          id: 'p-no-title',
          data: {
            _schemas: [
              {
                name: 'Schema No Id',
                slug: 'no-id-slug',
                fields: [{ apiId: 'f2' }],
              },
            ],
          },
        },
      ];

      const schemas = buildCollectionAvailableSchemas(undefined, noTitlePages);
      expect(schemas[0]?.name).toBe('Schema No Id');
      expect(schemas[0]?.pageTitle).toBe('Other Page');
    });
  });
});
