import { z } from 'zod';

export const roleSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    isSystem: z.boolean().optional(),
    userCount: z.number().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .loose();

export const userSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    status: z.string().optional(),
    roles: z.array(z.string()).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .loose();
