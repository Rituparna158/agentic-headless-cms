import { ApiError } from '@repo/utils';
import { logger } from '@repo/logger';
import { validatePluginDefinition } from './plugin-validator.js';
import {
  hookDispatcher,
  type HookDispatcherService,
} from './hook-dispatcher.service.js';
import type { LoadedPlugin, PluginSummary } from './types.js';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export class PluginLoaderService {
  private plugins = new Map<string, LoadedPlugin>();
  private dispatcher: HookDispatcherService;

  constructor(dispatcher: HookDispatcherService = hookDispatcher) {
    this.dispatcher = dispatcher;
  }

  /**
   * Registers and activates an in-memory or imported plugin definition.
   */
  public registerPlugin(definitionInput: unknown): LoadedPlugin {
    const definition = validatePluginDefinition(definitionInput);
    const { id } = definition.config;

    if (this.plugins.has(id)) {
      throw new ApiError(409, `Plugin with id "${id}" is already registered`);
    }

    try {
      this.dispatcher.registerHooks(id, definition.hooks);

      const loadedPlugin: LoadedPlugin = {
        definition,
        status: 'active',
        loadedAt: new Date(),
        routesCount: definition.routes?.length ?? 0,
        hooksCount: definition.hooks ? Object.keys(definition.hooks).length : 0,
      };

      this.plugins.set(id, loadedPlugin);
      logger.info(
        {
          pluginId: id,
          version: definition.config.version,
          routes: loadedPlugin.routesCount,
          hooks: loadedPlugin.hooksCount,
        },
        `Plugin "${id}" registered successfully`,
      );

      return loadedPlugin;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown registration error';
      logger.error(
        { pluginId: id, err: error },
        `Failed to register plugin "${id}"`,
      );

      const failedPlugin: LoadedPlugin = {
        definition,
        status: 'error',
        loadedAt: new Date(),
        error: errorMessage,
        routesCount: 0,
        hooksCount: 0,
      };

      this.plugins.set(id, failedPlugin);
      throw error;
    }
  }

  /**
   * Unregisters and removes a plugin and its hooks.
   */
  public unregisterPlugin(id: string): boolean {
    if (!this.plugins.has(id)) return false;

    this.dispatcher.unregisterHooks(id);
    this.plugins.delete(id);
    logger.info({ pluginId: id }, `Plugin "${id}" unregistered`);
    return true;
  }

  public getPlugin(id: string): LoadedPlugin | undefined {
    return this.plugins.get(id);
  }

  public getAllPlugins(): LoadedPlugin[] {
    return Array.from(this.plugins.values());
  }

  public getSummaries(): PluginSummary[] {
    return this.getAllPlugins().map((p) => ({
      id: p.definition.config.id,
      name: p.definition.config.name,
      version: p.definition.config.version,
      description: p.definition.config.description,
      author: p.definition.config.author,
      status: p.status,
      loadedAt: p.loadedAt.toISOString(),
      error: p.error,
      routes: (p.definition.routes ?? []).map((r) => ({
        method: r.method.toUpperCase(),
        path: `/api/v1/plugins/${p.definition.config.id}${r.path}`,
      })),
      hooks: p.definition.hooks ? Object.keys(p.definition.hooks) : [],
      uiExtensions: p.definition.uiExtensions,
    }));
  }

  public clear(): void {
    for (const id of this.plugins.keys()) {
      this.dispatcher.unregisterHooks(id);
    }
    this.plugins.clear();
  }

  /**
   * Discovers and loads plugin folders from a target directory.
   */
  public async loadFromDirectory(dirPath: string): Promise<number> {
    if (!fs.existsSync(dirPath)) {
      logger.debug(
        { dirPath },
        'Plugins directory does not exist, skipping discovery',
      );
      return 0;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    let loadedCount = 0;

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const pluginFolder = path.join(dirPath, entry.name);
      const possibleEntries = [
        path.join(pluginFolder, 'index.js'),
        path.join(pluginFolder, 'dist', 'index.js'),
      ];

      const entryFile = possibleEntries.find((f) => fs.existsSync(f));
      if (!entryFile) continue;

      try {
        const fileUrl = pathToFileURL(entryFile).href;
        const importedModule = (await import(fileUrl)) as {
          default?: unknown;
          plugin?: unknown;
        };
        const pluginDef =
          importedModule.default ?? importedModule.plugin ?? importedModule;

        this.registerPlugin(pluginDef);
        loadedCount++;
      } catch (error) {
        logger.error(
          { folder: entry.name, err: error },
          `Failed to load plugin from "${entry.name}"`,
        );
      }
    }

    logger.info({ count: loadedCount }, 'Plugins loaded from directory');
    return loadedCount;
  }
}

export const pluginLoader = new PluginLoaderService();
