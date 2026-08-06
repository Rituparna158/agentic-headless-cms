/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../../src/app.js';
import { env } from '@repo/config';
import { authService } from '../../../../src/modules/auth/auth.service.js';

const { testAsset } = vi.hoisted(() => ({
  testAsset: {
    id: 'asset-1',
    filename: 'photo.png',
    mimeType: 'image/png',
    sizeBytes: 5,
    width: 64,
    height: 32,
    url: '/media/file/abc-photo.png',
    altText: null,
    metadata: { storageKey: 'abc-photo.png' },
    storageProvider: 'local',
    folderId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
}));

vi.mock('../../../../src/modules/auth/auth.service.js', () => ({
  authService: { getUserPermissions: vi.fn() },
}));

vi.mock('@repo/repository', () => ({
  MediaRepository: vi.fn().mockImplementation(function () {
    return {
      create: vi.fn().mockResolvedValue(testAsset),
      findById: vi.fn().mockResolvedValue(testAsset),
      findByStorageKey: vi.fn().mockResolvedValue(testAsset),
      list: vi.fn().mockResolvedValue({ assets: [testAsset], total: 1 }),
      softDelete: vi.fn().mockResolvedValue(testAsset),
    };
  }),
  MediaFoldersRepository: vi.fn().mockImplementation(class {}),
  ContentRepository: vi.fn().mockImplementation(class {}),
  SchemaRepository: vi.fn().mockImplementation(class {}),
  AuditRepository: vi.fn().mockImplementation(class {}),
  AccessRepository: vi.fn().mockImplementation(class {}),
  LocalesRepository: vi.fn().mockImplementation(class {}),
  WebhooksRepository: vi.fn().mockImplementation(class {}),
  authRepository: {},
}));

const { mockQueueAdd, mockStorageWrite, mockStorageRead, mockStorageDelete } =
  vi.hoisted(() => ({
    mockQueueAdd: vi.fn(),
    mockStorageWrite: vi.fn().mockResolvedValue({
      url: '/media/file/abc-photo.png',
      key: 'abc-photo.png',
    }),
    mockStorageRead: vi.fn().mockResolvedValue(Buffer.from('fake-image-bytes')),
    mockStorageDelete: vi.fn().mockResolvedValue(undefined),
  }));

vi.mock('@repo/config', async (importActual) => {
  const actual = await importActual<typeof import('@repo/config')>();
  return {
    ...actual,
    getStorageAdapter: vi.fn().mockReturnValue({
      providerName: 'local',
      write: mockStorageWrite,
      read: mockStorageRead,
      delete: mockStorageDelete,
    }),
    getQueue: vi.fn().mockReturnValue({ add: mockQueueAdd }),
  };
});

function makeToken(): string {
  return jwt.sign(
    {
      id: 'user-1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      roles: ['admin'],
    },
    env.JWT_SECRET,
  );
}

describe('Media API', () => {
  const app = createApp();
  let token: string;

  beforeEach(() => {
    vi.clearAllMocks();
    token = makeToken();
    vi.mocked(authService.getUserPermissions).mockResolvedValue([
      {
        action: '*',
        effect: 'allow',
        schemaId: null,
        fields: null,
        condition: null,
      },
    ]);
  });

  describe('POST /api/v1/media', () => {
    it('returns 401 with no auth token', async () => {
      const res = await request(app)
        .post('/api/v1/media')
        .attach('file', Buffer.from('x'), 'photo.png');

      expect(res.status).toBe(401);
    });

    it('returns 400 when no file is attached', async () => {
      const res = await request(app)
        .post('/api/v1/media')
        .set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(400);
    });

    it('uploads a file and returns 201 with the created asset', async () => {
      const res = await request(app)
        .post('/api/v1/media')
        .set('Cookie', [`token=${token}`])
        .attach('file', Buffer.from('fake-png-bytes'), 'photo.png');

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe('asset-1');
    });

    it('enqueues a thumbnail-generation job for the uploaded asset', async () => {
      await request(app)
        .post('/api/v1/media')
        .set('Cookie', [`token=${token}`])
        .attach('file', Buffer.from('fake-png-bytes'), 'photo.png');

      await vi.waitFor(() => {
        expect(mockQueueAdd).toHaveBeenCalledWith('generate-thumbnail', {
          assetId: 'asset-1',
          storageKey: 'abc-photo.png',
          mimeType: 'image/png',
        });
      });
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
        .post('/api/v1/media')
        .set('Cookie', [`token=${token}`])
        .attach('file', Buffer.from('x'), 'photo.png');

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/media', () => {
    it('lists assets with pagination metadata', async () => {
      const res = await request(app)
        .get('/api/v1/media')
        .set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.data).toHaveLength(1);
      expect(res.body.data.meta.pagination.total).toBe(1);
    });
  });

  describe('GET /api/v1/media/:id', () => {
    it('returns the asset metadata', async () => {
      const res = await request(app)
        .get('/api/v1/media/asset-1')
        .set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('asset-1');
    });
  });

  describe('GET /api/v1/media/file/:key', () => {
    it('streams the file bytes with the correct Content-Type', async () => {
      const res = await request(app)
        .get('/api/v1/media/file/abc-photo.png')
        .set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('image/png');
    });

    it('rejects an invalid resize query param', async () => {
      const res = await request(app)
        .get('/api/v1/media/file/abc-photo.png?w=notanumber')
        .set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/media/:id', () => {
    it('deletes the asset and returns 204', async () => {
      const res = await request(app)
        .delete('/api/v1/media/asset-1')
        .set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(204);
    });

    it('returns 403 when the user lacks the delete permission', async () => {
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
        .delete('/api/v1/media/asset-1')
        .set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(403);
    });
  });
});
