import { describe, it, expect, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import rateLimit from 'express-rate-limit';
import { authRateLimiter } from '../../../../src/middlewares/rate-limit.middleware.js';

describe('Auth Rate Limiter Middleware', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should export the authRateLimiter middleware', () => {
    expect(authRateLimiter).toBeDefined();
    expect(typeof authRateLimiter).toBe('function');
  });

  it('should bypass rate limiting in test environment', async () => {
    process.env.NODE_ENV = 'test';
    const app = express();
    app.use(authRateLimiter);
    app.get('/test', (_req, res) => {
      res.status(200).json({ ok: true });
    });

    // Send 25 requests in test mode (max is 20)
    for (let i = 0; i < 25; i++) {
      const res = await request(app).get('/test');
      expect(res.status).toBe(200);
    }
  });

  it('should block requests with 429 when max limit is exceeded in production', async () => {
    // Create an isolated limiter instance for deterministic unit testing
    const testLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 3,
      standardHeaders: true,
      legacyHeaders: false,
      statusCode: 429,
      message: {
        error: {
          message: 'Too many attempts. Please try again after 1 minute.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
      },
    });

    const app = express();
    app.use(testLimiter);
    app.get('/test', (_req, res) => {
      res.status(200).json({ ok: true });
    });

    // 3 requests pass
    for (let i = 0; i < 3; i++) {
      const res = await request(app).get('/test');
      expect(res.status).toBe(200);
    }

    // 4th request gets blocked with 429
    const blockedRes = await request(app).get('/test');
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('should not count successful requests when skipSuccessfulRequests is true', async () => {
    const testLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 2,
      skipSuccessfulRequests: true,
      statusCode: 429,
    });

    const app = express();
    app.use(testLimiter);
    app.get('/success', (_req, res) => {
      res.status(200).json({ ok: true });
    });

    for (let i = 0; i < 5; i++) {
      const res = await request(app).get('/success');
      expect(res.status).toBe(200);
    }
  });
});
