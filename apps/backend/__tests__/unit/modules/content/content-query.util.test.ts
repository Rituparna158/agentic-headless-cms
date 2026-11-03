import { describe, it, expect } from 'vitest';
import { parseContentQuery } from '../../../../src/modules/content/query/content-query.util.js';
import type { SchemaField } from '@repo/types';

const fields: SchemaField[] = [
  {
    apiId: 'title',
    displayName: 'Title',
    dataType: 'text',
    isRequired: true,
    isUnique: false,
    isLocalized: false,
    isRepeatable: false,
    sortOrder: 0,
  },
  {
    apiId: 'views',
    displayName: 'Views',
    dataType: 'number',
    isRequired: false,
    isUnique: false,
    isLocalized: false,
    isRepeatable: false,
    sortOrder: 1,
  },
  {
    apiId: 'authorRef',
    displayName: 'Author',
    dataType: 'relation',
    isRequired: false,
    isUnique: false,
    isLocalized: false,
    isRepeatable: false,
    sortOrder: 2,
  },
];

describe('parseContentQuery', () => {
  it('returns sensible defaults with no query params', () => {
    const result = parseContentQuery({}, fields);
    expect(result.where).toBeUndefined();
    expect(result.orderBy).toEqual([]);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(25);
    expect(result.limit).toBe(25);
    expect(result.offset).toBe(0);
  });

  it('builds a where clause for a valid $eq filter', () => {
    const result = parseContentQuery(
      { filters: { title: { $eq: 'Hello' } } },
      fields,
    );
    expect(result.where).toBeDefined();
  });

  it('allows filtering on status base column with $eq (published or draft)', () => {
    const publishedResult = parseContentQuery(
      { filters: { status: { $eq: 'published' } } },
      fields,
    );
    expect(publishedResult.where).toBeDefined();

    const draftResult = parseContentQuery(
      { filters: { status: { $eq: 'draft' } } },
      fields,
    );
    expect(draftResult.where).toBeDefined();
  });

  it('allows filtering on status base column with $in', () => {
    const result = parseContentQuery(
      { filters: { status: { $in: 'published,draft' } } },
      fields,
    );
    expect(result.where).toBeDefined();
  });

  it('rejects unsupported operator on status base column', () => {
    expect(() =>
      parseContentQuery({ filters: { status: { $gt: 'published' } } }, fields),
    ).toThrow(/not supported for base column 'status'/);
  });

  it('allows filtering on createdAt base column with $gt', () => {
    const result = parseContentQuery(
      { filters: { createdAt: { $gt: '2026-01-01T00:00:00Z' } } },
      fields,
    );
    expect(result.where).toBeDefined();
  });

  it('parses top-level query.status=published and query.status=draft', () => {
    const pub = parseContentQuery({ status: 'published' }, fields);
    expect(pub.where).toBeDefined();

    const draft = parseContentQuery({ status: 'draft' }, fields);
    expect(draft.where).toBeDefined();
  });

  it('parses top-level query.status=all without adding where clause', () => {
    const result = parseContentQuery({ status: 'all' }, fields);
    expect(result.where).toBeUndefined();
  });

  it('rejects invalid query.status value', () => {
    expect(() => parseContentQuery({ status: 'archived' }, fields)).toThrow(
      /Invalid status/,
    );
  });

  it('applies defaultStatus if neither query.status nor filters.status is provided', () => {
    const result = parseContentQuery({}, fields, 'published');
    expect(result.where).toBeDefined();
  });

  it('rejects filtering on a field that does not exist on the schema', () => {
    expect(() =>
      parseContentQuery({ filters: { nope: { $eq: 'x' } } }, fields),
    ).toThrow(/Unknown field/);
  });

  it('rejects an unsupported operator', () => {
    expect(() =>
      parseContentQuery({ filters: { title: { $regex: 'x' } } }, fields),
    ).toThrow(/Unsupported filter operator/);
  });

  it('rejects $gt on a non-orderable field type', () => {
    expect(() =>
      parseContentQuery(
        { filters: { authorRef: { $gt: 'some-uuid' } } },
        fields,
      ),
    ).toThrow(/not supported/);
  });

  it('rejects $contains on a non-text field type', () => {
    expect(() =>
      parseContentQuery({ filters: { views: { $contains: '5' } } }, fields),
    ).toThrow(/not supported/);
  });

  it('accepts $gt on an orderable (number) field', () => {
    const result = parseContentQuery(
      { filters: { views: { $gte: '10' } } },
      fields,
    );
    expect(result.where).toBeDefined();
  });

  it('rejects $in with no values', () => {
    expect(() =>
      parseContentQuery({ filters: { title: { $in: '' } } }, fields),
    ).toThrow(/at least one value/);
  });

  it('rejects a filter with no operator object', () => {
    expect(() =>
      parseContentQuery({ filters: { title: 'Hello' } }, fields),
    ).toThrow(/must specify an operator/);
  });

  it('parses a single sort field, defaulting to ascending', () => {
    const result = parseContentQuery({ sort: 'title' }, fields);
    expect(result.orderBy).toHaveLength(1);
  });

  it('parses multiple sort fields with explicit directions', () => {
    const result = parseContentQuery({ sort: 'views:desc,title:asc' }, fields);
    expect(result.orderBy).toHaveLength(2);
  });

  it('allows sorting on createdAt/updatedAt base columns', () => {
    const result = parseContentQuery({ sort: 'createdAt:desc' }, fields);
    expect(result.orderBy).toHaveLength(1);
  });

  it('rejects an invalid sort direction', () => {
    expect(() => parseContentQuery({ sort: 'title:sideways' }, fields)).toThrow(
      /Invalid sort direction/,
    );
  });

  it('rejects sorting on an unknown field', () => {
    expect(() => parseContentQuery({ sort: 'nope:asc' }, fields)).toThrow(
      /Unknown field/,
    );
  });

  it('parses page and pageSize', () => {
    const result = parseContentQuery({ page: '2', pageSize: '10' }, fields);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(10);
  });

  it('caps pageSize at the maximum', () => {
    const result = parseContentQuery({ pageSize: '9999' }, fields);
    expect(result.pageSize).toBe(100);
  });

  it('rejects a non-positive page number', () => {
    expect(() => parseContentQuery({ page: '0' }, fields)).toThrow(
      /positive integer/,
    );
  });

  it('rejects a non-integer page number', () => {
    expect(() => parseContentQuery({ page: 'abc' }, fields)).toThrow(
      /positive integer/,
    );
  });

  it('parses the search parameter', () => {
    const result = parseContentQuery({ search: 'hello' }, fields);
    expect(result.search).toBe('hello');
    expect(result.where).toBeDefined();
    expect(result.orderBy.length).toBe(1);
  });

  it('combines search with filters', () => {
    const result = parseContentQuery(
      { search: 'hello', filters: { title: { $eq: 'world' } } },
      fields,
    );
    expect(result.search).toBe('hello');
    expect(result.where).toBeDefined();
  });
});
