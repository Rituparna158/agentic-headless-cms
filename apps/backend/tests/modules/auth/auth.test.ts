import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../src/app.js';
import { authRepository } from '../../../src/modules/auth/auth.repository.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../../src/config/env.js';

vi.mock('../../../src/modules/auth/auth.repository.js', () => ({
  authRepository: {
    getUserByEmail: vi.fn(),
    getUserRoles: vi.fn(),
    getUserPermissions: vi.fn(),
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
  },
}));

describe('Auth Module', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 401 for invalid email', async () => {
      vi.mocked(authRepository.getUserByEmail).mockResolvedValue(null);

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'wrong@example.com',
        password: 'password123',
        rememberMe: false,
      });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('should return 200 and a cookie for valid login', async () => {
      const mockUser = {
        id: 'user-id-123',
        email: 'admin@example.com',
        passwordHash: 'hashed-password',
        firstName: 'Admin',
        lastName: 'User',
      };

      vi.mocked(authRepository.getUserByEmail).mockResolvedValue(
        mockUser as unknown as Awaited<
          ReturnType<typeof authRepository.getUserByEmail>
        >,
      );
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(authRepository.getUserRoles).mockResolvedValue(['admin']);

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@example.com',
        password: 'password123',
        rememberMe: false,
      });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('user-id-123');
      expect(res.body.roles).toEqual(['admin']);

      // Check for set-cookie header
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies![0]).toContain('token=');
      expect(cookies![0]).toContain('HttpOnly');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return user payload if valid token is provided', async () => {
      const payload = {
        id: 'user-1',
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['editor'],
      };
      const token = jwt.sign(payload, env.JWT_SECRET);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('user-1');
      expect(res.body.email).toBe('user@example.com');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should clear the cookie and return 204', async () => {
      const res = await request(app).post('/api/v1/auth/logout');
      expect(res.status).toBe(204);

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies![0]).toContain('token=;');
      expect(cookies![0]).toContain('Expires=');
    });
  });
});
