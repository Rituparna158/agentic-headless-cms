import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import { pluginController } from './plugin.controller.js';
import { pluginLoader } from './plugin-loader.service.js';
import { authenticateToken, validateBody } from '@repo/middlewares';
import { requirePermission } from '../auth/rbac.middleware.js';
import {
  updatePluginStatusSchema,
  updatePluginConfigSchema,
} from '@repo/validation';
import { ApiError } from '@repo/utils';

export const pluginRouter = Router();

pluginRouter.get('/', pluginController.listPlugins);
pluginRouter.get('/:id', pluginController.getPluginById);

pluginRouter.patch(
  '/:id/status',
  authenticateToken,
  requirePermission('manage'),
  validateBody(updatePluginStatusSchema),
  pluginController.updatePluginStatus,
);

pluginRouter.put(
  '/:id/config',
  authenticateToken,
  requirePermission('manage'),
  validateBody(updatePluginConfigSchema),
  pluginController.updatePluginConfig,
);

pluginRouter.use(
  '/:pluginId',
  (req: Request, res: Response, next: NextFunction): void => {
    const pluginId =
      typeof req.params.pluginId === 'string' ? req.params.pluginId : '';
    const plugin = pluginLoader.getPlugin(pluginId);

    if (!plugin) {
      next();
      return;
    }

    if (plugin.status === 'disabled') {
      throw new ApiError(403, `Plugin "${pluginId}" is disabled`);
    }

    if (plugin.status !== 'active' || !plugin.router) {
      next();
      return;
    }

    if (!req.url || req.url === '') {
      req.url = '/';
    }

    plugin.router(req, res, next);
  },
);
