import { Router } from 'express';
import * as mediaController from './media.controller.js';
import { upload } from './upload.middleware.js';
import { authenticateToken } from '@repo/middlewares';
import { requirePermission } from '../auth/rbac.middleware.js';

export const mediaRoutes = Router();

mediaRoutes.use(authenticateToken);

mediaRoutes.post(
  '/',
  requirePermission('create'),
  upload.single('file'),
  mediaController.uploadMedia,
);

mediaRoutes.get('/', requirePermission('read'), mediaController.listMedia);

// Specific routes before generic
mediaRoutes.get(
  '/file/:key',
  requirePermission('read'),
  mediaController.serveMediaFile,
);

mediaRoutes.get('/:id', requirePermission('read'), mediaController.getMedia);

mediaRoutes.delete(
  '/:id',
  requirePermission('delete'),
  mediaController.deleteMedia,
);
