import { Router } from 'express';
import * as contentController from './content.controller.js';
import {
  validateContentPayload,
  validatePartialContentPayload,
} from './validation/content-validation.middleware.js';
import { resolveSchema } from './validation/resolve-schema.middleware.js';
import {
  authenticateToken,
  optionalAuthenticateToken,
} from '@repo/middlewares';
import { requirePermission } from '../auth/rbac.middleware.js';

export const contentRoutes = Router();

// Resolve schema
contentRoutes.use('/:schemaSlug', resolveSchema);

// Publicly readable content (defaults to published entries, protects drafts)
contentRoutes.get(
  '/:schemaSlug',
  optionalAuthenticateToken,
  contentController.listEntries,
);
contentRoutes.get(
  '/:schemaSlug/:entryId',
  optionalAuthenticateToken,
  contentController.getEntry,
);

// Protected routes (require user authentication and permissions)
contentRoutes.get(
  '/:schemaSlug/:entryId/versions',
  authenticateToken,
  requirePermission('read'),
  contentController.listVersions,
);
contentRoutes.post(
  '/:schemaSlug',
  authenticateToken,
  requirePermission('create'),
  validateContentPayload,
  contentController.createDraft,
);
contentRoutes.put(
  '/:schemaSlug/:entryId',
  authenticateToken,
  requirePermission('update'),
  validateContentPayload,
  contentController.updateDraft,
);
contentRoutes.patch(
  '/:schemaSlug/:entryId',
  authenticateToken,
  requirePermission('update'),
  validatePartialContentPayload,
  contentController.updatePartialEntry,
);
contentRoutes.post(
  '/:schemaSlug/:entryId/publish',
  authenticateToken,
  requirePermission('publish'),
  contentController.publishEntry,
);
contentRoutes.post(
  '/:schemaSlug/:entryId/unpublish',
  authenticateToken,
  requirePermission('publish'),
  contentController.unpublishEntry,
);
contentRoutes.post(
  '/:schemaSlug/:entryId/revert',
  authenticateToken,
  requirePermission('update'),
  contentController.revertEntry,
);
contentRoutes.delete(
  '/:schemaSlug/:entryId',
  authenticateToken,
  requirePermission('delete'),
  contentController.deleteEntry,
);
