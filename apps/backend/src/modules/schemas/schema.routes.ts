import { createSchemaSchema, updateSchemaSchema } from '@repo/validation';
import { Router } from 'express';

import { authenticateToken, validateBody } from '@repo/middlewares';
import { requirePermission } from '../auth/rbac.middleware.js';
import {
  createSchema,
  listSchemas,
  updateSchema,
  deleteSchema,
  getSchemaBySlug,
} from './schema.controller.js';

export const schemaRouter = Router();

schemaRouter.post(
  '/',
  authenticateToken,
  requirePermission('create'),
  validateBody(createSchemaSchema),
  createSchema,
);
schemaRouter.get(
  '/',
  authenticateToken,
  requirePermission('read'),
  listSchemas,
);
schemaRouter.get(
  '/slug/:slug',
  authenticateToken,
  requirePermission('read'),
  getSchemaBySlug,
);
schemaRouter.put(
  '/:id',
  authenticateToken,
  requirePermission('update'),
  validateBody(updateSchemaSchema),
  updateSchema,
);
schemaRouter.delete(
  '/:id',
  authenticateToken,
  requirePermission('delete'),
  deleteSchema,
);
