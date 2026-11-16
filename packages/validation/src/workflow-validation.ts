import { z } from 'zod';

export const workflowStageValidationSchema = z.object({
  id: z.string().min(1, 'Stage id is required'),
  name: z.string().min(1, 'Stage name is required'),
  slug: z.string().min(1, 'Stage slug is required'),
  color: z.string().optional(),
  order: z.number().int().nonnegative(),
  isInitial: z.boolean().optional().default(false),
  isFinal: z.boolean().optional().default(false),
});

export const workflowTransitionValidationSchema = z.object({
  id: z.string().min(1, 'Transition id is required'),
  name: z.string().min(1, 'Transition name is required'),
  fromStage: z.string().min(1, 'Source stage slug is required'),
  toStage: z.string().min(1, 'Target stage slug is required'),
  requiredRoleIds: z.array(z.string()).optional().default([]),
});

export const createWorkflowValidationSchema = z.object({
  name: z.string().min(1, 'Workflow name is required').max(255),
  description: z.string().optional().nullable(),
  isDefault: z.boolean().optional().default(false),
  stages: z
    .array(workflowStageValidationSchema)
    .min(1, 'At least one stage is required'),
  transitions: z.array(workflowTransitionValidationSchema).default([]),
  schemaIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateWorkflowValidationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
  stages: z.array(workflowStageValidationSchema).min(1).optional(),
  transitions: z.array(workflowTransitionValidationSchema).optional(),
  schemaIds: z.array(z.string().uuid()).optional(),
});

export const assignWorkflowValidationSchema = z.object({
  schemaId: z.string().uuid('Valid schema ID is required'),
});
