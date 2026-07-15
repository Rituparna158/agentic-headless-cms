import { describe, it, expect } from 'vitest';
import { fieldTypeSpec } from '../../../src/modules/graphql/type-mapper.js';
import type { SchemaField } from '@repo/shared-types';

function field(overrides: Partial<SchemaField>): SchemaField {
  return {
    apiId: 'f',
    displayName: 'F',
    dataType: 'text',
    isRequired: false,
    isUnique: false,
    isLocalized: false,
    isRepeatable: false,
    sortOrder: 0,
    ...overrides,
  };
}

describe('fieldTypeSpec', () => {
  it('maps text/richtext/email/url/enum/date/datetime to String', () => {
    for (const dataType of [
      'text',
      'richtext',
      'email',
      'url',
      'enum',
      'date',
      'datetime',
    ] as const) {
      expect(fieldTypeSpec(field({ dataType }))).toBe('String');
    }
  });

  it('maps number to Float', () => {
    expect(fieldTypeSpec(field({ dataType: 'number' }))).toBe('Float');
  });

  it('maps boolean to Boolean', () => {
    expect(fieldTypeSpec(field({ dataType: 'boolean' }))).toBe('Boolean');
  });

  it('maps media/relation to ID', () => {
    expect(fieldTypeSpec(field({ dataType: 'media' }))).toBe('ID');
    expect(fieldTypeSpec(field({ dataType: 'relation' }))).toBe('ID');
  });

  it('maps json to JSON', () => {
    expect(fieldTypeSpec(field({ dataType: 'json' }))).toBe('JSON');
  });

  it('appends ! for required fields', () => {
    expect(fieldTypeSpec(field({ dataType: 'text', isRequired: true }))).toBe(
      'String!',
    );
  });

  it('wraps repeatable fields in a list', () => {
    expect(fieldTypeSpec(field({ dataType: 'text', isRepeatable: true }))).toBe(
      '[String]',
    );
  });

  it('combines required and repeatable', () => {
    expect(
      fieldTypeSpec(
        field({ dataType: 'number', isRequired: true, isRepeatable: true }),
      ),
    ).toBe('[Float]!');
  });
});
