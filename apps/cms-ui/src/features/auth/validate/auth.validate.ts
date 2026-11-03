import { z } from 'zod';

export const authenticatedUserContractSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    roles: z.array(z.string()).default([]),
    mfaEnabled: z.boolean().default(false),
    permissions: z
      .array(
        z
          .object({
            action: z.string(),
            schemaId: z.string().nullable().optional(),
            effect: z.string().optional().default('allow'),
            fields: z.array(z.string()).nullable().optional(),
            condition: z.record(z.string(), z.unknown()).nullable().optional(),
          })
          .loose(),
      )
      .nullable()
      .optional(),
  })
  .loose();
