import { ApiError } from '@repo/utils';
import { logger } from '@repo/logger';
import { Router } from 'express';
import { validatePluginDefinition } from './plugin-validator.js';
import {
  hookDispatcher,
  type HookDispatcherService,
} from './hook-dispatcher.service.js';
import { PluginRepository } from '@repo/repository';
import type { LoadedPlugin, PluginSummary } from './types.js';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { maskConfigSecrets } from './mask-secrets.js';

export class PluginLoaderService {
  private plugins = new Map<string, LoadedPlugin>();
  private dispatcher: HookDispatcherService;
  private repository: PluginRepository;

  constructor(
    dispatcher: HookDispatcherService = hookDispatcher,
    repository: PluginRepository = new PluginRepository(),
  ) {
    this.dispatcher = dispatcher;
    this.repository = repository;
  }

  /**
   * Registers an in-memory or imported plugin definition.
   */
  public registerPlugin(
    definitionInput: unknown,
    options?: {
      isEnabled?: boolean;
      config?: Record<string, unknown>;
    },
  ): LoadedPlugin {
    const definition = validatePluginDefinition(definitionInput);
    const { id } = definition.config;

    if (this.plugins.has(id)) {
      throw new ApiError(409, `Plugin with id "${id}" is already registered`);
    }

    const isEnabled = options?.isEnabled ?? true;
    const config = options?.config ?? {};

    try {
      if (isEnabled) {
        this.dispatcher.registerHooks(id, definition.hooks, config);
      }

      let pluginRouter: Router | undefined;
      if (definition.routes && definition.routes.length > 0) {
        pluginRouter = Router();
        for (const route of definition.routes) {
          const middlewares = route.middlewares ?? [];
          const method = route.method.toLowerCase() as
            | 'get'
            | 'post'
            | 'put'
            | 'delete'
            | 'patch';
          pluginRouter[method](route.path, ...middlewares, route.handler);
        }
      }

      const loadedPlugin: LoadedPlugin = {
        definition,
        status: isEnabled ? 'active' : 'disabled',
        loadedAt: new Date(),
        routesCount: definition.routes?.length ?? 0,
        hooksCount: definition.hooks ? Object.keys(definition.hooks).length : 0,
        router: pluginRouter,
        config,
        isEnabled,
      };

      this.plugins.set(id, loadedPlugin);
      logger.info(
        {
          pluginId: id,
          version: definition.config.version,
          status: loadedPlugin.status,
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
        isEnabled: false,
        config: {},
      };

      this.plugins.set(id, failedPlugin);
      throw error;
    }
  }

  /**
   * Reconciles a discovered plugin with the persistent database storage.
   */
  public async reconcilePlugin(
    definitionInput: unknown,
  ): Promise<LoadedPlugin> {
    const definition = validatePluginDefinition(definitionInput);
    const { id, name, version } = definition.config;

    let isEnabled = true;
    let config: Record<string, unknown> = {};

    try {
      const existing = await this.repository.findById(id);
      if (existing) {
        isEnabled = existing.isEnabled;
        config = existing.config ?? {};
        // Sync metadata without altering persisted status or config
        await this.repository.upsert({
          id,
          name,
          version,
          isEnabled,
          config,
        });
      } else {
        // Auto-insert newly discovered plugin as enabled
        const created = await this.repository.upsert({
          id,
          name,
          version,
          isEnabled: true,
          config: {},
        });
        isEnabled = created.isEnabled;
        config = created.config ?? {};
      }
    } catch (err) {
      logger.warn(
        { id, err },
        'Failed to reconcile plugin with database; proceeding with in-memory defaults',
      );
    }

    return this.registerPlugin(definition, { isEnabled, config });
  }

  /**
   * Toggles plugin status (enabled / disabled) and persists to DB.
   */
  public async updatePluginStatus(
    id: string,
    isEnabled: boolean,
  ): Promise<PluginSummary> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new ApiError(404, `Plugin "${id}" not found`);
    }

