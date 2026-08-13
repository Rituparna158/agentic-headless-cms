import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../../src/app.js';
import { env } from '@repo/config';
import { authService } from '../../../../src/modules/auth/auth.service.js';
import { createSchema, listSchemas, updateSchema } from '@repo/shared-db';

vi.mock('../../../../src/modules/auth/auth.service.js', () => ({
  authService: {
    getUserPermissions: vi.fn(),
  },
}));

vi.mock('@repo/shared-db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@repo/shared-db')>();
  return {
    ...actual,
    createSchema: vi.fn(),
    listSchemas: vi.fn(),
    updateSchema: vi.fn(),
    getSchemaById: vi.fn(),
  };
});

const userPayload = {
  id: 'user-1',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  roles: ['admin'],
};

function authCookie() {
  const token = jwt.sign(userPayload, env.JWT_SECRET);
  return [`token_default=${token}`];
}

const validFields = [
  {
    apiId: 'title',
    displayName: 'Title',
    dataType: 'text',
    isRequired: true,
    isUnique: false,
    isLocalized: false,
    isRepeatable: false,
    sortOrder: 0,
  },
];

describe('Schemas Module', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/schemas', () => {
    it('returns 401 with no auth token', async () => {
      const res = await request(app).post('/api/v1/schemas').send({
        name: 'Article',
        slug: 'article',
        type: 'collection',
        fields: validFields,
      });

      expect(res.status).toBe(401);
    });

    it('returns 403 when the user lacks the create permission', async () => {
      vi.mocked(authService.getUserPermissions).mockResolvedValue([
        {
          action: 'read',
          effect: 'allow',
          schemaId: null,
          fields: null,
          condition: null,
        },
      ]);

      const res = await request(app)
        .post('/api/v1/schemas')
        .set('Cookie', authCookie())
        .send({
          name: 'Article',
          slug: 'article',
          type: 'collection',
          fields: validFields,
        });

      expect(res.status).toBe(403);
    });

    it('returns 400 for an invalid payload without reaching the service', async () => {
      vi.mocked(authService.getUserPermissions).mockResolvedValue([
        {
          action: '*',
          effect: 'allow',
          schemaId: null,
          fields: null,
          condition: null,
        },
      ]);

      const res = await request(app)
        .post('/api/v1/schemas')
        .set('Cookie', authCookie())
        .send({ name: '', slug: 'Bad Slug', type: 'collection', fields: [] });

      expect(res.status).toBe(400);
      expect(createSchema).not.toHaveBeenCalled();
    });

    it('creates a schema and returns 201 for a valid, authorized request', async () => {
      vi.mocked(authService.getUserPermissions).mockResolvedValue([
        {
          action: '*',
          effect: 'allow',
          schemaId: null,
          fields: null,
          condition: null,
        },
      ]);
      const created = {
        id: 'schema-1',
        name: 'Article',
        slug: 'article',
        type: 'collection',
        definition: { fields: validFields },
        status: 'draft',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      vi.mocked(createSchema).mockResolvedValue(created as never);

      const res = await request(app)
        .post('/api/v1/schemas')
        .set('Cookie', authCookie())
        .send({
          name: 'Article',
          slug: 'article',
          type: 'collection',
          fields: validFields,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe('schema-1');
      expect(createSchema).toHaveBeenCalledTimes(1);
      const [, input] = vi.mocked(createSchema).mock.calls[0]!;
      expect(input).toMatchObject({
        name: 'Article',
        slug: 'article',
        type: 'collection',
        createdByUserId: 'user-1',
      });
    });
  });

  describe('GET /api/v1/schemas', () => {
    it('returns 401 with no auth token', async () => {
      const res = await request(app).get('/api/v1/schemas');
      expect(res.status).toBe(401);
    });

    it('returns the list of schemas for an authorized request', async () => {
      vi.mocked(authService.getUserPermissions).mockResolvedValue([
        {
          action: 'read',
          effect: 'allow',
          schemaId: null,
          fields: null,
          condition: null,
        },
      ]);
      vi.mocked(listSchemas).mockResolvedValue([
        [{ id: 'schema-1', name: 'Article' } as never],
        1,
      ]);

      const res = await request(app)
        .get('/api/v1/schemas')
        .set('Cookie', authCookie());

      expect(res.status).toBe(200);
      expect(res.body.data.data).toHaveLength(1);
      expect(res.body.data.data[0].id).toBe('schema-1');
    });
  });

  describe('PUT /api/v1/schemas/:id', () => {
    it('returns 403 when the user lacks the update permission', async () => {
      vi.mocked(authService.getUserPermissions).mockResolvedValue([
        {
          action: 'read',
          effect: 'allow',
          schemaId: null,
          fields: null,
          condition: null,
        },
      ]);

      const res = await request(app)
        .put('/api/v1/schemas/schema-1')
        .set('Cookie', authCookie())
        .send({ name: 'Updated Article' });

      expect(res.status).toBe(403);
    });

    it('returns 400 when neither name nor fields are provided', async () => {
      vi.mocked(authService.getUserPermissions).mockResolvedValue([
        {
          action: '*',
          effect: 'allow',
          schemaId: null,
          fields: null,
          condition: null,
        },
      ]);

      const res = await request(app)
        .put('/api/v1/schemas/schema-1')
        .set('Cookie', authCookie())
        .send({});

      expect(res.status).toBe(400);
      expect(updateSchema).not.toHaveBeenCalled();
    });

    it('updates a schema and returns 200 for a valid, authorized request', async () => {
      vi.mocked(authService.getUserPermissions).mockResolvedValue([
        {
          action: '*',
          effect: 'allow',
          schemaId: null,
          fields: null,
          condition: null,
        },
      ]);
      const beforeState = {
        id: 'schema-1',
        name: 'Article',
        slug: 'article',
        type: 'collection',
        definition: { fields: validFields },
        status: 'draft',
        version: 1,
      };

      const { getSchemaById } = await import('@repo/shared-db');
      vi.mocked(getSchemaById).mockResolvedValue(beforeState as never);

      const updated = {
        id: 'schema-1',
        name: 'Updated Article',
        slug: 'article',
        type: 'collection',
        definition: { fields: validFields },
        status: 'draft',
        version: 2,
      };
      vi.mocked(updateSchema).mockResolvedValue(updated as never);

      const res = await request(app)
        .put('/api/v1/schemas/schema-1')
        .set('Cookie', authCookie())
        .send({ name: 'Updated Article' });

      expect(res.status).toBe(200);
      expect(res.body.data.version).toBe(2);
      expect(updateSchema).toHaveBeenCalledWith(
        expect.anything(),
        'schema-1',
        expect.objectContaining({
          name: 'Updated Article',
          createdByUserId: 'user-1',
        }),
      );
    });
  });
});
