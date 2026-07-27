import { z } from 'zod';

const baseEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  DB_CLIENT: z.enum(['postgres', 'mysql', 'sqlite']).default('postgres'),

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
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().default('1d'),

  APP_URL: z.string().default('http://localhost:3001'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('"Agentic CMS" <noreply@agentic-cms.com>'),

  STORAGE_ADAPTER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_UPLOAD_DIR: z.string().default('./uploads'),
  // Route path media.routes.ts's GET /file/:key
  STORAGE_LOCAL_BASE_URL: z.string().default('/api/v1/media/file'),
  STORAGE_S3_BUCKET: z.string().optional(),
  STORAGE_S3_REGION: z.string().optional(),
  STORAGE_S3_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_S3_SECRET_ACCESS_KEY: z.string().optional(),
  // For S3-compatible providers (MinIO, R2, localstack) — omit for real AWS S3.
  STORAGE_S3_ENDPOINT: z.string().optional(),
  STORAGE_S3_FORCE_PATH_STYLE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  STORAGE_S3_PUBLIC_URL_BASE: z.string().optional(),

  MAX_UPLOAD_SIZE_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(10 * 1024 * 1024),

  // Full URL parsing, same rationale as DATABASE_URL above — BullMQ/ioredis
  // would otherwise surface a malformed value as a confusing connection
  // error at first queue use rather than at startup.
  REDIS_URL: z
    .string()
    .min(1, 'REDIS_URL is required')
    .refine(
      (value) => {
        try {
          return ['redis:', 'rediss:'].includes(new URL(value).protocol);
        } catch {
          return false;
        }
      },
      {
        message:
          'REDIS_URL must be a valid redis:// or rediss:// connection string',
      },
    )
    .default('redis://localhost:6379'),
  QUEUE_JOB_ATTEMPTS: z.coerce.number().int().positive().default(3),
  QUEUE_JOB_BACKOFF_DELAY_MS: z.coerce.number().int().positive().default(5000),
});

// STORAGE_S3_BUCKET/REGION are only required when STORAGE_ADAPTER is
// actually 's3' — z.object() alone can't express "required if this other
// field equals X", hence the separate superRefine pass below.
const envSchema = baseEnvSchema.superRefine((data, ctx) => {
  if (data.STORAGE_ADAPTER === 's3') {
    if (!data.STORAGE_S3_BUCKET) {
      ctx.addIssue({
        code: 'custom',
        path: ['STORAGE_S3_BUCKET'],
        message: 'STORAGE_S3_BUCKET is required when STORAGE_ADAPTER=s3',
      });
    }
    if (!data.STORAGE_S3_REGION) {
      ctx.addIssue({
        code: 'custom',
        path: ['STORAGE_S3_REGION'],
        message: 'STORAGE_S3_REGION is required when STORAGE_ADAPTER=s3',
      });
    }
  }
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
