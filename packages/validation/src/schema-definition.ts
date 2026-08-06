import { z } from 'zod';

export const schemaFieldDataTypes = [
  'text',
  'richtext',
  'number',
  'boolean',
  'date',
  'datetime',
  'json',
  'media',
  'relation',
  'email',
  'url',
  'enum',
] as const;

export const schemaFieldSchema = z.object({
  apiId: z
    .string()
    .min(1)
    .max(255)
    .regex(
      /^[a-z][a-z0-9_]*$/,
      'apiId must start with a lowercase letter and contain only lowercase letters, numbers, and underscores',
    ),
  displayName: z.string().min(1, 'displayName is required').max(255),
  dataType: z.enum(schemaFieldDataTypes),
  isRequired: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  isLocalized: z.boolean().default(false),
  isRepeatable: z.boolean().default(false),
  validation: z.record(z.string(), z.unknown()).nullish(),
  config: z.record(z.string(), z.unknown()).nullish(),
  sortOrder: z.number().int().default(0),
});

export const schemaTypeValues = [
  'collection',
  'single_type',
  'component',
] as const;

export const createSchemaSchema = z.object({
  name: z.string().min(1, 'name is required').max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(
      /^[a-z][a-z0-9-]*$/,
      'slug must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens',
    ),
  type: z.enum(schemaTypeValues),
  fields: z.array(schemaFieldSchema).min(1, 'At least one field is required'),
});

export const updateSchemaSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    fields: z.array(schemaFieldSchema).min(1).optional(),
    migrationNotes: z.string().max(2000).optional(),
  })
  .refine((data) => data.name !== undefined || data.fields !== undefined, {
    message: 'At least one of name or fields must be provided',
  });
