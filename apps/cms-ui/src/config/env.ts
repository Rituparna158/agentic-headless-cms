import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:8080/api'),
  VITE_ENVIRONMENT: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

const _env = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_ENVIRONMENT: import.meta.env.MODE,
});

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
