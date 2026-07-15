import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../src/app.js';
import jwt from 'jsonwebtoken';
import { env } from '../../../src/config/env.js';
import { authService } from '../../../src/modules/auth/auth.service.js';

vi.mock('../../../src/modules/auth/auth.service.js', () => ({
  authService: {
    getUserPermissions: vi.fn(),
  },
}));

vi.mock('../../../src/modules/content/content.repository.js', () => {
  return {
    ContentRepository: vi.fn().mockImplementation(function () {
      return {
        getSchemaBySlug: vi.fn().mockResolvedValue({
          id: 'schema-1',
          slug: 'blog-post',
          definition: {
            fields: [
              {
                apiId: 'title',
                dataType: 'text',
                isRequired: true,
              },
              {
                apiId: 'body',
                dataType: 'richtext',
              },
              {
                apiId: 'author',
                dataType: 'text',
              },
            ],
          },
        }),
        listEntries: vi.fn().mockResolvedValue([]),
        countEntries: vi.fn().mockResolvedValue(0),
        getEntryById: vi.fn().mockResolvedValue({
          id: 'entry-1',
          status: 'draft',
          data: {
            title: 'Test Post',
            body: 'This is a test post body',
            author: 'Tester',
          },
        }),
        createEntry: vi.fn().mockResolvedValue({
          entryId: 'entry-1',
          localization: {
            status: 'draft',
            data: {
              title: 'Test Post',
              body: 'This is a test post body',
              author: 'Tester',
            },
          },
        }),
        updateEntryDraft: vi.fn().mockResolvedValue({
          status: 'draft',
          data: {
            title: 'Updated Post',
            body: 'This is an updated body',
            author: 'Tester',
          },
        }),
        publishEntry: vi.fn().mockResolvedValue({
          status: 'published',
          publishedData: {
            title: 'Updated Post',
            body: 'This is an updated body',
            author: 'Tester',
          },
        }),
        revertEntry: vi.fn().mockResolvedValue({
          status: 'draft',
          data: {
            title: 'Test Post',
            body: 'This is a test post body',
            author: 'Tester',
          },
        }),
        deleteEntry: vi.fn().mockResolvedValue({ id: 'entry-1' }),
      };
    }),
  };
});

describe('Content API', () => {
  const app = createApp();
  let adminToken: string;
  const testSchemaSlug = 'blog-post';
  const createdEntryId = 'entry-1';

  beforeEach(() => {
    vi.clearAllMocks();

    // Generate admin token
    adminToken = jwt.sign(
      {
        id: 'test-admin',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
      },
      env.JWT_SECRET,
    );

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

  it('should list content entries (empty)', async () => {
    const res = await request(app)
      .get(`/api/v1/content/${testSchemaSlug}`)
      .set('Cookie', [`token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should create a new content draft', async () => {
    const payload = {
      title: 'Test Post',
      body: 'This is a test post body',
      author: 'Tester',
    };

    const res = await request(app)
      .post(`/api/v1/content/${testSchemaSlug}`)
      .set('Cookie', [`token=${adminToken}`])
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.localization.status).toBe('draft');
    expect(res.body.data.localization.data.title).toBe(payload.title);
  });

  it('should get the created entry', async () => {
    const res = await request(app)
      .get(`/api/v1/content/${testSchemaSlug}/${createdEntryId}`)
      .set('Cookie', [`token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdEntryId);
  });

  it('should update the draft', async () => {
    const payload = {
      title: 'Updated Post',
      body: 'This is an updated body',
      author: 'Tester',
    };

    const res = await request(app)
      .put(`/api/v1/content/${testSchemaSlug}/${createdEntryId}`)
      .set('Cookie', [`token=${adminToken}`])
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.data.title).toBe(payload.title);
  });

  it('should publish the entry', async () => {
    const res = await request(app)
      .post(`/api/v1/content/${testSchemaSlug}/${createdEntryId}/publish`)
      .set('Cookie', [`token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('published');
    expect(res.body.data.publishedData.title).toBe('Updated Post');
  });

  it('should revert the entry to a previous version', async () => {
    const res = await request(app)
      .post(`/api/v1/content/${testSchemaSlug}/${createdEntryId}/revert`)
      .set('Cookie', [`token=${adminToken}`])
      .send({ versionNo: 1 });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.data.title).toBe('Test Post'); // Version 1 had "Test Post"
  });

  it('should delete the entry', async () => {
    const res = await request(app)
      .delete(`/api/v1/content/${testSchemaSlug}/${createdEntryId}`)
      .set('Cookie', [`token=${adminToken}`]);

    expect(res.status).toBe(204);
  });
});
