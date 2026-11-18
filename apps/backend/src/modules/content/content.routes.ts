import { Router } from 'express';
import * as contentController from './content.controller.js';
import {
  validateContentPayload,
  validatePartialContentPayload,
} from './validation/content-validation.middleware.js';
import { enforceUniqueFields } from './validation/unique-fields.middleware.js';
import { resolveSchema } from './validation/resolve-schema.middleware.js';
import { authenticateToken } from '@repo/middlewares';
import { requireCapability, requireContentAccess } from '../auth/capability.js';
import { requirePermission } from '../auth/rbac.middleware.js';

export const contentRoutes = Router();

// Require authentication
contentRoutes.use(authenticateToken);

// Resolve schema
contentRoutes.use('/:schemaSlug', resolveSchema);

contentRoutes.get(
  '/:schemaSlug',
  requireCapability(
    [
      'manage_content',
      'publish_content',
      'manage_appearance',
      'manage_media',
      'manage_settings',
    ],
    'read',
  ),
  contentController.listEntries,
);
contentRoutes.get(
  '/:schemaSlug/:entryId',
  requireCapability(
    [
      'manage_content',
      'publish_content',
      'manage_appearance',
      'manage_media',
      'manage_settings',
    ],
    'read',
  ),
  contentController.getEntry,
);
contentRoutes.get(
  '/:schemaSlug/:entryId/versions',
  requireCapability(
    [
      'manage_content',
      'publish_content',
      'manage_appearance',
      'manage_media',
      'manage_settings',
    ],
    'read',
  ),
  contentController.listVersions,
);
contentRoutes.get(
  '/:schemaSlug/:entryId/workflow-state',
  requirePermission('read'),
  contentController.getWorkflowState,
);
contentRoutes.get(
  '/:schemaSlug/:entryId/workflow-history',
  requirePermission('read'),
  contentController.getWorkflowHistory,
);
contentRoutes.post(
  '/:schemaSlug/:entryId/transition',
  requirePermission('update'),
  contentController.transitionEntry,
);
contentRoutes.post(
  '/:schemaSlug',
  requireContentAccess('write'),
  validateContentPayload,
  enforceUniqueFields,
  contentController.createDraft,
);
contentRoutes.put(
  '/:schemaSlug/:entryId',
  requireContentAccess('write'),
  validateContentPayload,
  enforceUniqueFields,
  contentController.updateDraft,
);
contentRoutes.patch(
  '/:schemaSlug/:entryId',
  requireContentAccess('write'),
  validatePartialContentPayload,
  enforceUniqueFields,
  contentController.updatePartialEntry,
);
contentRoutes.post(
  '/:schemaSlug/:entryId/publish',
  requireContentAccess('publish'),
  contentController.publishEntry,
);
contentRoutes.post(
  '/:schemaSlug/:entryId/unpublish',
  requireContentAccess('publish'),
  contentController.unpublishEntry,
);
contentRoutes.post(
  '/:schemaSlug/:entryId/revert',
  requireContentAccess('write'),
  contentController.revertEntry,
);
contentRoutes.delete(
  '/:schemaSlug/:entryId',
  requireContentAccess('delete'),
  contentController.deleteEntry,
);
