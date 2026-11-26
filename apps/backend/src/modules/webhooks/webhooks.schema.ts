import { z } from 'zod';

export const createWebhookSchema = z.object({
  name: z.string().trim().min(1, 'Webhook name is required').max(100),
  url: z.string().trim().url('Invalid webhook URL format'),
  events: z
    .array(z.string().trim().min(1))
    .min(1, 'At least one event is required'),
  secret: z.string().trim().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  isActive: z.boolean().optional(),
});

export type CreateWebhookDto = z.infer<typeof createWebhookSchema>;
