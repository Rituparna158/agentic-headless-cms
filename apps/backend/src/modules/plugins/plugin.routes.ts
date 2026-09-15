import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import { pluginController } from './plugin.controller.js';
import { pluginLoader } from './plugin-loader.service.js';
import type { PluginRoute } from '@repo/plugin-sdk';

export const pluginRouter = Router();

pluginRouter.get('/', pluginController.listPlugins);
pluginRouter.get('/:id', pluginController.getPluginById);

pluginRouter.use(
  '/:pluginId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const pluginId =
      typeof req.params.pluginId === 'string' ? req.params.pluginId : '';
    const plugin = pluginLoader.getPlugin(pluginId);

    if (!plugin || plugin.status !== 'active') {
      next();
      return;
    }

    let subPath = req.path || '/';
    if (!subPath.startsWith('/')) {
      subPath = `/${subPath}`;
    }
    const method = req.method.toLowerCase();

    const matchedRoute = plugin.definition.routes?.find(
      (r: PluginRoute) =>
        r.path === subPath && r.method.toLowerCase() === method,
    );

    if (!matchedRoute) {
      next();
      return;
    }

    try {
      if (matchedRoute.middlewares && matchedRoute.middlewares.length > 0) {
        for (const mw of matchedRoute.middlewares) {
          let middlewareResolved = false;
          await new Promise<void>((resolve, reject) => {
            try {
              void mw(req, res, (err?: unknown) => {
                middlewareResolved = true;
                if (err) {
                  reject(
                    err instanceof Error
                      ? err
                      : new Error(
                          typeof err === 'string'
                            ? err
                            : 'Middleware execution failed',
                        ),
                  );
                } else {
                  resolve();
                }
              });
            } catch (err) {
              reject(
                err instanceof Error
                  ? err
                  : new Error(
                      typeof err === 'string'
                        ? err
                        : 'Middleware execution failed',
                    ),
              );
            }
          });
          if (res.headersSent || !middlewareResolved) return;
        }
      }

      await matchedRoute.handler(req, res, next);
    } catch (error) {
      next(error);
    }
  },
);
