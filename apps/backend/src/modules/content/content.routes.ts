import { Router } from 'express';
import * as contentController from './content.controller.js';
import {
  validateContentPayload,
  validatePartialContentPayload,
} from './validation/content-validation.middleware.js';
import { resolveSchema } from './validation/resolve-schema.middleware.js';
import { authenticateToken } from '@repo/middlewares';
import { requirePermission } from '../auth/rbac.middleware.js';

export const contentRoutes = Router();

// Require authentication
contentRoutes.use(authenticateToken);
// Resolve schema
contentRoutes.use('/:schemaSlug', resolveSchema);

contentRoutes.get(
  '/:schemaSlug',
  requirePermission('read'),
  contentController.listEntries,
);

contentRoutes.get(
  '/:schemaSlug/:entryId',
  requirePermission('read'),
  contentController.getEntry,
);

contentRoutes.get(
  '/:schemaSlug/:entryId/versions',
  requirePermission('read'),
  contentController.listVersions,
);

contentRoutes.post(
  '/:schemaSlug',
  requirePermission('create'),
  validateContentPayload,
  contentController.createDraft,
);

contentRoutes.put(
  '/:schemaSlug/:entryId',
  requirePermission('update'),
  validateContentPayload,
  contentController.updateDraft,
);

contentRoutes.patch(
  '/:schemaSlug/:entryId',
  requirePermission('update'),
  validatePartialContentPayload,
  contentController.updatePartialEntry,
);

contentRoutes.post(
  '/:schemaSlug/:entryId/publish',
  requirePermission('publish'),
  contentController.publishEntry,
);

contentRoutes.post(
  '/:schemaSlug/:entryId/revert',
  requirePermission('update'),
  contentController.revertEntry,
);

contentRoutes.delete(
  '/:schemaSlug/:entryId',
  requirePermission('delete'),
  contentController.deleteEntry,
);
