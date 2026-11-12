/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import crypto from 'node:crypto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../../../../src/middlewares/global-auth.middleware', () => ({
  globalAuthMiddleware: (
    req: import('express').Request,
    _res: import('express').Response,
    next: import('express').NextFunction,
  ) => {
    req.headers['x-app-id'] = req.headers['x-app-id'] || 'HEADLESS_CMS';
    req.context = { ...req.context, applicationId: 'app-1' };
    next();
  },
}));

const RAW_VIEWER_TOKEN = 'viewer-raw-api-token-for-rbac-test';
const VIEWER_TOKEN_HASH = crypto
  .createHash('sha256')
  .update(RAW_VIEWER_TOKEN)
  .digest('hex');

const { testSchema, viewerTokenPermissions, mockDb } = vi.hoisted(() => {
  const schema = {
    id: 'schema-1',
    slug: 'blog-post',
    name: 'Blog Post',
    type: 'collection',
    status: 'published',
    version: 1,
    definition: {
      fields: [
        {
          apiId: 'title',
          displayName: 'Title',
          dataType: 'text',
          isRequired: true,
        },
        {
          apiId: 'body',
          displayName: 'Body',
          dataType: 'richtext',
        },
      ],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const viewerPerms = [
    {
      action: 'read',
      effect: 'allow',
      schemaId: 'schema-1',
      fields: null,
      condition: null,
    },
  ];

  const db = {
    select: vi.fn((fields?: Record<string, unknown>) => {
      // First query: apiTokens + leftJoin(roles)
      if (fields && 'token' in fields) {
        return {
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                  {
                    token: {
                      id: 'token-viewer-1',
                      name: 'Viewer Token',
                      applicationId: 'app-1',
                      createdBy: 'admin-creator-1',
                      roleId: 'role-viewer',
                      revokedAt: null,
                      expiresAt: null,
                    },
                    role: { id: 'role-viewer', name: 'viewer' },
                  },
                ]),
              }),
            }),
          }),
        };
      }

      // Second query: permissions for token's roleId
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(viewerPerms),
        }),
      };
    }),
  };

  return {
    testSchema: schema,
    viewerTokenPermissions: viewerPerms,
    mockDb: db,
  };
});

vi.mock('@repo/config', async (importActual) => {
  const actual = await importActual<typeof import('@repo/config')>();
  return {
    ...actual,
    getDatabaseAdapter: vi.fn().mockReturnValue({ getDb: () => mockDb }),
    getStorageAdapter: vi.fn().mockReturnValue({
      providerName: 'local',
      write: vi.fn(),
      read: vi.fn(),
      delete: vi.fn(),
    }),
    getQueue: vi.fn().mockReturnValue({ add: vi.fn() }),
  };
});

vi.mock('../../../../src/modules/auth/auth.service.js', () => ({
  authService: {
    // Creator user is a super admin in DB; API token requests must NEVER use this.
    getUserPermissions: vi.fn().mockResolvedValue([
      {
        action: '*',
        effect: 'allow',
        schemaId: null,
        fields: null,
        condition: null,
      },
    ]),
  },
}));

vi.mock('@repo/shared-db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@repo/shared-db')>();
  return {
    ...actual,
    listSchemas: vi.fn().mockResolvedValue([[testSchema], 1]),
  };
});

