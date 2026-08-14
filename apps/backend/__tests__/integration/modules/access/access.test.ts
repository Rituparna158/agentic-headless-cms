import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../../src/app.js';
import jwt from 'jsonwebtoken';

vi.mock('../../../../src/modules/schemas/schema.service.js', () => ({
  schemaService: {
    getBySlug: vi
      .fn()
      .mockResolvedValue({ id: 'schema-id', slug: 'mock-slug' }),
  },
}));
import { env } from '@repo/config';

vi.mock('../../../../src/modules/auth/auth.service.js', () => ({
  authService: {
    getUserPermissions: vi.fn().mockImplementation(async (userId) => {
      if (userId === 'user-1') {
        return [{ action: '*', schemaId: null, effect: 'allow' }];
      }
      return [];
    }),
  },
}));

vi.mock('../../../../src/modules/access/access.service.js', () => {
  const AccessService = vi.fn();
  AccessService.prototype.listRoles = vi
    .fn()
    .mockResolvedValue([[{ id: '1', name: 'Admin', permissions: [] }], 1]);
  AccessService.prototype.getRole = vi
    .fn()
    .mockResolvedValue({ id: '1', name: 'Admin', permissions: [] });
  AccessService.prototype.createRole = vi
    .fn()
    .mockResolvedValue({ id: '2', name: 'Editor', permissions: [] });
  AccessService.prototype.updateRole = vi
    .fn()
    .mockResolvedValue({ id: '1', name: 'Admin Updated', permissions: [] });
  AccessService.prototype.deleteRole = vi.fn().mockResolvedValue({ id: '1' });
  AccessService.prototype.listUsers = vi
    .fn()
    .mockResolvedValue([[{ id: 'u1', email: 'test@example.com' }], 1]);
  AccessService.prototype.listTokens = vi
    .fn()
    .mockResolvedValue([[{ id: 't1', name: 'Test Token' }], 1]);
  AccessService.prototype.createToken = vi
    .fn()
    .mockResolvedValue({ id: 't2', name: 'New Token', rawToken: 'abc' });
  AccessService.prototype.revokeToken = vi
    .fn()
    .mockResolvedValue({ success: true });
  AccessService.prototype.inviteUser = vi.fn().mockResolvedValue({
    inviteUrl: 'http://localhost:3001/accept-invite?token=abc123',
    user: { id: 'u2', email: 'invitee@example.com', status: 'invited' },
  });
  AccessService.prototype.listMfaRequests = vi
    .fn()
    .mockResolvedValue([{ id: 'req-1', status: 'pending' }]);
  AccessService.prototype.approveMfaResetRequest = vi
    .fn()
    .mockResolvedValue({ success: true });
  AccessService.prototype.rejectMfaResetRequest = vi
    .fn()
    .mockResolvedValue({ success: true });
  return { AccessService };
});

