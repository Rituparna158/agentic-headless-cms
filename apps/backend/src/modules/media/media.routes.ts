import { Router } from 'express';
import * as mediaController from './media.controller.js';
import { upload } from './upload.middleware.js';
import { authenticateToken } from '../../common/middlewares/auth.middleware.js';
import { requirePermission } from '../../common/middlewares/rbac.middleware.js';

export const mediaRoutes = Router();

mediaRoutes.use(authenticateToken);

mediaRoutes.post(
  '/',
  requirePermission('create'),
  upload.single('file'),
  mediaController.uploadMedia,
);

mediaRoutes.get('/', requirePermission('read'), mediaController.listMedia);

// Two path segments (/file/:key) vs one (/:id) below — no routing overlap,
// but declared first anyway to keep the more specific route visually ahead
// of the generic one.
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