vi.mock('@repo/repository', () => {
  return {
    ContentRepository: vi.fn().mockImplementation(function () {
      return {
        getSchemaBySlug: vi.fn().mockResolvedValue(testSchema),
        listEntries: vi.fn().mockResolvedValue([
          {
            id: 'entry-1',
            schemaId: 'schema-1',
            status: 'published',
            data: { title: 'Published Post', body: 'Hello' },
            publishedData: { title: 'Published Post', body: 'Hello' },
          },
        ]),
        countEntries: vi.fn().mockResolvedValue(1),
        getEntryById: vi.fn(),
        createEntry: vi.fn(),
        updateEntryDraft: vi.fn(),
        publishEntry: vi.fn(),
        unpublishEntry: vi.fn(),
        deleteEntry: vi.fn(),
      };
    }),
    MediaRepository: vi.fn().mockImplementation(class {}),
    MediaFoldersRepository: vi.fn().mockImplementation(class {}),
    SchemaRepository: vi.fn().mockImplementation(class {}),
    AuditRepository: vi.fn().mockImplementation(class {}),
    AccessRepository: vi.fn().mockImplementation(class {}),
    LocalesRepository: vi.fn().mockImplementation(class {}),
    WebhooksRepository: vi.fn().mockImplementation(class {}),
    authRepository: {},
  };
});

import { createApp } from '../../../../src/app.js';
import { authService } from '../../../../src/modules/auth/auth.service.js';

describe('API Token RBAC Integration', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure mocked hash expectation stays consistent if referenced
    expect(VIEWER_TOKEN_HASH).toHaveLength(64);
  });

  it('allows read requests matching the token role permissions', async () => {
    const res = await request(app)
      .get('/api/v1/content/blog-post')
      .set('x-app-id', 'HEADLESS_CMS')
      .set('Authorization', `Bearer ${RAW_VIEWER_TOKEN}`);

    expect(res.status).toBe(200);
    expect(authService.getUserPermissions).not.toHaveBeenCalled();
  });

  it('returns 403 Forbidden for write/publish/delete REST routes when viewer token was created by an Admin', async () => {
    const headers = {
      'x-app-id': 'HEADLESS_CMS',
      Authorization: `Bearer ${RAW_VIEWER_TOKEN}`,
    };

    const postRes = await request(app)
      .post('/api/v1/content/blog-post')
      .set(headers)
      .send({ title: 'Should Fail', body: 'Blocked' });
    expect(postRes.status).toBe(403);

    const putRes = await request(app)
      .put('/api/v1/content/blog-post/entry-1')
      .set(headers)
      .send({ title: 'Should Fail', body: 'Blocked' });
    expect(putRes.status).toBe(403);

    const patchRes = await request(app)
      .patch('/api/v1/content/blog-post/entry-1')
      .set(headers)
      .send({ title: 'Should Fail' });
    expect(patchRes.status).toBe(403);

    const publishRes = await request(app)
      .post('/api/v1/content/blog-post/entry-1/publish')
      .set(headers);
    expect(publishRes.status).toBe(403);

    const deleteRes = await request(app)
      .delete('/api/v1/content/blog-post/entry-1')
      .set(headers);
    expect(deleteRes.status).toBe(403);

    const mediaPostRes = await request(app).post('/api/v1/media').set(headers);
    expect(mediaPostRes.status).toBe(403);

    const mediaDeleteRes = await request(app)
      .delete('/api/v1/media/asset-1')
      .set(headers);
    expect(mediaDeleteRes.status).toBe(403);

    expect(authService.getUserPermissions).not.toHaveBeenCalled();
  });

  it('enforces API token permissions on GraphQL mutations and /auth/me', async () => {
    const headers = {
      'x-app-id': 'HEADLESS_CMS',
      Authorization: `Bearer ${RAW_VIEWER_TOKEN}`,
    };

    const gqlRes = await request(app)
      .post('/graphql')
      .set(headers)
      .send({
        query: 'mutation($data: JSON!) { createBlogPost(data: $data) { id } }',
        variables: { data: { title: 'Blocked Mutation', body: 'No' } },
      });

    expect(gqlRes.status).toBe(200);
    expect(gqlRes.body.errors[0].extensions.code).toBe('FORBIDDEN');

    const meRes = await request(app).get('/api/v1/auth/me').set(headers);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.isApiToken).toBe(true);
    expect(meRes.body.data.permissions).toEqual(viewerTokenPermissions);

    expect(authService.getUserPermissions).not.toHaveBeenCalled();
  });
});
