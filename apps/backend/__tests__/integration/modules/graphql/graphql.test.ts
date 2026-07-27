import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../../src/app.js';
import { env } from '../../../../src/config/env.js';
import { authService } from '../../../../src/modules/auth/auth.service.js';

// vi.mock() factories are hoisted above top-level const declarations, so
// the fixture they reference has to be created via vi.hoisted() instead of
// a plain const — otherwise the mock factory runs before testSchema exists.
const { testSchema } = vi.hoisted(() => ({
  testSchema: {
    id: 'schema-1',
    slug: 'blog-post',
    name: 'Blog Post',
    type: 'collection',
    status: 'draft',
    version: 1,
    definition: {
      fields: [
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
        {
          apiId: 'views',
          displayName: 'Views',
          dataType: 'number',
          isRequired: false,
          isUnique: false,
          isLocalized: false,
          isRepeatable: false,
          sortOrder: 1,
        },
      ],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
}));

vi.mock('../../../../src/modules/auth/auth.service.js', () => ({
  authService: {
    getUserPermissions: vi.fn(),
  },
}));

vi.mock('@repo/shared-db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@repo/shared-db')>();
  return {
    ...actual,
    listSchemas: vi.fn().mockResolvedValue([testSchema]),
  };
});

vi.mock('../../../../src/modules/content/content.repository.js', () => {
  return {
    ContentRepository: vi.fn().mockImplementation(function () {
      return {
        listEntries: vi.fn().mockResolvedValue([
          {
            id: 'entry-1',
            status: 'draft',
            data: { title: 'Post 1', views: 10 },
            publishedData: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
        countEntries: vi.fn().mockResolvedValue(1),
        getEntryById: vi.fn().mockResolvedValue({
          id: 'entry-1',
          schemaId: 'schema-1',
          status: 'draft',
          data: { title: 'Post 1', views: 10 },
          publishedData: null,
        }),
        createEntry: vi.fn().mockResolvedValue({
          id: 'entry-1',
          schemaId: 'schema-1',
          status: 'draft',
          data: { title: 'Post 1', views: 10 },
          publishedData: null,
        }),
      };
    }),
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

describe('GraphQL API', () => {
  // Fresh app per test — the Apollo server is cached at module scope inside
  // graphql.router.ts, keyed by that module's first call, so tests share
  // whichever schema was built by the first request across the whole file.
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

  it('returns 401 with no auth token', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({ query: '{ _ping }' });

    expect(res.status).toBe(401);
  });

  it('generates a query field for each schema and returns matching entries', async () => {
    const res = await request(app)
      .post('/graphql')
      .set('Cookie', [`token=${token}`])
      .send({
        query: '{ blogPosts { data { id title views } meta { total } } }',
      });

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.blogPosts.data).toEqual([
      { id: 'entry-1', title: 'Post 1', views: 10 },
    ]);
    expect(res.body.data.blogPosts.meta.total).toBe(1);
  });

  it('fetches a single entry by id', async () => {
    const res = await request(app)
      .post('/graphql')
      .set('Cookie', [`token=${token}`])
      .send({
        query: '{ blogPost(id: "entry-1") { id status title } }',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.blogPost).toEqual({
      id: 'entry-1',
      status: 'draft',
      title: 'Post 1',
    });
  });

  it('creates an entry via mutation', async () => {
    const res = await request(app)
      .post('/graphql')
      .set('Cookie', [`token=${token}`])
      .send({
        query:
          'mutation($data: JSON!) { createBlogPost(data: $data) { id status title views } }',
        variables: { data: { title: 'Post 1', views: 10 } },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.createBlogPost).toEqual({
      id: 'entry-1',
      status: 'draft',
      title: 'Post 1',
      views: 10,
    });
  });

  it('returns a FORBIDDEN error code when the user lacks permission', async () => {
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
      .post('/graphql')
      .set('Cookie', [`token=${token}`])
      .send({
        query: 'mutation($data: JSON!) { createBlogPost(data: $data) { id } }',
        variables: { data: { title: 'x', views: 1 } },
      });

    expect(res.status).toBe(200);
    expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN');
  });

  it('returns a BAD_USER_INPUT error code for an unknown filter field', async () => {
    const res = await request(app)
      .post('/graphql')
      .set('Cookie', [`token=${token}`])
      .send({
        query:
          'query($filters: JSON) { blogPosts(filters: $filters) { data { id } } }',
        variables: { filters: { bogus: { $eq: 'x' } } },
      });

    expect(res.status).toBe(200);
    expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
  });
});
