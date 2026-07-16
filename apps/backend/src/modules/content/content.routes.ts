import { Router } from 'express';
import * as contentController from './content.controller.js';
import { validateContentPayload } from './validation/content-validation.middleware.js';
import { resolveSchema } from './validation/resolve-schema.middleware.js';
import { authenticateToken } from '../../common/middlewares/auth.middleware.js';
import { requirePermission } from '../../common/middlewares/rbac.middleware.js';

export const contentRoutes = Router();

// Require all content routes to be authenticated
contentRoutes.use(authenticateToken);
// Every route below is scoped to :schemaSlug — resolve it once, up front,
// so every handler (and requirePermission) has req.schema/req.schemaId.
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
