import { Router } from 'express';
import * as mediaFoldersController from './media-folders.controller.js';
import { authenticateToken } from '@repo/middlewares';
import { requireCapability } from '../auth/capability.js';
export const mediaFoldersRoutes = Router();
mediaFoldersRoutes.use(authenticateToken);
mediaFoldersRoutes.post(
  '/',
  requireCapability('manage_media', 'create'),
  mediaFoldersController.createFolder,
);
mediaFoldersRoutes.get(
  '/',
  requireCapability(
    ['manage_media', 'manage_content', 'publish_content'],
    'read',
  ),
  mediaFoldersController.listFolders,
);
mediaFoldersRoutes.delete(
  '/:id',
  requireCapability('manage_media', 'delete'),
  mediaFoldersController.deleteFolder,
);
