import { z } from 'zod';

const baseEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  DB_CLIENT: z.enum(['postgres', 'mysql', 'sqlite']).default('postgres'),
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

  CORS_ORIGIN: z.string().default('http://localhost:3001'),
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
  SUPPORT_EMAIL: z.email().optional(),

  STORAGE_ADAPTER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_UPLOAD_DIR: z.string().default('./uploads'),
  STORAGE_LOCAL_BASE_URL: z.string().default('/api/v1/media/file'),
  STORAGE_S3_BUCKET: z.string().optional(),
  STORAGE_S3_REGION: z.string().optional(),
  STORAGE_S3_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_S3_SECRET_ACCESS_KEY: z.string().optional(),
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

  OIDC_ISSUER_URL: z.string().url().optional(),
  OIDC_CLIENT_ID: z.string().optional(),
  OIDC_CLIENT_SECRET: z.string().optional(),
  OIDC_REDIRECT_URI: z.string().url().optional(),
});

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

  if (data.OIDC_ISSUER_URL) {
    if (!data.OIDC_CLIENT_ID) {
      ctx.addIssue({
        code: 'custom',
        path: ['OIDC_CLIENT_ID'],
        message: 'OIDC_CLIENT_ID is required when OIDC_ISSUER_URL is provided',
      });
    }
    if (!data.OIDC_CLIENT_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['OIDC_CLIENT_SECRET'],
        message:
          'OIDC_CLIENT_SECRET is required when OIDC_ISSUER_URL is provided',
      });
    }
    if (!data.OIDC_REDIRECT_URI) {
      ctx.addIssue({
        code: 'custom',
        path: ['OIDC_REDIRECT_URI'],
        message:
          'OIDC_REDIRECT_URI is required when OIDC_ISSUER_URL is provided',
      });
    }
  }
});

export type Env = z.infer<typeof envSchema>;

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
