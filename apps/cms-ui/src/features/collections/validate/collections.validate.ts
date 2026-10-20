import { z } from 'zod';

export const schemaFieldContractSchema = z
  .object({
    apiId: z.string(),
    displayName: z.string(),
    dataType: z.string(),
    isRequired: z.boolean().optional().default(false),
    isUnique: z.boolean().optional().default(false),
    isLocalized: z.boolean().optional().default(false),
    isRepeatable: z.boolean().optional().default(false),
    validation: z.record(z.string(), z.unknown()).nullable().optional(),
    config: z.record(z.string(), z.unknown()).nullable().optional(),
    sortOrder: z.number().optional().default(0),
  })
  .loose();

export const schemaEntryContractSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    type: z.enum(['collection', 'single_type', 'component']).or(z.string()),
    status: z.string().optional(),
    entryCount: z.number().optional(),
    lastUpdatedBy: z.string().nullable().optional(),
    fields: z.array(schemaFieldContractSchema).optional().default([]),
    definition: z
      .object({
        fields: z.array(schemaFieldContractSchema).optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
      .loose()
      .optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .loose();

export const paginationMetaContractSchema = z
  .object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    pageCount: z.number(),
  })
  .loose();

export const paginatedSchemasContractSchema = z
  .object({
    data: z.array(schemaEntryContractSchema),
    meta: z
      .object({
        pagination: paginationMetaContractSchema,
      })
      .loose(),
  })
  .loose();

export const pageEntryContractSchema = z
  .object({
    id: z.string(),
    schemaId: z.string().optional(),
    locale: z.string().optional().default('en'),
    status: z.enum(['draft', 'published']).or(z.string()),
    data: z
      .object({
        title: z.string().optional().default(''),
        slug: z.string().optional().default(''),
        description: z.string().optional(),
        body: z.unknown().optional(),
      })
      .loose(),
    publishedData: z.unknown().nullable().optional(),
    publishedAt: z.string().nullable().optional(),
    updatedBy: z.string().nullable().optional(),
    collaborators: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .loose();

export const paginatedPagesContractSchema = z
  .object({
    data: z.array(pageEntryContractSchema),
    meta: z
      .object({
        pagination: paginationMetaContractSchema,
      })
      .loose(),
  })
  .loose();
