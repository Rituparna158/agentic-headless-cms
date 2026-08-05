import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../../src/app.js';
import jwt from 'jsonwebtoken';
import { env } from '@repo/config';
import { ERROR_MESSAGES } from '@repo/constants';
import { LocalesService } from '../../../../src/modules/locales/locales.service.js';

vi.mock('../../../../src/modules/locales/locales.service.js', () => {
  const LocalesService = vi.fn();
  LocalesService.prototype.list = vi
    .fn()
    .mockResolvedValue([
      { id: 'l1', code: 'en', name: 'English', isDefault: true },
    ]);
  LocalesService.prototype.create = vi.fn().mockResolvedValue({
    id: 'l2',
    code: 'fr-FR',
    name: 'French',
    isDefault: false,
  });
  LocalesService.prototype.delete = vi.fn().mockResolvedValue({ id: 'l1' });
  return { LocalesService };
});

describe('Locales Module', () => {
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

  describe('GET /api/v1/locales', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/v1/locales');
      expect(res.status).toBe(401);
    });

    it('should reject non-admin users', async () => {
      const res = await request(app)
        .get('/api/v1/locales')
        .set('Cookie', [`token=${nonAdminToken}`]);
      expect(res.status).toBe(403);
    });

    it('should return the locales list', async () => {
      const res = await request(app)
        .get('/api/v1/locales')
        .set('Cookie', [`token=${adminToken}`]);
      expect(res.status).toBe(200);
      expect(res.body.data[0].code).toBe('en');
    });
  });

  describe('POST /api/v1/locales', () => {
    it('should reject a request missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/locales')
        .set('Cookie', [`token=${adminToken}`])
        .send({ code: 'fr-FR' });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe(
        ERROR_MESSAGES.LOCALES.CODE_NAME_REQUIRED,
      );
    });

    it('should create a locale', async () => {
      const res = await request(app)
        .post('/api/v1/locales')
        .set('Cookie', [`token=${adminToken}`])
        .send({ code: 'fr-FR', name: 'French' });
      expect(res.status).toBe(201);
      expect(res.body.data.code).toBe('fr-FR');
    });

    it('should return 409 when the code already exists', async () => {
      vi.mocked(LocalesService.prototype.create).mockRejectedValueOnce(
        new Error(ERROR_MESSAGES.LOCALES.CODE_ALREADY_EXISTS),
      );

      const res = await request(app)
        .post('/api/v1/locales')
        .set('Cookie', [`token=${adminToken}`])
        .send({ code: 'en', name: 'English (again)' });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toBe(
        ERROR_MESSAGES.LOCALES.CODE_ALREADY_EXISTS,
      );
    });

    it('should reject non-admin users', async () => {
      const res = await request(app)
        .post('/api/v1/locales')
        .set('Cookie', [`token=${nonAdminToken}`])
        .send({ code: 'fr-FR', name: 'French' });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/locales/:id', () => {
    it('should reject non-admin users', async () => {
      const res = await request(app)
        .delete('/api/v1/locales/l1')
        .set('Cookie', [`token=${nonAdminToken}`]);
      expect(res.status).toBe(403);
    });

    it('should delete a locale', async () => {
      const res = await request(app)
        .delete('/api/v1/locales/l1')
        .set('Cookie', [`token=${adminToken}`]);
      expect(res.status).toBe(204);
    });
  });
});
