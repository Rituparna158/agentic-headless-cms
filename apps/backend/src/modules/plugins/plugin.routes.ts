import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import { pluginController } from './plugin.controller.js';
import { pluginLoader } from './plugin-loader.service.js';

export const pluginRouter = Router();

pluginRouter.get('/', pluginController.listPlugins);
pluginRouter.get('/:id', pluginController.getPluginById);

pluginRouter.use(
  '/:pluginId',
  (req: Request, res: Response, next: NextFunction): void => {
    const pluginId =
      typeof req.params.pluginId === 'string' ? req.params.pluginId : '';
    const plugin = pluginLoader.getPlugin(pluginId);

    if (!plugin || plugin.status !== 'active' || !plugin.router) {
      next();
      return;
    }

    if (!req.url || req.url === '') {
      req.url = '/';
    }

    plugin.router(req, res, next);
  },
);
