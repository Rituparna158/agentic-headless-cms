import { describe, it, expect } from 'vitest';
import { compileZodSchema } from '../src/content-validation.js';
import type {
  SchemaDefinition,
  SchemaField,
} from '../src/schema-definition.js';

function field(overrides: Partial<SchemaField>): SchemaField {
  return {
    apiId: 'f',
    displayName: 'F',
    dataType: 'text',
    isRequired: true,
    isUnique: false,
    isLocalized: false,
    isRepeatable: false,
    sortOrder: 0,
    ...overrides,
  };
}

function definitionWith(f: Partial<SchemaField>): SchemaDefinition {
  return { fields: [field(f)] };
}

describe('compileZodSchema', () => {
  it('validates text fields with min/max/regex', () => {
    const schema = compileZodSchema(
      definitionWith({
        dataType: 'text',
        validation: { min: 2, max: 5, regex: '^[a-z]+$' },
      }),
    );

    expect(schema.safeParse({ f: 'ab' }).success).toBe(true);
    expect(schema.safeParse({ f: 'a' }).success).toBe(false);
    expect(schema.safeParse({ f: 'abcdef' }).success).toBe(false);
    expect(schema.safeParse({ f: 'AB' }).success).toBe(false);
  });

  it('validates number fields with min/max', () => {
    const schema = compileZodSchema(
      definitionWith({ dataType: 'number', validation: { min: 1, max: 10 } }),
    );

    expect(schema.safeParse({ f: 5 }).success).toBe(true);
    expect(schema.safeParse({ f: 0 }).success).toBe(false);
    expect(schema.safeParse({ f: 11 }).success).toBe(false);
  });

  it('validates boolean and media/relation (uuid) fields', () => {
    const boolSchema = compileZodSchema(
      definitionWith({ dataType: 'boolean' }),
    );
    expect(boolSchema.safeParse({ f: true }).success).toBe(true);
    expect(boolSchema.safeParse({ f: 'true' }).success).toBe(false);

    const uuidSchema = compileZodSchema(
      definitionWith({ dataType: 'relation' }),
    );
    expect(
      uuidSchema.safeParse({ f: '550e8400-e29b-41d4-a716-446655440000' })
        .success,
    ).toBe(true);
    expect(uuidSchema.safeParse({ f: 'not-a-uuid' }).success).toBe(false);
  });

  it('validates date and datetime fields as ISO-8601 strings', () => {
    const dateSchema = compileZodSchema(definitionWith({ dataType: 'date' }));
    const datetimeSchema = compileZodSchema(
      definitionWith({ dataType: 'datetime' }),
    );

    expect(dateSchema.safeParse({ f: '2026-01-01T00:00:00Z' }).success).toBe(
      true,
    );
    expect(dateSchema.safeParse({ f: 'not-a-date' }).success).toBe(false);
    expect(
      datetimeSchema.safeParse({ f: '2026-01-01T00:00:00Z' }).success,
    ).toBe(true);
  });

  it('validates email fields', () => {
    const schema = compileZodSchema(definitionWith({ dataType: 'email' }));
    expect(schema.safeParse({ f: 'a@b.com' }).success).toBe(true);
    expect(schema.safeParse({ f: 'not-an-email' }).success).toBe(false);
  });

  it('validates url fields', () => {
    const schema = compileZodSchema(definitionWith({ dataType: 'url' }));
    expect(schema.safeParse({ f: 'https://example.com' }).success).toBe(true);
    expect(schema.safeParse({ f: 'not a url' }).success).toBe(false);
  });

  it('validates enum fields against config.options when provided', () => {
    const schema = compileZodSchema(
      definitionWith({ dataType: 'enum', config: { options: ['a', 'b'] } }),
    );
    expect(schema.safeParse({ f: 'a' }).success).toBe(true);
    expect(schema.safeParse({ f: 'c' }).success).toBe(false);
  });

  it('falls back to a plain string for enum fields with no configured options', () => {
    const schema = compileZodSchema(definitionWith({ dataType: 'enum' }));
    expect(schema.safeParse({ f: 'anything' }).success).toBe(true);
    expect(schema.safeParse({ f: 123 }).success).toBe(false);
  });

  it('accepts arbitrary values for json fields', () => {
    const schema = compileZodSchema(definitionWith({ dataType: 'json' }));
    expect(schema.safeParse({ f: { nested: [1, 2, 3] } }).success).toBe(true);
  });

  it('wraps repeatable fields in an array', () => {
    const schema = compileZodSchema(
      definitionWith({ dataType: 'text', isRepeatable: true }),
    );
    expect(schema.safeParse({ f: ['a', 'b'] }).success).toBe(true);
    expect(schema.safeParse({ f: 'a' }).success).toBe(false);
  });

  it('makes non-required fields optional', () => {
    const schema = compileZodSchema(
      definitionWith({ dataType: 'text', isRequired: false }),
    );
    expect(schema.safeParse({}).success).toBe(true);
  });

  it('rejects unknown keys (strict mode)', () => {
    const schema = compileZodSchema(definitionWith({ dataType: 'text' }));
    expect(schema.safeParse({ f: 'x', extra: 'nope' }).success).toBe(false);
  });

  it('rejects an empty string for a required text/richtext field with no explicit min', () => {
    const textSchema = compileZodSchema(
      definitionWith({ dataType: 'text', isRequired: true }),
    );
    expect(textSchema.safeParse({ f: '' }).success).toBe(false);
    expect(textSchema.safeParse({ f: 'x' }).success).toBe(true);

    const richtextSchema = compileZodSchema(
      definitionWith({ dataType: 'richtext', isRequired: true }),
    );
    expect(richtextSchema.safeParse({ f: '' }).success).toBe(false);
  });

  it('respects an explicit min over the implicit required min(1)', () => {
    const schema = compileZodSchema(
      definitionWith({
        dataType: 'text',
        isRequired: true,
        validation: { min: 3 },
      }),
    );
    expect(schema.safeParse({ f: 'ab' }).success).toBe(false);
    expect(schema.safeParse({ f: 'abc' }).success).toBe(true);
  });
});
