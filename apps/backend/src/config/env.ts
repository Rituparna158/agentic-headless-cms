import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),

  // Full URL parsing here, not just a prefix check — @repo/shared-db's own
  // createDatabaseClient() validates this the same way, but catching a
  // malformed value at env-load time gives a clearer error than letting it
  // surface later from inside the database client.
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine(
      (value) => {
        try {
          return ['postgres:', 'postgresql:'].includes(new URL(value).protocol);
        } catch {
          return false;
        }
      },
      {
        message:
          'DATABASE_URL must be a valid postgres:// or postgresql:// connection string',
      },
    ),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  DATABASE_SSL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),

  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parsed once, at module load — fails the process immediately on import
 * with a precise, readable error if the environment is misconfigured,
 * rather than letting the server start and fail confusingly on the first
 * request that needs the missing/malformed value.
 */
function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  return result.data;
}

export const env = loadEnv();
