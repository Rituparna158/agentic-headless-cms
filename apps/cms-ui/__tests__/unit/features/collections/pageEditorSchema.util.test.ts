import { describe, it, expect } from 'vitest';
import {
  extractPageCustomSchemas,
  buildSchemaFields,
  buildAvailableSchemas,
  extractSchemaValues,
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
});
