import { z } from 'zod';

/**
 * Shared between the admin UI's schema builder and the backend's
 * POST/PUT /api/v1/schemas handlers (issue #14), so both sides validate the
 * exact same shape instead of two hand-maintained copies drifting apart.
 */
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
  // lowercase snake_case: used as both the JSON key in stored content and a
  // Postgres column-safe identifier via the normalized `fields` table.
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

export type SchemaFieldInput = z.infer<typeof schemaFieldSchema>;
export type SchemaField = z.infer<typeof schemaFieldSchema>;

export interface SchemaDefinition {
  fields: SchemaField[];
}

export const schemaTypeValues = [
  'collection',
  'single_type',
  'component',
] as const;

export const createSchemaSchema = z.object({
  name: z.string().min(1, 'name is required').max(255),
  // lowercase kebab-case: used as the schema's stable, URL-safe identifier.
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

export type CreateSchemaInput = z.infer<typeof createSchemaSchema>;

// `slug` and `type` are deliberately not editable here — the slug is the
// schema's stable identifier (changing it would break every existing
// reference to it) and the type determines how entries are structured, so
// changing it after creation isn't a simple field-list update.
export const updateSchemaSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    fields: z.array(schemaFieldSchema).min(1).optional(),
    migrationNotes: z.string().max(2000).optional(),
  })
  .refine((data) => data.name !== undefined || data.fields !== undefined, {
    message: 'At least one of name or fields must be provided',
  });

export type UpdateSchemaInput = z.infer<typeof updateSchemaSchema>;
