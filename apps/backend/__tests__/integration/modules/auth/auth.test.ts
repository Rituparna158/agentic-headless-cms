/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../../src/app.js';
import { authRepository } from '@repo/repository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '@repo/config';

vi.mock('@repo/repository', () => ({
  authRepository: {
    getUserByEmail: vi.fn(),
    getUserRoles: vi.fn(),
    getUserPermissions: vi.fn(),
    getUserByInviteTokenHash: vi.fn(),
    activateUser: vi.fn(),
  },
  ContentRepository: vi.fn().mockImplementation(class {}),
  MediaRepository: vi.fn().mockImplementation(class {}),
  SchemaRepository: vi.fn().mockImplementation(class {}),
  AuditRepository: vi.fn().mockImplementation(class {}),
  AccessRepository: vi.fn().mockImplementation(class {}),
  LocalesRepository: vi.fn().mockImplementation(class {}),
  WebhooksRepository: vi.fn().mockImplementation(class {}),
}));

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue('hashed-password'),
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

    it('should return 400 for a malformed payload', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'not-an-email',
        password: '',
        rememberMe: false,
      });

      expect(res.status).toBe(400);
      expect(authRepository.getUserByEmail).not.toHaveBeenCalled();
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
      expect(res.body.data.id).toBe('user-id-123');
      expect(res.body.data.roles).toEqual(['admin']);

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
      expect(res.body.data.id).toBe('user-1');
      expect(res.body.data.email).toBe('user@example.com');
    });

    it('should return 401 for a malformed token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', ['token=not-a-real-jwt']);

      expect(res.status).toBe(401);
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

  describe('POST /api/v1/auth/accept-invite', () => {
    it('should return 400 when token or newPassword is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/accept-invite')
        .send({ token: 'some-token' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Token and newPassword are required');
    });

    it('should return 400 when the new password is too short', async () => {
      const res = await request(app).post('/api/v1/auth/accept-invite').send({
        token: 'some-token',
        newPassword: 'short',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe(
        'Password must be at least 8 characters long',
      );
    });

    it('should return 400 for an unknown invite token', async () => {
      vi.mocked(authRepository.getUserByInviteTokenHash).mockResolvedValue(
        null,
      );

      const res = await request(app).post('/api/v1/auth/accept-invite').send({
        token: 'not-a-real-token',
        newPassword: 'a-strong-password-123',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe(
        'Invalid or expired invitation token',
      );
    });

    it('should return 400 for an expired invite token', async () => {
      vi.mocked(authRepository.getUserByInviteTokenHash).mockResolvedValue({
        id: 'user-2',
        status: 'invited',
        inviteExpiresAt: new Date(Date.now() - 60_000),
      } as unknown as Awaited<
        ReturnType<typeof authRepository.getUserByInviteTokenHash>
      >);

      const res = await request(app).post('/api/v1/auth/accept-invite').send({
        token: 'e2e-fixed-expired-invite-token',
        newPassword: 'a-strong-password-123',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Invitation token has expired');
    });

    it('should activate the user and return 200 for a valid invite token', async () => {
      vi.mocked(authRepository.getUserByInviteTokenHash).mockResolvedValue({
        id: 'user-3',
        status: 'invited',
        inviteExpiresAt: new Date(Date.now() + 60_000),
      } as unknown as Awaited<
        ReturnType<typeof authRepository.getUserByInviteTokenHash>
      >);

      const res = await request(app).post('/api/v1/auth/accept-invite').send({
        token: 'a-valid-token',
        newPassword: 'a-strong-password-123',
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Password set successfully');
      expect(authRepository.activateUser).toHaveBeenCalledWith(
        'user-3',
        expect.any(String),
      );
    });
  });
});
