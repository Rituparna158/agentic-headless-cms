import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../../src/app.js';
import jwt from 'jsonwebtoken';
import { env } from '../../../../src/config/env.js';

vi.mock('../../../../src/modules/access/access.service.js', () => {
  const AccessService = vi.fn();
  AccessService.prototype.listRoles = vi
    .fn()
    .mockResolvedValue([{ id: '1', name: 'Admin', permissions: [] }]);
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
    .mockResolvedValue([{ id: 'u1', email: 'test@example.com' }]);
  AccessService.prototype.listTokens = vi
    .fn()
    .mockResolvedValue([{ id: 't1', name: 'Test Token' }]);
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
      const res = await request(app).get('/api/v1/access/roles');
      expect(res.status).toBe(401);
    });

    it('should reject non-admin users', async () => {
      const res = await request(app)
        .get('/api/v1/access/roles')
        .set('Cookie', [`token=${nonAdminToken}`]);
      expect(res.status).toBe(403);
    });

    it('should return roles list', async () => {
      const res = await request(app)
        .get('/api/v1/access/roles')
        .set('Cookie', [`token=${validToken}`]);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Admin');
    });
  });

  describe('POST /api/v1/access/roles', () => {
    it('should reject non-admin users', async () => {
      const res = await request(app)
        .post('/api/v1/access/roles')
        .set('Cookie', [`token=${nonAdminToken}`])
        .send({ name: 'Editor', permissions: [] });
      expect(res.status).toBe(403);
    });

    it('should create a role for an admin', async () => {
      const res = await request(app)
        .post('/api/v1/access/roles')
        .set('Cookie', [`token=${validToken}`])
        .send({ name: 'Editor', permissions: [] });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Editor');
    });
  });

  describe('POST /api/v1/access/users/invite', () => {
    it('should reject non-admin users', async () => {
      const res = await request(app)
        .post('/api/v1/access/users/invite')
        .set('Cookie', [`token=${nonAdminToken}`])
        .send({ email: 'invitee@example.com', roleId: 'role-1' });
      expect(res.status).toBe(403);
    });

    it('should reject a request missing email or roleId', async () => {
      const res = await request(app)
        .post('/api/v1/access/users/invite')
        .set('Cookie', [`token=${validToken}`])
        .send({ email: 'invitee@example.com' });
      expect(res.status).toBe(400);
    });

    it('should invite a user and return the invite URL', async () => {
      const res = await request(app)
        .post('/api/v1/access/users/invite')
        .set('Cookie', [`token=${validToken}`])
        .send({ email: 'invitee@example.com', roleId: 'role-1' });

      expect(res.status).toBe(201);
      expect(res.body.inviteUrl).toContain('token=abc123');
      expect(res.body.user.email).toBe('invitee@example.com');
    });
  });

  describe('POST /api/v1/access/tokens', () => {
    it('should reject non-admin users', async () => {
      const res = await request(app)
        .post('/api/v1/access/tokens')
        .set('Cookie', [`token=${nonAdminToken}`])
        .send({ name: 'My Token' });
      expect(res.status).toBe(403);
    });

    it('should return the raw token upon creation', async () => {
      const res = await request(app)
        .post('/api/v1/access/tokens')
        .set('Cookie', [`token=${validToken}`])
        .send({ name: 'My Token' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('New Token');
      expect(res.body.rawToken).toBe('abc');
    });
  });

  describe('DELETE /api/v1/access/tokens/:id', () => {
    it('should reject non-admin users', async () => {
      const res = await request(app)
        .delete('/api/v1/access/tokens/t1')
        .set('Cookie', [`token=${nonAdminToken}`]);
      expect(res.status).toBe(403);
    });

    it('should revoke the token for an admin', async () => {
      const res = await request(app)
        .delete('/api/v1/access/tokens/t1')
        .set('Cookie', [`token=${validToken}`]);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