describe('Access Module', () => {
  const app = createApp();

  // Create a dummy token to pass auth middleware
  const validToken = jwt.sign(
    { id: 'user-1', email: 'admin@example.com', roles: ['admin'] },
    env.JWT_SECRET,
  );
  const nonAdminToken = jwt.sign(
    { id: 'user-2', email: 'editor@example.com', roles: ['editor'] },
    env.JWT_SECRET,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/access/roles', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/access/roles')
        .set('x-app-id', 'HEADLESS_CMS');
      expect(res.status).toBe(401);
    });

    it('should reject non-admin users', async () => {
      const res = await request(app)
        .get('/api/v1/access/roles')
        .set('Cookie', [`token_headless_cms=${nonAdminToken}`])
        .set('x-app-id', 'HEADLESS_CMS');
      expect(res.status).toBe(403);
    });

    it('should return roles list', async () => {
      const res = await request(app)
        .get('/api/v1/access/roles')
        .set('Cookie', [`token_headless_cms=${validToken}`])
        .set('x-app-id', 'HEADLESS_CMS');
      if (res.status === 500) console.error('ERROR 500 BODY: ', res.body);
      expect(res.status).toBe(200);
      expect(res.body.data.data).toHaveLength(1);
      expect(res.body.data.data[0].name).toBe('Admin');
    });
  });

  describe('POST /api/v1/access/roles', () => {
    it('should reject non-admin users', async () => {
      const res = await request(app)
        .post('/api/v1/access/roles')
        .set('Cookie', [`token_default=${nonAdminToken}`])
        .send({ name: 'Editor', permissions: [] });
      expect(res.status).toBe(403);
    });

    it('should create a role for an admin', async () => {
      const res = await request(app)
        .post('/api/v1/access/roles')
        .set('Cookie', [`token_default=${validToken}`])
        .send({ name: 'Editor', permissions: [] });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Editor');
    });
  });

  describe('POST /api/v1/access/users/invite', () => {
    it('should reject non-admin users', async () => {
      const res = await request(app)
        .post('/api/v1/access/users/invite')
        .set('Cookie', [`token_default=${nonAdminToken}`])
        .send({ email: 'invitee@example.com', roleId: 'role-1' });
      expect(res.status).toBe(403);
    });

    it('should reject a request missing email or roleId', async () => {
      const res = await request(app)
        .post('/api/v1/access/users/invite')
        .set('Cookie', [`token_default=${validToken}`])
        .send({ email: 'invitee@example.com' });
      expect(res.status).toBe(400);
    });

    it('should invite a user and return the invite URL', async () => {
      const res = await request(app)
        .post('/api/v1/access/users/invite')
        .set('Cookie', [`token_default=${validToken}`])
        .send({ email: 'invitee@example.com', roleId: 'role-1' });

      expect(res.status).toBe(201);
      expect(res.body.data.inviteUrl).toContain('token=abc123');
      expect(res.body.data.user.email).toBe('invitee@example.com');
    });
  });

  describe('POST /api/v1/access/tokens', () => {
    it('should reject non-admin users', async () => {
      const res = await request(app)
        .post('/api/v1/access/tokens')
        .set('Cookie', [`token_default=${nonAdminToken}`])
        .send({ name: 'My Token' });
      expect(res.status).toBe(403);
    });

    it('should return the raw token upon creation', async () => {
      const res = await request(app)
        .post('/api/v1/access/tokens')
        .set('Cookie', [`token_default=${validToken}`])
        .send({ name: 'My Token' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('New Token');
      expect(res.body.data.rawToken).toBe('abc');
    });
  });

  describe('DELETE /api/v1/access/tokens/:id', () => {
    it('should reject non-admin users', async () => {
      const res = await request(app)
        .delete('/api/v1/access/tokens/t1')
        .set('Cookie', [`token_default=${nonAdminToken}`]);
      expect(res.status).toBe(403);
    });

    it('should revoke the token for an admin', async () => {
      const res = await request(app)
        .delete('/api/v1/access/tokens/t1')
        .set('Cookie', [`token_default=${validToken}`]);
      if (res.status === 500) console.error('ERROR 500 BODY: ', res.body);
      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
    });
  });

  describe('GET /api/v1/access/mfa-requests', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/v1/access/mfa-requests');
      expect(res.status).toBe(401);
    });

    it('should reject non-admin users', async () => {
      const res = await request(app)
        .get('/api/v1/access/mfa-requests')
        .set('Cookie', [`token_default=${nonAdminToken}`]);
      expect(res.status).toBe(403);
    });

    it('should return pending MFA reset requests for an admin', async () => {
      const res = await request(app)
        .get('/api/v1/access/mfa-requests')
        .set('Cookie', [`token_default=${validToken}`]);
      if (res.status === 500) console.error('ERROR 500 BODY: ', res.body);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe('req-1');
    });
  });

  describe('POST /api/v1/access/mfa-requests/:id/approve', () => {
    it('should reject non-admin users', async () => {
      const res = await request(app)
        .post('/api/v1/access/mfa-requests/req-1/approve')
        .set('Cookie', [`token_default=${nonAdminToken}`]);
      expect(res.status).toBe(403);
    });

    it('should successfully approve the request for an admin', async () => {
      const res = await request(app)
        .post('/api/v1/access/mfa-requests/req-1/approve')
        .set('Cookie', [`token_default=${validToken}`]);
      if (res.status === 500) console.error('ERROR 500 BODY: ', res.body);
      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
    });
  });

  describe('POST /api/v1/access/mfa-requests/:id/reject', () => {
    it('should reject non-admin users', async () => {
      const res = await request(app)
        .post('/api/v1/access/mfa-requests/req-1/reject')
        .set('Cookie', [`token_default=${nonAdminToken}`]);
      expect(res.status).toBe(403);
    });

    it('should successfully reject the request for an admin', async () => {
      const res = await request(app)
        .post('/api/v1/access/mfa-requests/req-1/reject')
        .set('Cookie', [`token_default=${validToken}`]);
      if (res.status === 500) console.error('ERROR 500 BODY: ', res.body);
      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
    });
  });
});
