import type { Request, Response } from 'express';
import { pluginLoader } from './plugin-loader.service.js';
import { ApiError } from '@repo/utils';

export class PluginController {
  public listPlugins = (_req: Request, res: Response): void => {
    const plugins = pluginLoader.getSummaries();
    res.json({
      success: true,
      data: plugins,
      meta: {
        total: plugins.length,
      },
    });
  };
  public getPluginById = (req: Request, res: Response): void => {
    const id = typeof req.params.id === 'string' ? req.params.id : '';
    const plugin = pluginLoader.getPlugin(id);
    if (!plugin) {
      throw new ApiError(404, `Plugin "${id}" not found`);
    }
    const summaries = pluginLoader.getSummaries();
    const summary = summaries.find((s) => s.id === id);
    res.json({
      success: true,
      data: summary,
    });
  };
}

export const pluginController = new PluginController();
