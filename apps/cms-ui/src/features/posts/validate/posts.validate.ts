import { z } from 'zod';

export const dynamicFieldDefinitionSchema = z
  .object({
    id: z.string().optional(),
    apiId: z.string(),
    displayName: z.string().optional(),
    name: z.string().optional(),
    dataType: z.string().optional(),
    required: z.boolean().optional(),
    isRequired: z.boolean().optional(),
    isUnique: z.boolean().optional(),
    isLocalized: z.boolean().optional(),
    isRepeatable: z.boolean().optional(),
    defaultValue: z.unknown().optional(),
    placeholder: z.string().optional(),
    helpText: z.string().optional(),
    description: z.string().optional(),
  })
  .loose();

export const dynamicSchemaDefinitionSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    type: z.enum(['collection', 'single_type', 'component']),
    status: z.string().optional(),
    fields: z.array(dynamicFieldDefinitionSchema).optional().default([]),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .loose();
