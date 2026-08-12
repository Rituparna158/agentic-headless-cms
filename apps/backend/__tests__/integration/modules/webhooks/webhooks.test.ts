import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../../src/app.js';
import jwt from 'jsonwebtoken';
import { env } from '@repo/config';

vi.mock('../../../../src/modules/webhooks/webhooks.service.js', () => {
  const WebhooksService = vi.fn();
  WebhooksService.prototype.list = vi.fn().mockResolvedValue([
    [
      {
        id: 'w1',
        name: 'ISR Rebuild',
        url: 'https://example.com/hook',
        events: ['content.published'],
      },
    ],
    1,
  ]);
  WebhooksService.prototype.create = vi.fn().mockResolvedValue({
    id: 'w2',
    name: 'New Hook',
    url: 'https://example.com/new',
    events: ['content.published'],
    secretKey: 'abc123',
  });
  WebhooksService.prototype.delete = vi.fn().mockResolvedValue({ id: 'w1' });
  return { WebhooksService };
});

describe('Webhooks Module', () => {
  const app = createApp();

  const adminToken = jwt.sign(
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

  describe('GET /api/v1/webhooks', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/v1/webhooks');
      expect(res.status).toBe(401);
    });

    it('should reject non-admin users', async () => {
      const res = await request(app)
        .get('/api/v1/webhooks')
        .set('Cookie', [`token=${nonAdminToken}`]);
      expect(res.status).toBe(403);
    });

    it('should return the webhooks list for admins', async () => {
      const res = await request(app)
        .get('/api/v1/webhooks')
        .set('Cookie', [`token=${adminToken}`]);
      expect(res.status).toBe(200);
      expect(res.body.data.data).toHaveLength(1);
      expect(res.body.data.data[0].name).toBe('ISR Rebuild');
    });
  });

  describe('POST /api/v1/webhooks', () => {
    it('should reject a request missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/webhooks')
        .set('Cookie', [`token=${adminToken}`])
        .send({ name: 'Incomplete' });
      expect(res.status).toBe(400);
    });

    it('should create a webhook and return a generated secret', async () => {
      const res = await request(app)
        .post('/api/v1/webhooks')
        .set('Cookie', [`token=${adminToken}`])
        .send({
          name: 'New Hook',
          url: 'https://example.com/new',
          events: ['content.published'],
        });
      expect(res.status).toBe(201);
      expect(res.body.data.secretKey).toBe('abc123');
    });
  });

  describe('DELETE /api/v1/webhooks/:id', () => {
    it('should delete a webhook', async () => {
      const res = await request(app)
        .delete('/api/v1/webhooks/w1')
        .set('Cookie', [`token=${adminToken}`]);
      expect(res.status).toBe(204);
    });
  });
});
