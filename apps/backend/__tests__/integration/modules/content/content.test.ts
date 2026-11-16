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
import { createApp } from '../../../../src/app.js';
import jwt from 'jsonwebtoken';
import { env } from '@repo/config';
import { authService } from '../../../../src/modules/auth/auth.service.js';
vi.mock('../../../../src/modules/auth/auth.service.js', () => ({
  authService: {
    getUserPermissions: vi.fn(),
  },
}));
const testSchema = {
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
};
const { repoMocks, workflowRepoMocks } = vi.hoisted(() => ({
  repoMocks: {
    getSchemaBySlug: vi.fn(),
    listEntries: vi.fn(),
    countEntries: vi.fn(),
    getEntryById: vi.fn(),
    createEntry: vi.fn(),
    updateEntryDraft: vi.fn(),
    publishEntry: vi.fn(),
    unpublishEntry: vi.fn(),
    revertEntry: vi.fn(),
    listEntryVersions: vi.fn(),
    deleteEntry: vi.fn(),
  },
  workflowRepoMocks: {
    getWorkflowBySchemaId: vi.fn(),
    getEntryWorkflowState: vi.fn(),
    upsertEntryWorkflowState: vi.fn(),
    recordWorkflowHistory: vi.fn(),
    getWorkflowHistory: vi.fn(),
  },
}));
vi.mock('@repo/repository', () => {
  return {
    ContentRepository: vi.fn().mockImplementation(function () {
      return repoMocks;
    }),
    MediaRepository: vi.fn().mockImplementation(class {}),
    MediaFoldersRepository: vi.fn().mockImplementation(class {}),
    SchemaRepository: vi.fn().mockImplementation(class {}),
    AuditRepository: vi.fn().mockImplementation(class {}),
    AccessRepository: vi.fn().mockImplementation(class {}),
    LocalesRepository: vi.fn().mockImplementation(class {}),
    WebhooksRepository: vi.fn().mockImplementation(class {}),
    WorkflowsRepository: vi.fn().mockImplementation(function () {
      return workflowRepoMocks;
    }),
    authRepository: {},
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
    repoMocks.getSchemaBySlug.mockResolvedValue(testSchema);
    repoMocks.listEntries.mockResolvedValue([]);
    repoMocks.countEntries.mockResolvedValue(0);
    workflowRepoMocks.getWorkflowBySchemaId.mockResolvedValue(null);
    workflowRepoMocks.getEntryWorkflowState.mockResolvedValue(null);
    workflowRepoMocks.upsertEntryWorkflowState.mockResolvedValue({});
    workflowRepoMocks.recordWorkflowHistory.mockResolvedValue({});
    workflowRepoMocks.getWorkflowHistory.mockResolvedValue([]);
    repoMocks.getEntryById.mockResolvedValue({
      id: 'entry-1',
      status: 'draft',
      data: {
        title: 'Test Post',
        body: 'This is a test post body',
        author: 'Tester',
      },
    });
    repoMocks.createEntry.mockResolvedValue({
      id: 'entry-1',
      schemaId: testSchema.id,
      status: 'draft',
      data: {
        title: 'Test Post',
        body: 'This is a test post body',
        author: 'Tester',
      },
      publishedData: null,
    });
    repoMocks.updateEntryDraft.mockResolvedValue({
      status: 'draft',
      data: {
        title: 'Updated Post',
        body: 'This is an updated body',
        author: 'Tester',
      },
    });
    repoMocks.publishEntry.mockResolvedValue({
      status: 'published',
      publishedData: {
        title: 'Updated Post',
        body: 'This is an updated body',
        author: 'Tester',
      },
    });
    repoMocks.unpublishEntry.mockResolvedValue({
      status: 'draft',
      data: {
        title: 'Updated Post',
        body: 'This is an updated body',
        author: 'Tester',
      },
      publishedData: null,
    });
    repoMocks.revertEntry.mockResolvedValue({
      status: 'draft',
      data: {
        title: 'Test Post',
        body: 'This is a test post body',
        author: 'Tester',
      },
    });
    repoMocks.listEntryVersions.mockResolvedValue([
      {
        id: 'version-2',
        versionNo: 2,
        data: {
          title: 'Updated Post',
          body: 'This is an updated body',
          author: 'Tester',
        },
      },
      {
        id: 'version-1',
        versionNo: 1,
        data: {
          title: 'Test Post',
          body: 'This is a test post body',
          author: 'Tester',
        },
      },
    ]);
    repoMocks.deleteEntry.mockResolvedValue({ id: 'entry-1' });
  });
  it('should list content entries (empty)', async () => {
    const res = await request(app)
      .get(`/api/v1/content/${testSchemaSlug}`)
      .set('Cookie', [`token_default=${adminToken}`]);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.data)).toBe(true);
  });
  it('should create a new content draft', async () => {
    const payload = {
      title: 'Test Post',
      body: 'This is a test post body',
      author: 'Tester',
    };
    const res = await request(app)
      .post(`/api/v1/content/${testSchemaSlug}`)
      .set('Cookie', [`token_default=${adminToken}`])
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.data.title).toBe(payload.title);
  });
  it('should get the created entry', async () => {
    const res = await request(app)
      .get(`/api/v1/content/${testSchemaSlug}/${createdEntryId}`)
      .set('Cookie', [`token_default=${adminToken}`]);
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
      .set('Cookie', [`token_default=${adminToken}`])
      .send(payload);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.data.title).toBe(payload.title);
  });
  it('should publish the entry', async () => {
    const res = await request(app)
      .post(`/api/v1/content/${testSchemaSlug}/${createdEntryId}/publish`)
      .set('Cookie', [`token_default=${adminToken}`]);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('published');
    expect(res.body.data.publishedData.title).toBe('Updated Post');
  });
  it('should unpublish the entry', async () => {
    const res = await request(app)
      .post(`/api/v1/content/${testSchemaSlug}/${createdEntryId}/unpublish`)
      .set('Cookie', [`token_default=${adminToken}`]);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.publishedData).toBeNull();
  });
  it('should revert the entry to a previous version', async () => {
    const res = await request(app)
      .post(`/api/v1/content/${testSchemaSlug}/${createdEntryId}/revert`)
      .set('Cookie', [`token_default=${adminToken}`])
      .send({ versionNo: 1 });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.data.title).toBe('Test Post'); // Version 1 had "Test Post"
  });
  it('should list the entry versions', async () => {
    const res = await request(app)
      .get(`/api/v1/content/${testSchemaSlug}/${createdEntryId}/versions`)
      .set('Cookie', [`token_default=${adminToken}`]);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].versionNo).toBe(2);
    expect(res.body.data[1].versionNo).toBe(1);
  });
  it('should delete the entry', async () => {
    const res = await request(app)
      .delete(`/api/v1/content/${testSchemaSlug}/${createdEntryId}`)
      .set('Cookie', [`token_default=${adminToken}`]);
    expect(res.status).toBe(204);
  });
  describe('negative paths', () => {
    it('returns 401 with no auth token', async () => {
      const res = await request(app).get(`/api/v1/content/${testSchemaSlug}`);
      expect(res.status).toBe(401);
    });
    it('returns 404 for an unknown schema slug', async () => {
      repoMocks.getSchemaBySlug.mockResolvedValueOnce(null);
      const res = await request(app)
        .get('/api/v1/content/does-not-exist')
        .set('Cookie', [`token_default=${adminToken}`]);
      expect(res.status).toBe(404);
    });
    it('returns 403 when the user lacks the read permission', async () => {
      vi.mocked(authService.getUserPermissions).mockResolvedValue([
        {
          action: 'create',
          effect: 'allow',
          schemaId: null,
          fields: null,
          condition: null,
        },
      ]);
      const res = await request(app)
        .get(`/api/v1/content/${testSchemaSlug}`)
        .set('Cookie', [`token_default=${adminToken}`]);
      expect(res.status).toBe(403);
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
        .post(`/api/v1/content/${testSchemaSlug}`)
        .set('Cookie', [`token_default=${adminToken}`])
        .send({ title: 'Test Post', body: 'x', author: 'Tester' });
      expect(res.status).toBe(403);
    });
    it('returns 400 when a required field is missing from the payload', async () => {
      const res = await request(app)
        .post(`/api/v1/content/${testSchemaSlug}`)
        .set('Cookie', [`token_default=${adminToken}`])
        .send({ body: 'Missing the required title field', author: 'Tester' });
      expect(res.status).toBe(400);
      expect(repoMocks.createEntry).not.toHaveBeenCalled();
    });
    it('returns 404 when getting a nonexistent entry', async () => {
      repoMocks.getEntryById.mockResolvedValueOnce(null);
      const res = await request(app)
        .get(`/api/v1/content/${testSchemaSlug}/does-not-exist`)
        .set('Cookie', [`token_default=${adminToken}`]);
      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Entry not found');
    });
    it('returns 400 for an invalid versionNo on revert', async () => {
      const res = await request(app)
        .post(`/api/v1/content/${testSchemaSlug}/${createdEntryId}/revert`)
        .set('Cookie', [`token_default=${adminToken}`])
        .send({ versionNo: 'not-a-number' });
      expect(res.status).toBe(400);
      expect(repoMocks.revertEntry).not.toHaveBeenCalled();
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
        .delete(`/api/v1/content/${testSchemaSlug}/${createdEntryId}`)
        .set('Cookie', [`token_default=${adminToken}`]);
      expect(res.status).toBe(403);
      expect(repoMocks.deleteEntry).not.toHaveBeenCalled();
    });
  });

  describe('Workflow Integration & Publishing Guards', () => {
    const testWorkflow = {
      id: 'wf-1',
      name: 'Content Approval',
      stages: [
        { id: 's1', name: 'Draft', slug: 'draft', order: 0, isInitial: true },
        { id: 's2', name: 'In Review', slug: 'in-review', order: 1 },
        {
          id: 's3',
          name: 'Approved',
          slug: 'approved',
          order: 2,
          isFinal: true,
        },
      ],
      transitions: [
        {
          id: 't1',
          name: 'Submit for Review',
          fromStage: 'draft',
          toStage: 'in-review',
        },
        {
          id: 't2',
          name: 'Approve',
          fromStage: 'in-review',
          toStage: 'approved',
          requiredRoleIds: ['admin', 'editor'],
        },
      ],
    };

    it('should get entry workflow state', async () => {
      workflowRepoMocks.getWorkflowBySchemaId.mockResolvedValue(testWorkflow);
      workflowRepoMocks.getEntryWorkflowState.mockResolvedValue({
        id: 'st-1',
        entryId: createdEntryId,
        workflowId: 'wf-1',
        currentStage: 'draft',
      });

      const res = await request(app)
        .get(
          `/api/v1/content/${testSchemaSlug}/${createdEntryId}/workflow-state`,
        )
        .set('Cookie', [`token_default=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.hasWorkflow).toBe(true);
      expect(res.body.data.currentStage.slug).toBe('draft');
      expect(res.body.data.isFinal).toBe(false);
      expect(res.body.data.availableTransitions[0].toStage).toBe('in-review');
    });

    it('should transition entry to next valid stage', async () => {
      workflowRepoMocks.getWorkflowBySchemaId.mockResolvedValue(testWorkflow);
      workflowRepoMocks.getEntryWorkflowState.mockResolvedValue({
        id: 'st-1',
        entryId: createdEntryId,
        workflowId: 'wf-1',
        currentStage: 'draft',
      });

      const res = await request(app)
        .post(`/api/v1/content/${testSchemaSlug}/${createdEntryId}/transition`)
        .set('Cookie', [`token_default=${adminToken}`])
        .send({ toStage: 'in-review', comment: 'Ready for editorial review' });

      expect(res.status).toBe(200);
      expect(workflowRepoMocks.upsertEntryWorkflowState).toHaveBeenCalled();
      expect(workflowRepoMocks.recordWorkflowHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          entryId: createdEntryId,
          fromStage: 'draft',
          toStage: 'in-review',
          comment: 'Ready for editorial review',
        }),
        'app-1',
      );
    });

    it('should reject invalid transition', async () => {
      workflowRepoMocks.getWorkflowBySchemaId.mockResolvedValue(testWorkflow);
      workflowRepoMocks.getEntryWorkflowState.mockResolvedValue({
        id: 'st-1',
        entryId: createdEntryId,
        workflowId: 'wf-1',
        currentStage: 'draft',
      });

      const res = await request(app)
        .post(`/api/v1/content/${testSchemaSlug}/${createdEntryId}/transition`)
        .set('Cookie', [`token_default=${adminToken}`])
        .send({ toStage: 'approved' });

      expect(res.status).toBe(400);
    });

    it('should block publish when entry is not in final workflow stage', async () => {
      workflowRepoMocks.getWorkflowBySchemaId.mockResolvedValue(testWorkflow);
      workflowRepoMocks.getEntryWorkflowState.mockResolvedValue({
        id: 'st-1',
        entryId: createdEntryId,
        workflowId: 'wf-1',
        currentStage: 'in-review',
      });

      const res = await request(app)
        .post(`/api/v1/content/${testSchemaSlug}/${createdEntryId}/publish`)
        .set('Cookie', [`token_default=${adminToken}`]);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('workflow approval is required');
      expect(repoMocks.publishEntry).not.toHaveBeenCalled();
    });

    it('should allow publish when entry is in final approved stage', async () => {
      workflowRepoMocks.getWorkflowBySchemaId.mockResolvedValue(testWorkflow);
      workflowRepoMocks.getEntryWorkflowState.mockResolvedValue({
        id: 'st-1',
        entryId: createdEntryId,
        workflowId: 'wf-1',
        currentStage: 'approved',
      });
      repoMocks.publishEntry.mockResolvedValue({
        id: createdEntryId,
        status: 'published',
        publishedData: { title: 'Published Article' },
      });

      const res = await request(app)
        .post(`/api/v1/content/${testSchemaSlug}/${createdEntryId}/publish`)
        .set('Cookie', [`token_default=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('published');
    });

    it('should get workflow transition history', async () => {
      const mockHistory = [
        {
          id: 'h-1',
          entryId: createdEntryId,
          fromStage: 'draft',
          toStage: 'in-review',
          comment: 'Submitting',
          createdAt: new Date().toISOString(),
        },
      ];
      workflowRepoMocks.getWorkflowHistory.mockResolvedValue(mockHistory);

      const res = await request(app)
        .get(
          `/api/v1/content/${testSchemaSlug}/${createdEntryId}/workflow-history`,
        )
        .set('Cookie', [`token_default=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockHistory);
    });
  });
});
