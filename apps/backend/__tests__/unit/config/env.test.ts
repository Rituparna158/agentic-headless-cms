import { describe, it, expect } from 'vitest';
import { envSchema } from '@mindfiredigital/config';

describe('Environment Configuration Schema Validation', () => {
  const validProdEnv = {
    NODE_ENV: 'production',
    DATABASE_URL:
      'postgresql://prod_user:StrongSecretPass987@prod-db.internal:5432/agentic_cms',
    JWT_SECRET: 'a_very_strong_production_random_secret_string_32chars!',
    CORS_ORIGIN: 'https://cms.mydomain.com',
    APP_URL: 'https://cms.mydomain.com',
    REDIS_URL: 'redis://prod-redis.internal:6379',
  };

  it('validates a correct production environment configuration', () => {
    const result = envSchema.safeParse(validProdEnv);
    expect(result.success).toBe(true);
  });

  it('rejects predictable or default JWT_SECRET in production', () => {
    const result = envSchema.safeParse({
      ...validProdEnv,
      JWT_SECRET: 'super_secret_jwt_key_at_least_32_characters_long',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path.includes('JWT_SECRET')),
      ).toBe(true);
    }
  });

  it('rejects wildcard CORS_ORIGIN in production', () => {
    const result = envSchema.safeParse({
      ...validProdEnv,
      CORS_ORIGIN: '*',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path.includes('CORS_ORIGIN')),
      ).toBe(true);
    }
  });

  it('rejects loopback addresses like 127.0.0.1 in production CORS_ORIGIN', () => {
    const result = envSchema.safeParse({
      ...validProdEnv,
      CORS_ORIGIN: 'http://127.0.0.1:3000',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path.includes('CORS_ORIGIN')),
      ).toBe(true);
    }
  });

  it('allows valid domains containing localhost as a substring in production CORS_ORIGIN', () => {
    const result = envSchema.safeParse({
      ...validProdEnv,
      CORS_ORIGIN: 'https://localhost-cms.example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects default postgres:postgres database credentials in production', () => {
    const result = envSchema.safeParse({
      ...validProdEnv,
      DATABASE_URL: 'postgresql://postgres:postgres@prod-db:5432/agentic_cms',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path.includes('DATABASE_URL')),
      ).toBe(true);
    }
  });

  it('rejects percent-encoded postgres:postgres database credentials in production', () => {
    const result = envSchema.safeParse({
      ...validProdEnv,
      DATABASE_URL: 'postgresql://postgres:%70ostgres@prod-db:5432/agentic_cms',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path.includes('DATABASE_URL')),
      ).toBe(true);
    }
  });

  it('rejects insecure SEED_ADMIN_PASSWORD in production', () => {
    const result = envSchema.safeParse({
      ...validProdEnv,
      SEED_ADMIN_EMAIL: 'admin@prod.com',
      SEED_ADMIN_PASSWORD: 'admin',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path.includes('SEED_ADMIN_PASSWORD')),
      ).toBe(true);
    }
  });

  it('allows development defaults in development mode', () => {
    const result = envSchema.safeParse({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/agentic_cms',
      JWT_SECRET: 'super_secret_jwt_key_at_least_32_characters_long',
      CORS_ORIGIN: 'http://localhost:3001',
    });
    expect(result.success).toBe(true);
  });
});