    try {
      await this.repository.updateStatus(id, isEnabled);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 404) {
        await this.repository
          .upsert({
            id,
            name: plugin.definition.config.name,
            version: plugin.definition.config.version,
            isEnabled,
            config: plugin.config ?? {},
          })
          .catch(() => {});
      } else {
        logger.warn(
          { id, err },
          `Could not persist plugin status for "${id}" to database`,
        );
      }
    }

    plugin.isEnabled = isEnabled;
    plugin.status = isEnabled ? 'active' : 'disabled';

    if (isEnabled) {
      this.dispatcher.registerHooks(id, plugin.definition.hooks, plugin.config);
      logger.info(
        { pluginId: id },
        `Plugin "${id}" enabled and hooks activated`,
      );
    } else {
      this.dispatcher.unregisterHooks(id);
      logger.info(
        { pluginId: id },
        `Plugin "${id}" disabled and hooks deactivated`,
      );
    }

    return this.getSummary(id)!;
  }

  /**
   * Updates plugin configuration settings and persists to DB.
   */
  public async updatePluginConfig(
    id: string,
    config: Record<string, unknown>,
  ): Promise<PluginSummary> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new ApiError(404, `Plugin "${id}" not found`);
    }

    try {
      await this.repository.updateConfig(id, config);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 404) {
        await this.repository
          .upsert({
            id,
            name: plugin.definition.config.name,
            version: plugin.definition.config.version,
            isEnabled: plugin.isEnabled ?? true,
            config,
          })
          .catch(() => {});
      } else {
        logger.warn(
          { id, err },
          `Could not persist plugin config for "${id}" to database`,
        );
      }
    }

    plugin.config = config;
    this.dispatcher.updatePluginConfig(id, config);
    logger.info({ pluginId: id }, `Plugin "${id}" config updated`);

    return this.getSummary(id)!;
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

  public getRouter(id: string): Router | undefined {
    return this.plugins.get(id)?.router;
  }

  public getAllPlugins(): LoadedPlugin[] {
    return Array.from(this.plugins.values());
  }

  public getSummary(
    id: string,
    options?: { maskSecrets?: boolean },
  ): PluginSummary | undefined {
    const p = this.plugins.get(id);
    if (!p) return undefined;
    const shouldMask = options?.maskSecrets ?? true;
    const rawConfig = p.config ?? {};
    return {
      id: p.definition.config.id,
      name: p.definition.config.name,
      version: p.definition.config.version,
      description: p.definition.config.description,
      author: p.definition.config.author,
      status: p.status,
      isEnabled: p.status === 'active',
      config: shouldMask ? maskConfigSecrets(rawConfig) : rawConfig,
      loadedAt: p.loadedAt.toISOString(),
      error: p.error,
      routes: (p.definition.routes ?? []).map((r) => ({
        method: r.method.toUpperCase(),
        path: `/api/v1/plugins/${p.definition.config.id}${r.path}`,
      })),
      hooks: p.definition.hooks ? Object.keys(p.definition.hooks) : [],
      uiExtensions: p.definition.uiExtensions,
    };
  }

  public getSummaries(options?: { maskSecrets?: boolean }): PluginSummary[] {
    return Array.from(this.plugins.keys())
      .map((id) => this.getSummary(id, options))
      .filter((s): s is PluginSummary => Boolean(s));
  }

  /**
   * Checks if a request matches an active plugin's public route (auth === false).
   */
  public isPublicPluginRoute(method: string, urlPath: string): boolean {
    const normalizedMethod = method.toLowerCase();
    const cleanUrl = urlPath.split('?')[0] || '';

    for (const [id, plugin] of this.plugins.entries()) {
      if (plugin.status !== 'active') continue;
      const routes = plugin.definition.routes ?? [];
      for (const route of routes) {
        if (
          route.auth === false &&
          route.method.toLowerCase() === normalizedMethod
        ) {
          const basePath = `/api/v1/plugins/${id}${route.path}`;
          const regexPattern = basePath
            .replace(/\/+$/, '')
            .replace(/\/:[^/]+/g, '/[^/]+');
          const regex = new RegExp(`^${regexPattern}/?$`, 'i');
          if (regex.test(cleanUrl)) {
            return true;
          }
        }
      }
    }
    return false;
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

        await this.reconcilePlugin(pluginDef);
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
