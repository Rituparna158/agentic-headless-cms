/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
vi.mock('../../../../src/middlewares/global-auth.middleware', () => ({
  globalAuthMiddleware: (
    req: import('express').Request,
    res: import('express').Response,
    next: import('express').NextFunction,
  ) => {
    req.headers['x-app-id'] = req.headers['x-app-id'] || 'default';
    req.context = { ...req.context, applicationId: 'app-1' };
    next();
  },
}));
import jwt from 'jsonwebtoken';
import { PgDialect } from 'drizzle-orm/pg-core';
import { createApp } from '../../../../src/app.js';
import { env } from '@repo/config';
import { authService } from '../../../../src/modules/auth/auth.service.js';
import { ContentService } from '../../../../src/modules/content/content.service.js';
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
    listSchemas: vi.fn().mockResolvedValue([[testSchema], 1]),
  };
});
vi.mock('@repo/repository', () => {
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
function makeToken(
  roles: string[] = ['admin'],
  permissions?: unknown[],
): string {
  return jwt.sign(
    {
      id: 'user-1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      roles,
      ...(permissions ? { permissions } : {}),
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
      .set('x-app-id', 'CMS_UI')
      .set('Cookie', [`token_cms_ui=${token}`])
      .send({
        query: '{ blogPosts { data { id title views } meta { total } } }',
      });
    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.blogPosts.data).toEqual([
      { id: 'entry-1', title: 'Post 1', views: 10 },
    ]);
    expect(res.body.data.blogPosts.meta.total).toBe(1);
  }, 10000);
  it('fetches a single entry by id', async () => {
    const res = await request(app)
      .post('/graphql')
      .set('x-app-id', 'CMS_UI')
      .set('Cookie', [`token_cms_ui=${token}`])
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
      .set('x-app-id', 'CMS_UI')
      .set('Cookie', [`token_cms_ui=${token}`])
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
      .set('x-app-id', 'CMS_UI')
      .set('Cookie', [`token_cms_ui=${token}`])
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
      .set('x-app-id', 'CMS_UI')
      .set('Cookie', [`token_cms_ui=${token}`])
      .send({
        query:
          'query($filters: JSON) { blogPosts(filters: $filters) { data { id } } }',
        variables: { filters: { bogus: { $eq: 'x' } } },
      });
    expect(res.status).toBe(200);
    expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
  });

  describe('Draft Exposure Control', () => {
    const pgDialect = new PgDialect();
    const readOnlyPerms = [
      {
        action: 'read',
        effect: 'allow',
        schemaId: null,
        fields: null,
        condition: null,
      },
    ];

    function setupViewer(): string {
      vi.mocked(authService.getUserPermissions).mockResolvedValue(
        readOnlyPerms,
      );
      return makeToken(['viewer']);
    }

    function sendGraphQL(
      authToken: string,
      query: string,
      variables?: Record<string, unknown>,
    ) {
      return request(app)
        .post('/graphql')
        .set('x-app-id', 'CMS_UI')
        .set('Cookie', [`token_cms_ui=${authToken}`])
        .send({ query, variables });
    }

    it('defaults collection queries to published status when no status or status filter is provided', async () => {
      const viewerToken = setupViewer();
      const listSpy = vi
        .spyOn(ContentService.prototype, 'listEntries')
        .mockResolvedValueOnce([
          {
            id: 'entry-pub',
            status: 'published',
            data: { title: 'Published Post', views: 5 },
            publishedData: { title: 'Published Post', views: 5 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ] as never);
      const countSpy = vi
        .spyOn(ContentService.prototype, 'countEntries')
        .mockResolvedValueOnce(1);

      try {
        const res = await sendGraphQL(
          viewerToken,
          '{ blogPosts { data { id status title } meta { total } } }',
        );
        expect(res.status).toBe(200);
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.blogPosts.data).toEqual([
          { id: 'entry-pub', status: 'published', title: 'Published Post' },
        ]);

        const listQuery = listSpy.mock.calls[0][2];
        expect(listQuery.where).toBeDefined();
        const rendered = pgDialect.sqlToQuery(listQuery.where!);
        expect(rendered.sql).toContain('status');
        expect(rendered.params).toEqual(['published']);
        expect(countSpy.mock.calls[0][2].where).toBe(listQuery.where);
      } finally {
        listSpy.mockRestore();
        countSpy.mockRestore();
      }
    });

    it.each([
      [
        'status: "draft"',
        'query { blogPosts(status: "draft") { data { id } } }',
        undefined,
      ],
      [
        'status: "all"',
        'query { blogPosts(status: "all") { data { id } } }',
        undefined,
      ],
      [
        'filters.status.$eq = draft',
        'query($filters: JSON) { blogPosts(filters: $filters) { data { id } } }',
        { filters: { status: { $eq: 'draft' } } },
      ],
      [
        'filters.status.$ne = published',
        'query($filters: JSON) { blogPosts(filters: $filters) { data { id } } }',
        { filters: { status: { $ne: 'published' } } },
      ],
      [
        'filters.status.$in = published,draft',
        'query($filters: JSON) { blogPosts(filters: $filters) { data { id } } }',
        { filters: { status: { $in: 'published,draft' } } },
      ],
    ])(
      'blocks viewer collection query requesting non-published entries (%s)',
      async (_label, query, variables) => {
        const viewerToken = setupViewer();
        const listSpy = vi.spyOn(ContentService.prototype, 'listEntries');
        try {
          const res = await sendGraphQL(viewerToken, query, variables);
          expect(res.status).toBe(200);
          expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN');
          expect(listSpy).not.toHaveBeenCalled();
        } finally {
          listSpy.mockRestore();
        }
      },
    );

    it('allows viewer to explicitly query published entries in collections', async () => {
      const viewerToken = setupViewer();
      const res = await sendGraphQL(
        viewerToken,
        'query($filters: JSON) { blogPosts(status: "published", filters: $filters) { data { id } } }',
        { filters: { status: { $eq: 'published' } } },
      );
      expect(res.status).toBe(200);
      expect(res.body.errors).toBeUndefined();
    });

    it('allows authorized admins and editors to query draft and all statuses', async () => {
      const listSpy = vi.spyOn(ContentService.prototype, 'listEntries');
      try {
        const draftRes = await sendGraphQL(
          token,
          '{ blogPosts(status: "draft") { data { id status } } }',
        );
        expect(draftRes.status).toBe(200);
        expect(draftRes.body.errors).toBeUndefined();
        const draftSql = pgDialect.sqlToQuery(listSpy.mock.calls[0][2].where!);
        expect(draftSql.sql).toContain('status');
        expect(draftSql.params).toEqual(['draft']);

        const allRes = await sendGraphQL(
          token,
          '{ blogPosts(status: "all") { data { id status } } }',
        );
        expect(allRes.status).toBe(200);
        expect(allRes.body.errors).toBeUndefined();
        expect(listSpy.mock.calls[1][2].where).toBeUndefined();

        const editorToken = makeToken(['editor']);
        vi.mocked(authService.getUserPermissions).mockResolvedValue([
          ...readOnlyPerms,
          {
            action: 'update',
            effect: 'allow',
            schemaId: 'schema-1',
            fields: null,
            condition: null,
          },
        ]);
        const editorRes = await sendGraphQL(
          editorToken,
          'query($filters: JSON) { blogPosts(filters: $filters) { data { id } } }',
          { filters: { status: { $eq: 'draft' } } },
        );
        expect(editorRes.status).toBe(200);
        expect(editorRes.body.errors).toBeUndefined();
      } finally {
        listSpy.mockRestore();
      }
    });

    it('enforces draft access strictly via permissions rather than hardcoded role names', async () => {
      // Custom role name with editorial permission (publish) is allowed
      const customReviewerToken = makeToken(['regional-reviewer']);
      vi.mocked(authService.getUserPermissions).mockResolvedValue([
        ...readOnlyPerms,
        {
          action: 'publish',
          effect: 'allow',
          schemaId: 'schema-1',
          fields: null,
          condition: null,
        },
      ]);
      const allowedCustomRes = await sendGraphQL(
        customReviewerToken,
        '{ blogPosts(status: "draft") { data { id } } }',
      );
      expect(allowedCustomRes.status).toBe(200);
      expect(allowedCustomRes.body.errors).toBeUndefined();

      // Even a built-in role name ('editor') is blocked if permissions only allow 'read' on this schema
      const scopedEditorToken = makeToken(['editor']);
      vi.mocked(authService.getUserPermissions).mockResolvedValue([
        ...readOnlyPerms,
        {
          action: 'update',
          effect: 'allow',
          schemaId: 'other-schema',
          fields: null,
          condition: null,
        },
      ]);
      const blockedEditorRes = await sendGraphQL(
        scopedEditorToken,
        '{ blogPosts(status: "draft") { data { id } } }',
      );
      expect(blockedEditorRes.status).toBe(200);
      expect(blockedEditorRes.body.errors[0].extensions.code).toBe('FORBIDDEN');

      // UI capability permissions (`action: 'manage'`) combined with `read` must not unlock draft content
      vi.mocked(authService.getUserPermissions).mockResolvedValue([
        ...readOnlyPerms,
        {
          action: 'manage',
          effect: 'allow',
          schemaId: null,
          fields: null,
          condition: { capability: 'manage_media' },
        },
      ]);
      const mediaManagerRes = await sendGraphQL(
        customReviewerToken,
        '{ blogPosts(status: "draft") { data { id } } }',
      );
      expect(mediaManagerRes.status).toBe(200);
      expect(mediaManagerRes.body.errors[0].extensions.code).toBe('FORBIDDEN');
    });

    it('allows users with explicit editorial permission to query drafts', async () => {
      const customToken = makeToken(['viewer']);
      vi.mocked(authService.getUserPermissions).mockResolvedValue([
        ...readOnlyPerms,
        {
          action: 'update',
          effect: 'allow',
          schemaId: 'schema-1',
          fields: null,
          condition: null,
        },
      ]);
      const res = await sendGraphQL(
        customToken,
        '{ blogPosts(status: "draft") { data { id } } }',
      );
      expect(res.status).toBe(200);
      expect(res.body.errors).toBeUndefined();
    });

    it('enforces draft restrictions using user permissions when roles are empty', async () => {
      vi.mocked(authService.getUserPermissions).mockResolvedValue(
        readOnlyPerms,
      );
      const readToken = makeToken([], readOnlyPerms);
      const blockedRes = await sendGraphQL(
        readToken,
        '{ blogPosts(status: "draft") { data { id } } }',
      );
      expect(blockedRes.status).toBe(200);
      expect(blockedRes.body.errors[0].extensions.code).toBe('FORBIDDEN');

      const fullPerms = [
        {
          action: '*',
          effect: 'allow',
          schemaId: null,
          fields: null,
          condition: null,
        },
      ];
      vi.mocked(authService.getUserPermissions).mockResolvedValue(fullPerms);
      const fullToken = makeToken([], fullPerms);
      const allowedRes = await sendGraphQL(
        fullToken,
        '{ blogPosts(status: "draft") { data { id } } }',
      );
      expect(allowedRes.status).toBe(200);
      expect(allowedRes.body.errors).toBeUndefined();
    });

    it('blocks unauthorized single-entry access to draft entries with NOT_FOUND', async () => {
      const viewerToken = setupViewer();
      const res = await sendGraphQL(
        viewerToken,
        '{ blogPost(id: "entry-1") { id status title } }',
      );
      expect(res.status).toBe(200);
      expect(res.body.data.blogPost).toBeNull();
      expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND');
    });

    it('allows viewer single-entry access to published entries and editor access to drafts', async () => {
      const viewerToken = setupViewer();
      const getSpy = vi
        .spyOn(ContentService.prototype, 'getEntryById')
        .mockResolvedValueOnce({
          id: 'entry-pub',
          schemaId: 'schema-1',
          status: 'published',
          data: { title: 'Published', views: 20 },
          publishedData: { title: 'Published', views: 20 },
        } as never);

      try {
        const pubRes = await sendGraphQL(
          viewerToken,
          '{ blogPost(id: "entry-pub") { id status title } }',
        );
        expect(pubRes.status).toBe(200);
        expect(pubRes.body.errors).toBeUndefined();
        expect(pubRes.body.data.blogPost).toEqual({
          id: 'entry-pub',
          status: 'published',
          title: 'Published',
        });
      } finally {
        getSpy.mockRestore();
      }

      const editorToken = makeToken(['editor']);
      vi.mocked(authService.getUserPermissions).mockResolvedValue([
        ...readOnlyPerms,
        {
          action: 'update',
          effect: 'allow',
          schemaId: 'schema-1',
          fields: null,
          condition: null,
        },
      ]);
      const editorRes = await sendGraphQL(
        editorToken,
        '{ blogPost(id: "entry-1") { id status title } }',
      );
      expect(editorRes.status).toBe(200);
      expect(editorRes.body.errors).toBeUndefined();
      expect(editorRes.body.data.blogPost).toEqual({
        id: 'entry-1',
        status: 'draft',
        title: 'Post 1',
      });
    });
  });
});
