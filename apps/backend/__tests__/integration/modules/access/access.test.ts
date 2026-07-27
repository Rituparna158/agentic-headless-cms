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
  return { AccessService };
});

describe('Access Module', () => {
  const app = createApp();

  // Create a dummy token to pass auth middleware
  const validToken = jwt.sign(
    { id: 'user-1', email: 'admin@example.com', roles: ['admin'] },
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

    it('should return roles list', async () => {
      const res = await request(app)
        .get('/api/v1/access/roles')
        .set('Cookie', [`token=${validToken}`]);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Admin');
    });
  });

  describe('POST /api/v1/access/tokens', () => {
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
});
