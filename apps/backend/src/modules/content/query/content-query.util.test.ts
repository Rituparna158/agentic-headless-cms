import { describe, it, expect } from 'vitest';
import { parseContentQuery } from './content-query.util.js';
import type { SchemaField } from '@repo/shared-types';

describe('parseContentQuery', () => {
  const mockFields: SchemaField[] = [
    {
      apiId: 'title',
      displayName: 'Title',
      dataType: 'text',
      isRequired: true,
      isUnique: false,
      isLocalized: false,
      isRepeatable: false,
      sortOrder: 1,
    },
    {
      apiId: 'views',
      displayName: 'Views',
      dataType: 'number',
      isRequired: false,
      isUnique: false,
      isLocalized: false,
      isRepeatable: false,
      sortOrder: 2,
    },
  ];

  it('should parse search parameter correctly', () => {
    const query = { search: 'hello' };
    const result = parseContentQuery(query, mockFields);
    expect(result.search).toBe('hello');
    expect(result.where).toBeDefined();
    expect(result.orderBy.length).toBe(1);
  });

  it('should combine search with filters correctly', () => {
    const query = {
      search: 'hello',
      filters: { title: { $eq: 'world' } },
    };
    const result = parseContentQuery(query, mockFields);
    expect(result.search).toBe('hello');
    expect(result.where).toBeDefined();
  });
});
