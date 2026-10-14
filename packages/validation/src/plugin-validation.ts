import { z } from 'zod';

export const updatePluginStatusSchema = z.object({
  isEnabled: z.boolean(),
});

export const updatePluginConfigSchema = z.object({
  config: z.record(z.string(), z.unknown()),
});

export type UpdatePluginStatusDto = z.infer<typeof updatePluginStatusSchema>;
export type UpdatePluginConfigDto = z.infer<typeof updatePluginConfigSchema>;
