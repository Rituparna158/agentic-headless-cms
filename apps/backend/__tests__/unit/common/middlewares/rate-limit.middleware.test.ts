import { describe, it, expect, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import {
  authRateLimiter,
  passwordResetRateLimiter,
} from '../../../../src/middlewares/rate-limit.middleware.js';

describe('Auth Rate Limiter Middleware', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should export the authRateLimiter and passwordResetRateLimiter middlewares', () => {
    expect(authRateLimiter).toBeDefined();
    expect(typeof authRateLimiter).toBe('function');
    expect(passwordResetRateLimiter).toBeDefined();
    expect(typeof passwordResetRateLimiter).toBe('function');
  });

  it('should bypass rate limiting in test environment', async () => {
    process.env.NODE_ENV = 'test';
    const app = express();
    app.use(authRateLimiter);
    app.get('/test', (_req, res) => {
      res.status(200).json({ ok: true });
    });

    for (let i = 0; i < 25; i++) {
      const res = await request(app).get('/test');
      expect(res.status).toBe(200);
    }
  });

  it('should not count successful requests against authRateLimiter quota outside test mode', async () => {
    process.env.NODE_ENV = 'development';
    const app = express();
    app.use(authRateLimiter);
    app.get('/login-success', (_req, res) => {
      res.status(200).json({ ok: true });
    });

    // Send 25 successful requests (greater than max 20)
    for (let i = 0; i < 25; i++) {
      const res = await request(app).get('/login-success');
      expect(res.status).toBe(200);
    }
  });

  it('should count all requests and enforce limit on passwordResetRateLimiter outside test mode', async () => {
    process.env.NODE_ENV = 'development';
    const app = express();
    app.use(passwordResetRateLimiter);
    app.post('/forgot-password', (_req, res) => {
      res.status(200).json({ ok: true });
    });

    // 5 requests pass (max is 5)
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/forgot-password');
      expect(res.status).toBe(200);
    }

    // 6th request gets blocked with 429
    const blockedRes = await request(app).post('/forgot-password');
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
