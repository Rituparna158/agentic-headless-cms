import { createSchemaSchema, updateSchemaSchema } from '@repo/validation';
import { Router } from 'express';
import { authenticateToken, validateBody } from '@repo/middlewares';
import { requireCapability } from '../auth/capability.js';
import {
  createSchema,
  listSchemas,
  updateSchema,
  deleteSchema,
  getSchemaBySlug,
} from './schema.controller.js';
export const schemaRouter = Router();
schemaRouter.post(
  '/',
  authenticateToken,
  requireCapability('manage_settings', 'create'),
  validateBody(createSchemaSchema),
  createSchema,
);
schemaRouter.get(
  '/',
  authenticateToken,
  requireCapability(
    [
      'manage_content',
      'publish_content',
      'manage_media',
      'manage_appearance',
      'manage_settings',
      'manage_users',
      'manage_plugins',
    ],
    'read',
  ),
  listSchemas,
);
schemaRouter.get(
  '/slug/:slug',
  authenticateToken,
  requireCapability(
    [
      'manage_content',
      'publish_content',
      'manage_media',
      'manage_appearance',
      'manage_settings',
      'manage_users',
      'manage_plugins',
    ],
    'read',
  ),
  getSchemaBySlug,
);
schemaRouter.put(
  '/:id',
  authenticateToken,
  requireCapability('manage_settings', 'update'),
  validateBody(updateSchemaSchema),
  updateSchema,
);
schemaRouter.delete(
  '/:id',
  authenticateToken,
  requireCapability('manage_settings', 'delete'),
  deleteSchema,
);
