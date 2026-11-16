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
} from './workflows.controller.js';
import { authenticateToken, requireAdmin } from '@repo/middlewares';

export const workflowsRouter = Router();

workflowsRouter.use(authenticateToken);

// Read endpoints accessible to authenticated users
workflowsRouter.get('/', listWorkflows);
workflowsRouter.get('/schema/:schemaId', getWorkflowBySchema);
workflowsRouter.get('/:id', getWorkflow);
workflowsRouter.get('/:id/schemas', getWorkflowSchemas);

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
