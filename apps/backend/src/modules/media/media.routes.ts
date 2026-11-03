import { Router } from 'express';
import * as mediaController from './media.controller.js';
import { upload } from './upload.middleware.js';
import { authenticateToken } from '@repo/middlewares';
import { requirePermission } from '../auth/rbac.middleware.js';
export const mediaRoutes = Router();
// Specific routes before generic (Public)
mediaRoutes.get('/file/:key', mediaController.serveMediaFile);
mediaRoutes.use(authenticateToken);
mediaRoutes.post(
  '/',
  requirePermission('create'),
  upload.single('file'),
  mediaController.uploadMedia,
);
mediaRoutes.get('/', requirePermission('read'), mediaController.listMedia);
mediaRoutes.post(
  '/bulk-delete',
  requirePermission('delete'),
  mediaController.deleteBulkMedia,
);
mediaRoutes.get('/:id', requirePermission('read'), mediaController.getMedia);
mediaRoutes.delete(
  '/:id',
  requirePermission('delete'),
  mediaController.deleteMedia,
);
