import { createSchemaSchema, updateSchemaSchema } from '@repo/shared-types';
import { Router } from 'express';

import { authenticateToken } from '../../common/middlewares/auth.middleware.js';
import { requirePermission } from '../../common/middlewares/rbac.middleware.js';
import { validateBody } from '../../common/middlewares/validate-body.middleware.js';
import {
  createSchema,
  listSchemas,
  updateSchema,
  deleteSchema,
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
