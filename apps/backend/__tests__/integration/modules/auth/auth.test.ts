/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
vi.mock('../../../../src/middlewares/global-auth.middleware', () => ({
  globalAuthMiddleware: (
    req: import('express').Request,
    res: import('express').Response,
    next: import('express').NextFunction,
  ) => {
    req.headers['x-app-id'] = req.headers['x-app-id'] || 'default';
    req.context = { ...req.context, applicationId: 'app-1' };
    next();
  },
}));
import { createApp } from '../../../../src/app.js';
import { authRepository } from '@repo/repository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '@repo/config';
const { mockGetAdminUsers } = vi.hoisted(() => ({
  mockGetAdminUsers: vi.fn().mockResolvedValue([]),
}));
vi.mock('@repo/config', () => ({
  env: {
    CORS_ORIGIN: 'http://localhost:3001',
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    JWT_SECRET: 'super_secret_jwt_key_that_is_at_least_32_chars_long',
    JWT_EXPIRES_IN: '1d',
    SMTP_HOST: 'localhost',
    SMTP_PORT: 1025,
    SMTP_USER: 'user',
    SMTP_PASS: 'pass',
    EMAIL_FROM: 'noreply@example.com',
    APP_URL: 'http://localhost:3000',
  },
}));
vi.mock('node:fs/promises', () => ({
  default: {
    readFile: vi
      .fn()
      .mockResolvedValue(
        'Mocked template: userEmail={{userEmail}} requestId={{requestId}}',
      ),
  },
}));
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue(true),
    }),
  },
}));
vi.mock('@repo/repository', () => ({
  authRepository: {
    getUserByEmail: vi.fn(),
    getUserRoles: vi.fn(),
    getUserRolesWithMfaInfo: vi.fn(),
    getUserPermissions: vi.fn(),
    getUserByInviteTokenHash: vi.fn(),
    activateUser: vi.fn(),
    getUserById: vi.fn(),
    updateMfaSecret: vi.fn(),
    enableMfa: vi.fn(),
    createMfaResetRequest: vi.fn(),
    getMfaResetRequestById: vi.fn(),
    getPendingMfaResetRequests: vi.fn(),
    getMfaResetRequestByTokenHash: vi.fn(),
    updateMfaResetRequest: vi.fn(),
    disableMfa: vi.fn(),
    createPasswordResetRequest: vi.fn(),
    getPasswordResetRequestByTokenHash: vi.fn(),
    updatePasswordResetRequest: vi.fn(),
    updateUserPassword: vi.fn(),
  },
  ContentRepository: vi.fn().mockImplementation(class {}),
  MediaRepository: vi.fn().mockImplementation(class {}),
  MediaFoldersRepository: vi.fn().mockImplementation(class {}),
  SchemaRepository: vi.fn().mockImplementation(class {}),
  AuditRepository: vi.fn().mockImplementation(class {}),
  AccessRepository: vi.fn().mockImplementation(
    class {
      getAdminUsers = mockGetAdminUsers;
      getUsersByRoleName = vi.fn().mockResolvedValue([]);
    },
  ),
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
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('x-app-id', 'CMS_UI')
        .send({
          email: 'wrong@example.com',
          password: 'password123',
          rememberMe: false,
        });
      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid email or password');
    });
    it('should return 400 for a malformed payload', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('x-app-id', 'CMS_UI')
        .send({
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
      vi.mocked(authRepository.getUserRolesWithMfaInfo).mockResolvedValue([
        { id: 'role-1', name: 'admin', mfaRequired: false },
      ]);
      vi.mocked(authRepository.getUserRoles).mockResolvedValue(['admin']);
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('x-app-id', 'CMS_UI')
        .send({
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
      expect(cookies![0]).toContain('token_cms_ui=');
      expect(cookies![0]).toContain('HttpOnly');
    });
  });
  describe('GET /api/v1/auth/me', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('x-app-id', 'CMS_UI');
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
        .set('x-app-id', 'CMS_UI')
        .set('Cookie', [`token_cms_ui=${token}`]);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('user-1');
      expect(res.body.data.email).toBe('user@example.com');
    });
    it('should return 401 for a malformed token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('x-app-id', 'CMS_UI')
        .set('Cookie', ['token_cms_ui=not-a-real-jwt']);
      expect(res.status).toBe(401);
    });
  });
  describe('POST /api/v1/auth/logout', () => {
    it('should clear the cookie and return 204', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('x-app-id', 'CMS_UI');
      expect(res.status).toBe(204);
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies![0]).toContain('token_cms_ui=;');
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
  describe('MFA Endpoints', () => {
    const userPayload = {
      id: 'user-id-123',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      roles: ['admin'],
      mfaEnabled: false,
    };
    const validToken = jwt.sign(userPayload, env.JWT_SECRET);
    describe('POST /api/v1/auth/mfa/enroll', () => {
      it('should return 401 if unauthenticated', async () => {
        const res = await request(app)
          .post('/api/v1/auth/mfa/enroll')
          .set('x-app-id', 'CMS_UI');
        expect(res.status).toBe(401);
      });
      it('should return 200 with secret and qrCode if authenticated', async () => {
        vi.mocked(authRepository.getUserById).mockResolvedValue({
          id: 'user-id-123',
          email: 'admin@example.com',
        } as never);
        const res = await request(app)
          .post('/api/v1/auth/mfa/enroll')
          .set('x-app-id', 'CMS_UI')
          .set('Cookie', [`token_cms_ui=${validToken}`]);
        expect(res.status).toBe(200);
        expect(res.body.data.secret).toBeDefined();
        expect(res.body.data.qrCode).toBeDefined();
        expect(authRepository.updateMfaSecret).toHaveBeenCalledWith(
          'user-id-123',
          expect.any(String),
        );
      });
    });
    describe('POST /api/v1/auth/mfa/verify', () => {
      it('should return 400 for malformed payload', async () => {
        const res = await request(app)
          .post('/api/v1/auth/mfa/verify')
          .set('x-app-id', 'CMS_UI')
          .set('Cookie', [`token_cms_ui=${validToken}`])
          .send({ code: '12' });
        expect(res.status).toBe(400);
      });
      it('should return 400 for incorrect verification code', async () => {
        vi.mocked(authRepository.getUserById).mockResolvedValue({
          id: 'user-id-123',
          mfaSecret: 'JBSWY3DPEHPK3PXP', // Valid base32 secret
        } as never);
        const res = await request(app)
          .post('/api/v1/auth/mfa/verify')
          .set('x-app-id', 'CMS_UI')
          .set('Cookie', [`token_cms_ui=${validToken}`])
          .send({ code: '000000' });
        expect(res.status).toBe(400);
        expect(res.body.error.message).toBe('Invalid verification code');
      });
    });
    describe('Login MFA Challenge flows', () => {
      it('should return 200 with mfaRequired and mfaToken if user has MFA enabled', async () => {
        const mockUser = {
          id: 'user-id-123',
          email: 'admin@example.com',
          passwordHash: 'hashed-password',
          mfaEnabled: true,
          mfaSecret: 'JBSWY3DPEHPK3PXP',
        };
        vi.mocked(authRepository.getUserByEmail).mockResolvedValue(
          mockUser as never,
        );
        vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
        vi.mocked(authRepository.getUserRolesWithMfaInfo).mockResolvedValue([
          { id: 'role-1', name: 'admin', mfaRequired: false },
        ]);
        const res = await request(app)
          .post('/api/v1/auth/login')
          .set('x-app-id', 'CMS_UI')
          .send({
            email: 'admin@example.com',
            password: 'password123',
            rememberMe: false,
          });
        expect(res.status).toBe(200);
        expect(res.body.data.mfaRequired).toBe(true);
        expect(res.body.data.mfaToken).toBeDefined();
        // Should not set the session cookie
        expect(res.headers['set-cookie']).toBeUndefined();
      });
      it('should block login with 401 if user does not have MFA enabled but role requires it', async () => {
        const mockUser = {
          id: 'user-id-123',
          email: 'admin@example.com',
          passwordHash: 'hashed-password',
          mfaEnabled: false,
        };
        vi.mocked(authRepository.getUserByEmail).mockResolvedValue(
          mockUser as never,
        );
        vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
        vi.mocked(authRepository.getUserRolesWithMfaInfo).mockResolvedValue([
          { id: 'role-1', name: 'admin', mfaRequired: true },
        ]);
        const res = await request(app)
          .post('/api/v1/auth/login')
          .set('x-app-id', 'CMS_UI')
          .send({
            email: 'admin@example.com',
            password: 'password123',
            rememberMe: false,
          });
        expect(res.status).toBe(401);
        expect(res.body.error.message).toContain(
          'Multi-factor authentication is required for your role',
        );
      });
    });
    describe('POST /api/v1/auth/mfa/challenge', () => {
      it('should reject wrong MFA challenge code or invalid token', async () => {
        const challengeToken = jwt.sign(
          { userId: 'user-id-123', isMfaChallenge: true },
          env.JWT_SECRET,
          { expiresIn: '5m' },
        );
        vi.mocked(authRepository.getUserById).mockResolvedValue({
          id: 'user-id-123',
          mfaSecret: 'JBSWY3DPEHPK3PXP',
          mfaEnabled: true,
        } as never);
        const res = await request(app)
          .post('/api/v1/auth/mfa/challenge')
          .set('x-app-id', 'CMS_UI')
          .send({
            mfaToken: challengeToken,
            code: '000000',
          });
        expect(res.status).toBe(401);
        expect(res.body.error.message).toBe('Invalid or expired MFA session');
      });
    });
    describe('POST /api/v1/auth/mfa/reset-request', () => {
      it('should return 400 if email is missing', async () => {
        const res = await request(app)
          .post('/api/v1/auth/mfa/reset-request')
          .send({});
        expect(res.status).toBe(400);
        expect(res.body.error.message).toBe('Email is required');
      });
      it('should return 200 silently if user is not found to prevent enumeration', async () => {
        vi.mocked(authRepository.getUserByEmail).mockResolvedValue(null);
        const res = await request(app)
          .post('/api/v1/auth/mfa/reset-request')
          .send({ email: 'nonexistent@example.com' });
        expect(res.status).toBe(200);
        expect(res.body.data.message).toContain(
          'If the email exists, a request has been sent',
        );
      });
      it('should return 400 if MFA is not enabled for the user', async () => {
        vi.mocked(authRepository.getUserByEmail).mockResolvedValue({
          id: 'user-id-123',
          email: 'user@example.com',
          mfaEnabled: false,
        } as never);
        const res = await request(app)
          .post('/api/v1/auth/mfa/reset-request')
          .send({ email: 'user@example.com' });
        expect(res.status).toBe(400);
        expect(res.body.error.message).toBe(
          'MFA is not enabled for this user.',
        );
      });
      it('should successfully create MFA reset request, fetch admin users, and return 200', async () => {
        vi.mocked(authRepository.getUserByEmail).mockResolvedValue({
          id: 'user-id-123',
          email: 'user@example.com',
          mfaEnabled: true,
        } as never);
        vi.mocked(authRepository.createMfaResetRequest).mockResolvedValue({
          id: 'request-id-123',
          userId: 'user-id-123',
          status: 'pending',
        } as never);
        mockGetAdminUsers.mockResolvedValue([
          { id: 'admin-1', email: 'admin@example.com' },
        ]);
        const res = await request(app)
          .post('/api/v1/auth/mfa/reset-request')
          .send({ email: 'user@example.com' });
        expect(res.status).toBe(200);
        expect(res.body.data.message).toContain(
          'If the email exists, a request has been sent',
        );
        expect(authRepository.createMfaResetRequest).toHaveBeenCalledWith(
          'user-id-123',
        );
      });
    });
    describe('POST /api/v1/auth/mfa/reset-complete', () => {
      it('should return 400 if token is missing', async () => {
        const res = await request(app)
          .post('/api/v1/auth/mfa/reset-complete')
          .send({});
        expect(res.status).toBe(400);
        expect(res.body.error.message).toBe('Token is required');
      });
      it('should return 400 if token is invalid or request is not approved', async () => {
        vi.mocked(
          authRepository.getMfaResetRequestByTokenHash,
        ).mockResolvedValue(null);
        const res = await request(app)
          .post('/api/v1/auth/mfa/reset-complete')
          .send({ token: 'invalid-token' });
        expect(res.status).toBe(400);
        expect(res.body.error.message).toBe(
          'Invalid or unapproved reset token',
        );
      });
      it('should return 400 if token has expired', async () => {
        vi.mocked(
          authRepository.getMfaResetRequestByTokenHash,
        ).mockResolvedValue({
          id: 'request-id-123',
          userId: 'user-id-123',
          status: 'approved',
          expiresAt: new Date(Date.now() - 3600000), // Expired 1 hour ago
        } as never);
        const res = await request(app)
          .post('/api/v1/auth/mfa/reset-complete')
          .send({ token: 'expired-token' });
        expect(res.status).toBe(400);
        expect(res.body.error.message).toBe('Reset token has expired');
        expect(authRepository.updateMfaResetRequest).toHaveBeenCalledWith(
          'request-id-123',
          {
            status: 'expired',
          },
        );
      });
      it('should successfully complete MFA reset and disable MFA', async () => {
        vi.mocked(
          authRepository.getMfaResetRequestByTokenHash,
        ).mockResolvedValue({
          id: 'request-id-123',
          userId: 'user-id-123',
          status: 'approved',
          expiresAt: new Date(Date.now() + 3600000), // Valid
        } as never);
        const res = await request(app)
          .post('/api/v1/auth/mfa/reset-complete')
          .send({ token: 'valid-token' });
        expect(res.status).toBe(200);
        expect(res.body.data.success).toBe(true);
        expect(authRepository.disableMfa).toHaveBeenCalledWith('user-id-123');
        expect(authRepository.updateMfaResetRequest).toHaveBeenCalledWith(
          'request-id-123',
          {
            status: 'completed',
          },
        );
      });
    });
  });
  describe('Password Reset Endpoints', () => {
    describe('POST /api/v1/auth/forgot-password', () => {
      it('should always return success message to prevent enumeration', async () => {
        vi.mocked(authRepository.getUserByEmail).mockResolvedValue(null);
        const res = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({ email: 'nonexistent@example.com' });
        expect(res.status).toBe(200);
        expect(res.body.data.message).toBe(
          'If the email exists, a password reset link has been sent.',
        );
        expect(
          authRepository.createPasswordResetRequest,
        ).not.toHaveBeenCalled();
      });
      it('should create token and send email if user exists', async () => {
        vi.mocked(authRepository.getUserByEmail).mockResolvedValue({
          id: 'user-id-1',
          email: 'user@example.com',
        } as never);
        const res = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({ email: 'user@example.com' });
        expect(res.status).toBe(200);
        expect(authRepository.createPasswordResetRequest).toHaveBeenCalled();
      });
    });
    describe('POST /api/v1/auth/reset-password', () => {
      it('should return 400 for invalid token', async () => {
        vi.mocked(
          authRepository.getPasswordResetRequestByTokenHash,
        ).mockResolvedValue(null);
        const res = await request(app)
          .post('/api/v1/auth/reset-password')
          .send({ token: 'invalid-token', password: 'newPassword123' });
        expect(res.status).toBe(400);
        expect(res.body.error.message).toBe(
          'Invalid or already used reset token',
        );
      });
      it('should update password and invalidate token on success', async () => {
        vi.mocked(
          authRepository.getPasswordResetRequestByTokenHash,
        ).mockResolvedValue({
          id: 'req-1',
          userId: 'user-id-1',
          expiresAt: new Date(Date.now() + 3600000),
          usedAt: null,
        } as never);
        const res = await request(app)
          .post('/api/v1/auth/reset-password')
          .send({ token: 'valid-token', password: 'newPassword123' });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Password reset successfully');
        expect(authRepository.updateUserPassword).toHaveBeenCalledWith(
          'user-id-1',
          'hashed-password',
        );
        expect(authRepository.updatePasswordResetRequest).toHaveBeenCalled();
      });
    });
  });
});
