import type { Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { pluginLoader } from './plugin-loader.service.js';
import { ApiError } from '@repo/utils';
import { eventBus } from '@repo/events';
import { EVENT_NAMES, AUDIT_ACTIONS } from '@repo/constants';
import { getAuditContext } from '../../utils/audit.js';
import { maskConfigSecrets } from './mask-secrets.js';

export class PluginController {
  public listPlugins = async (req: Request, res: Response): Promise<void> => {
    if (pluginLoader.getAllPlugins().length === 0) {
      const candidateDirs = [
        path.resolve(process.cwd(), 'plugins'),
        path.resolve(process.cwd(), 'apps', 'backend', 'plugins'),
        path.resolve(process.cwd(), '..', '..', 'plugins'),
        path.resolve(process.cwd(), '..', 'plugins'),
      ];
      for (const dir of candidateDirs) {
        if (fs.existsSync(dir)) {
          await pluginLoader.loadFromDirectory(dir);
        }
      }
    }

    const unmask = req.query.unmask === 'true';
    const plugins = pluginLoader.getSummaries({ maskSecrets: !unmask });
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
    const unmask = req.query.unmask === 'true';
    const summary = pluginLoader.getSummary(id, { maskSecrets: !unmask });
    res.json({
      success: true,
      data: summary,
    });
  };

  public updatePluginStatus = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const id = typeof req.params.id === 'string' ? req.params.id : '';
    const { isEnabled } = req.body as { isEnabled: boolean };
    const previous = pluginLoader.getPlugin(id);
    const beforeState = previous ? { isEnabled: previous.isEnabled } : null;

    const updated = await pluginLoader.updatePluginStatus(id, isEnabled);

    const { actorUserId, actorAgentId, context } = getAuditContext();
    eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
      action: AUDIT_ACTIONS.UPDATE,
      resourceType: 'plugin',
      resourceId: id,
      actorUserId,
      actorAgentId,
      beforeState,
      afterState: { isEnabled },
      context,
    });

    res.json({
      success: true,
      message: `Plugin "${id}" ${isEnabled ? 'enabled' : 'disabled'} successfully`,
      data: updated,
    });
  };

  public updatePluginConfig = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const id = typeof req.params.id === 'string' ? req.params.id : '';
    const { config } = req.body as { config: Record<string, unknown> };
    const previous = pluginLoader.getPlugin(id);
    const beforeState = previous
      ? { config: maskConfigSecrets(previous.config ?? {}) }
      : null;

    const updated = await pluginLoader.updatePluginConfig(id, config);

    const { actorUserId, actorAgentId, context } = getAuditContext();
    eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
      action: AUDIT_ACTIONS.UPDATE,
      resourceType: 'plugin',
      resourceId: id,
      actorUserId,
      actorAgentId,
      beforeState,
      afterState: { config: maskConfigSecrets(config) },
      context,
    });

    res.json({
      success: true,
      message: `Plugin "${id}" configuration updated successfully`,
      data: updated,
    });
  };
}

export const pluginController = new PluginController();
