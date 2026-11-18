import { Router } from 'express';
import * as mediaController from './media.controller.js';
import { upload } from './upload.middleware.js';
import { authenticateToken } from '@repo/middlewares';
import { requireCapability } from '../auth/capability.js';
export const mediaRoutes = Router();
// Specific routes before generic (Public)
mediaRoutes.get('/file/:key', mediaController.serveMediaFile);
mediaRoutes.use(authenticateToken);
mediaRoutes.post(
  '/',
  requireCapability(['manage_media', 'manage_content'], 'create'),
  upload.single('file'),
  mediaController.uploadMedia,
);
mediaRoutes.get(
  '/',
  requireCapability(
    ['manage_media', 'manage_content', 'publish_content', 'manage_appearance'],
    'read',
  ),
  mediaController.listMedia,
);
mediaRoutes.post(
  '/bulk-delete',
  requireCapability('manage_media', 'delete'),
  mediaController.deleteBulkMedia,
);
mediaRoutes.get(
  '/:id',
  requireCapability(
    ['manage_media', 'manage_content', 'publish_content', 'manage_appearance'],
    'read',
  ),
  mediaController.getMedia,
);
mediaRoutes.delete(
  '/:id',
  requireCapability('manage_media', 'delete'),
  mediaController.deleteMedia,
);
