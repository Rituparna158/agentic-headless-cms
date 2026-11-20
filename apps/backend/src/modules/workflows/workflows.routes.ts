import { Router } from 'express';
import {
  listWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  assignWorkflowToSchema,
  removeWorkflowFromSchema,
  getWorkflowBySchema,
  getWorkflowSchemas,
  getActiveEntriesInStage,
  getPendingReviews,
} from './workflows.controller.js';
import { authenticateToken, requireAdmin } from '@repo/middlewares';

export const workflowsRouter = Router();

workflowsRouter.use(authenticateToken);

// Read endpoints accessible to authenticated users
workflowsRouter.get('/', listWorkflows);
workflowsRouter.get('/pending-reviews', getPendingReviews);
workflowsRouter.get('/schema/:schemaId', getWorkflowBySchema);
workflowsRouter.get('/schemas/:schemaId', getWorkflowBySchema);
workflowsRouter.get('/:id', getWorkflow);
workflowsRouter.get('/:id/schemas', getWorkflowSchemas);
workflowsRouter.get(
  '/:id/stages/:stageSlug/active-entries',
  getActiveEntriesInStage,
);

// Write/configuration endpoints restricted to Admin
workflowsRouter.post('/', requireAdmin, createWorkflow);
workflowsRouter.put('/:id', requireAdmin, updateWorkflow);
workflowsRouter.delete('/:id', requireAdmin, deleteWorkflow);
workflowsRouter.post(
  '/:id/schemas/:schemaId',
  requireAdmin,
  assignWorkflowToSchema,
);
workflowsRouter.delete(
  '/:id/schemas/:schemaId',
  requireAdmin,
  removeWorkflowFromSchema,
);
workflowsRouter.delete(
  '/schemas/:schemaId',
  requireAdmin,
  removeWorkflowFromSchema,
);
workflowsRouter.delete(
  '/schema/:schemaId',
  requireAdmin,
  removeWorkflowFromSchema,
);
