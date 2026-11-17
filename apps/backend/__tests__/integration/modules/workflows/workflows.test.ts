import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { env } from '@repo/config';

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

vi.mock('../../../../src/modules/workflows/workflows.service.js', () => {
  const WorkflowsService = vi.fn();
  WorkflowsService.prototype.list = vi.fn().mockResolvedValue([
    [
      {
        id: 'wf-1',
        name: 'Editorial Review',
        stages: [
          { id: 's1', name: 'Draft', slug: 'draft', order: 0 },
          { id: 's2', name: 'Published', slug: 'published', order: 1 },
        ],
        transitions: [],
        assignedSchemaIds: ['schema-1'],
      },
    ],
    1,
  ]);
  WorkflowsService.prototype.getById = vi
    .fn()
    .mockImplementation((id: string) => {
      if (id === 'wf-1') {
        return Promise.resolve({
          id: 'wf-1',
          name: 'Editorial Review',
          stages: [
            { id: 's1', name: 'Draft', slug: 'draft', order: 0 },
            { id: 's2', name: 'Published', slug: 'published', order: 1 },
          ],
          transitions: [],
          assignedSchemaIds: ['schema-1'],
        });
      }
      return Promise.resolve(null);
    });
  WorkflowsService.prototype.create = vi.fn().mockResolvedValue({
    id: 'wf-2',
    name: 'Content Approval',
    stages: [
      { id: 's1', name: 'Draft', slug: 'draft', order: 0 },
      { id: 's2', name: 'Approved', slug: 'approved', order: 1 },
    ],
    transitions: [
      { id: 't1', name: 'Approve', fromStage: 'draft', toStage: 'approved' },
    ],
    assignedSchemaIds: [],
  });
  WorkflowsService.prototype.update = vi.fn().mockResolvedValue({
    id: 'wf-1',
    name: 'Updated Editorial Review',
    stages: [],
    transitions: [],
    assignedSchemaIds: [],
  });
  WorkflowsService.prototype.delete = vi.fn().mockResolvedValue(true);
  WorkflowsService.prototype.assignToSchema = vi
    .fn()
    .mockResolvedValue(undefined);
  WorkflowsService.prototype.removeFromSchema = vi
    .fn()
    .mockResolvedValue(undefined);
  WorkflowsService.prototype.getWorkflowBySchemaId = vi
    .fn()
    .mockImplementation((schemaId: string) => {
      if (schemaId === 'schema-1') {
        return Promise.resolve({
          id: 'wf-1',
          name: 'Editorial Review',
          stages: [],
          transitions: [],
        });
      }
      return Promise.resolve(null);
    });
  WorkflowsService.prototype.getAssignedSchemas = vi
    .fn()
    .mockResolvedValue([
      { id: 'schema-1', name: 'Articles', slug: 'articles' },
    ]);
  WorkflowsService.prototype.getEntryWorkflowState = vi.fn().mockResolvedValue({
    hasWorkflow: true,
    workflow: { id: 'wf-1', name: 'Editorial Review' },
    currentStage: { id: 's1', name: 'Draft', slug: 'draft', order: 0 },
    availableTransitions: [
      { id: 't1', name: 'Submit', fromStage: 'draft', toStage: 'approved' },
    ],
    isFinal: false,
  });
  WorkflowsService.prototype.transitionEntry = vi.fn().mockResolvedValue({
    hasWorkflow: true,
    workflow: { id: 'wf-1', name: 'Editorial Review' },
    currentStage: {
      id: 's2',
      name: 'Approved',
      slug: 'approved',
      order: 1,
      isFinal: true,
    },
    availableTransitions: [],
    isFinal: true,
  });
  WorkflowsService.prototype.getWorkflowHistory = vi.fn().mockResolvedValue([
    {
      id: 'h-1',
      entryId: 'entry-1',
      workflowId: 'wf-1',
      fromStage: 'draft',
      toStage: 'approved',
      action: 'Submit',
      actorType: 'user',
      actorUserId: 'user-1',
      createdAt: new Date().toISOString(),
    },
  ]);
  WorkflowsService.prototype.canPublish = vi.fn().mockResolvedValue(true);
  WorkflowsService.prototype.initializeEntryWorkflow = vi
    .fn()
    .mockResolvedValue(undefined);

  return { WorkflowsService };
});

import { createApp } from '../../../../src/app.js';

describe('Workflows Module API Routes', () => {
  const app = createApp();
  const adminToken = jwt.sign(
    { id: 'user-1', email: 'admin@example.com', roles: ['admin'] },
    env.JWT_SECRET,
  );
  const editorToken = jwt.sign(
    { id: 'user-2', email: 'editor@example.com', roles: ['editor'] },
    env.JWT_SECRET,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/workflows', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/v1/workflows');
      expect(res.status).toBe(401);
    });

    it('should list workflows for authenticated users', async () => {
      const res = await request(app)
        .get('/api/v1/workflows')
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.data).toHaveLength(1);
      expect(res.body.data.data[0].name).toBe('Editorial Review');
    });
  });

  describe('GET /api/v1/workflows/:id', () => {
    it('should return workflow details by ID', async () => {
      const res = await request(app)
        .get('/api/v1/workflows/wf-1')
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('wf-1');
    });

    it('should return 404 for nonexistent workflow', async () => {
      const res = await request(app)
        .get('/api/v1/workflows/wf-999')
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/workflows', () => {
    it('should reject non-admin users', async () => {
      const res = await request(app)
        .post('/api/v1/workflows')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          name: 'New Workflow',
          stages: [{ id: 's1', name: 'Draft', slug: 'draft', order: 0 }],
        });

      expect(res.status).toBe(403);
    });

    it('should allow admin to create a new workflow', async () => {
      const res = await request(app)
        .post('/api/v1/workflows')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Content Approval',
          stages: [
            { id: 's1', name: 'Draft', slug: 'draft', order: 0 },
            { id: 's2', name: 'Approved', slug: 'approved', order: 1 },
          ],
          transitions: [
            {
              id: 't1',
              name: 'Approve',
              fromStage: 'draft',
              toStage: 'approved',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Content Approval');
    });
  });

  describe('PUT /api/v1/workflows/:id', () => {
    it('should allow admin to update a workflow', async () => {
      const res = await request(app)
        .put('/api/v1/workflows/wf-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Editorial Review',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Editorial Review');
    });
  });

  describe('DELETE /api/v1/workflows/:id', () => {
    it('should allow admin to delete a workflow', async () => {
      const res = await request(app)
        .delete('/api/v1/workflows/wf-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('wf-1');
    });
  });

  describe('Schema Association Endpoints', () => {
    it('should allow admin to assign workflow to a schema', async () => {
      const res = await request(app)
        .post('/api/v1/workflows/wf-1/schemas/schema-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.workflowId).toBe('wf-1');
      expect(res.body.data.schemaId).toBe('schema-1');
    });

    it('should allow admin to remove workflow from a schema', async () => {
      const res = await request(app)
        .delete('/api/v1/workflows/wf-1/schemas/schema-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.schemaId).toBe('schema-1');
    });

    it('should return workflow for a schema', async () => {
      const res = await request(app)
        .get('/api/v1/workflows/schema/schema-1')
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('wf-1');
    });
  });
});
