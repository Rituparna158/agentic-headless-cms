import { Router } from 'express';
import * as mediaFoldersController from './media-folders.controller.js';
import { authenticateToken } from '@repo/middlewares';
import { requirePermission } from '../auth/rbac.middleware.js';
export const mediaFoldersRoutes = Router();
mediaFoldersRoutes.use(authenticateToken);
mediaFoldersRoutes.post(
  '/',
  requirePermission('create'),
  mediaFoldersController.createFolder,
);
mediaFoldersRoutes.get(
  '/',
  requirePermission('read'),
  mediaFoldersController.listFolders,
);
mediaFoldersRoutes.delete(
  '/:id',
  requirePermission('delete'),
  mediaFoldersController.deleteFolder,
);
