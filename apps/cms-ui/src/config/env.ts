import { z } from 'zod';
import { browserLogger } from '@repo/logger/browser';

const envSchema = z
  .object({
    VITE_API_URL: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val) return true;
          return (
            val.startsWith('/') ||
            val.startsWith('http://') ||
            val.startsWith('https://')
          );
        },
        {
          message:
            'VITE_API_URL must be a valid relative path (e.g. /api/v1) or absolute URL (http/https)',
        },
      ),
    VITE_ENVIRONMENT: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    VITE_APP_ID: z.string().default('CMS_UI'),
  })
  .transform((data) => ({
    ...data,
    VITE_API_URL: data.VITE_API_URL || '/api/v1',
  }));

const _env = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_ENVIRONMENT: import.meta.env.MODE,
  VITE_APP_ID: import.meta.env.VITE_APP_ID,
});

if (!_env.success) {
  browserLogger.error('Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
