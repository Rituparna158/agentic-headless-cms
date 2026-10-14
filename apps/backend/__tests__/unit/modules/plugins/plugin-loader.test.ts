import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginLoaderService } from '../../../../src/modules/plugins/plugin-loader.service.js';
import { HookDispatcherService } from '../../../../src/modules/plugins/hook-dispatcher.service.js';
import type { PluginRepository } from '@repo/repository';
import { ApiError } from '@repo/utils';
import type { Request, Response } from 'express';

describe('PluginLoaderService', () => {
  let dispatcher: HookDispatcherService;
  let mockRepo: Partial<PluginRepository>;
  let loader: PluginLoaderService;

  beforeEach(() => {
    dispatcher = new HookDispatcherService();
    mockRepo = {
      findAll: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockImplementation((input) =>
        Promise.resolve({
          id: input.id,
          name: input.name,
          version: input.version,
          isEnabled: input.isEnabled ?? true,
          config: input.config ?? {},
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
      updateStatus: vi.fn().mockImplementation((id, isEnabled) =>
        Promise.resolve({
          id,
          name: 'Plugin',
          version: '1.0.0',
          isEnabled,
          config: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
      updateConfig: vi.fn().mockImplementation((id, config) =>
        Promise.resolve({
          id,
          name: 'Plugin',
          version: '1.0.0',
          isEnabled: true,
          config,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
    };
    loader = new PluginLoaderService(dispatcher, mockRepo as PluginRepository);
  });

  it('should register a valid plugin successfully', () => {
    const plugin = {
      config: {
        id: 'sample-plugin',
        name: 'Sample Plugin',
        version: '1.0.0',
      },
      hooks: {
        'content.beforeCreate': () => {},
      },
    };

    const loaded = loader.registerPlugin(plugin);

    expect(loaded.status).toBe('active');
    expect(loaded.definition.config.id).toBe('sample-plugin');
    expect(loaded.hooksCount).toBe(1);
    expect(loader.getPlugin('sample-plugin')).toBeDefined();
  });

  it('should throw 409 conflict if registering duplicate plugin id', () => {
    const plugin = {
      config: {
        id: 'duplicate-plugin',
        name: 'Duplicate Plugin',
        version: '1.0.0',
      },
    };

    loader.registerPlugin(plugin);
    expect(() => loader.registerPlugin(plugin)).toThrow(ApiError);
  });

  it('should unregister a plugin and clear its hooks', () => {
    const plugin = {
      config: {
        id: 'temp-plugin',
        name: 'Temp Plugin',
        version: '1.0.0',
      },
      hooks: {
        'content.beforeCreate': () => {},
      },
    };

    loader.registerPlugin(plugin);
    expect(dispatcher.getRegisteredHookNames()).toContain(
      'content.beforeCreate',
    );

    const result = loader.unregisterPlugin('temp-plugin');
    expect(result).toBe(true);
    expect(loader.getPlugin('temp-plugin')).toBeUndefined();
    expect(dispatcher.getRegisteredHookNames()).not.toContain(
      'content.beforeCreate',
    );
  });

  it('should reconcile new plugin by auto-inserting as enabled', async () => {
    const plugin = {
      config: {
        id: 'new-discovered-plugin',
        name: 'New Plugin',
        version: '1.0.0',
      },
      hooks: {
        'content.beforeCreate': () => {},
      },
    };

    const loaded = await loader.reconcilePlugin(plugin);

    expect(mockRepo.findById).toHaveBeenCalledWith('new-discovered-plugin');
    expect(mockRepo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'new-discovered-plugin',
        isEnabled: true,
      }),
    );
    expect(loaded.status).toBe('active');
    expect(dispatcher.getRegisteredHookNames()).toContain(
      'content.beforeCreate',
    );
  });

  it('should reconcile disabled plugin without registering its hooks', async () => {
    mockRepo.findById = vi.fn().mockResolvedValue({
      id: 'disabled-plugin',
      name: 'Disabled Plugin',
      version: '1.0.0',
      isEnabled: false,
      config: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const plugin = {
      config: {
        id: 'disabled-plugin',
        name: 'Disabled Plugin',
        version: '1.0.0',
      },
      hooks: {
        'content.beforeCreate': () => {},
      },
    };

    const loaded = await loader.reconcilePlugin(plugin);

    expect(loaded.status).toBe('disabled');
    expect(dispatcher.getRegisteredHookNames()).not.toContain(
      'content.beforeCreate',
    );
  });

  it('should toggle status to disabled, unregister hooks, and update DB', async () => {
    const plugin = {
      config: {
        id: 'toggle-plugin',
        name: 'Toggle Plugin',
        version: '1.0.0',
      },
      hooks: {
        'content.beforeCreate': () => {},
      },
    };

    loader.registerPlugin(plugin);
    expect(dispatcher.getRegisteredHookNames()).toContain(
      'content.beforeCreate',
    );

    const summary = await loader.updatePluginStatus('toggle-plugin', false);
    expect(summary.status).toBe('disabled');
    expect(summary.isEnabled).toBe(false);
    expect(mockRepo.updateStatus).toHaveBeenCalledWith('toggle-plugin', false);
    expect(dispatcher.getRegisteredHookNames()).not.toContain(
      'content.beforeCreate',
    );

    // Re-enable
    const reEnabled = await loader.updatePluginStatus('toggle-plugin', true);
    expect(reEnabled.status).toBe('active');
    expect(reEnabled.isEnabled).toBe(true);
    expect(dispatcher.getRegisteredHookNames()).toContain(
      'content.beforeCreate',
    );
  });

  it('should update plugin configuration and persist to DB', async () => {
    const plugin = {
      config: {
        id: 'config-plugin',
        name: 'Config Plugin',
        version: '1.0.0',
      },
      hooks: {
        'content.beforeCreate': () => {},
      },
    };

    loader.registerPlugin(plugin);

    const summary = await loader.updatePluginConfig('config-plugin', {
      apiKey: 'secret-123',
    });

    expect(summary.config).toEqual({ apiKey: 'secr...-123' });
    expect(loader.getPlugin('config-plugin')?.config).toEqual({
      apiKey: 'secret-123',
    });
    expect(mockRepo.updateConfig).toHaveBeenCalledWith('config-plugin', {
      apiKey: 'secret-123',
    });
  });

  it('should return formatted summaries for active plugins', () => {
    loader.registerPlugin({
      config: {
        id: 'slug-gen',
        name: 'Slug Generator',
        version: '1.2.0',
        description: 'Auto-generates clean slugs',
      },
      routes: [
        {
          path: '/preview',
          method: 'post',
          handler: () => {},
        },
      ],
      hooks: {
        'content.beforeCreate': () => {},
      },
    });

    const summaries = loader.getSummaries();
    expect(summaries).toHaveLength(1);
    const summary = summaries[0];
    expect(summary?.id).toBe('slug-gen');
    expect(summary?.routes[0]?.path).toBe('/api/v1/plugins/slug-gen/preview');
    expect(summary?.hooks).toEqual(['content.beforeCreate']);
    expect(summary?.isEnabled).toBe(true);
  });

  it('should initialize an isolated Express router supporting route parameters', () => {
    let capturedParam = '';
    loader.registerPlugin({
      config: {
        id: 'param-plugin',
        name: 'Param Plugin',
        version: '1.0.0',
      },
      routes: [
        {
          path: '/items/:id',
          method: 'get',
          handler: (req: Request, res: Response) => {
            capturedParam = (req.params as Record<string, string>).id || '';
            res.status(200).json({ id: capturedParam });
          },
        },
      ],
    });

    const router = loader.getRouter('param-plugin');
    expect(router).toBeDefined();

    const mockReq = {
      method: 'GET',
      url: '/items/item-456',
      params: {},
    } as unknown as Request;
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn();

    router!(mockReq, mockRes, next);

    expect(capturedParam).toBe('item-456');
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ id: 'item-456' });
  });

  it('should gracefully handle non-existent plugins directory', async () => {
    const count = await loader.loadFromDirectory(
      '/non/existent/path/for/plugins',
    );
    expect(count).toBe(0);
  });

  it('should mask sensitive configuration values by default in summaries and allow unmasked view', () => {
    loader.registerPlugin(
      {
        config: {
          id: 'secret-plugin',
          name: 'Secret Plugin',
          version: '1.0.0',
        },
      },
      {
        isEnabled: true,
        config: {
          apiKey: 'sk_live_1234567890abcdef',
          webhookSecret: 'shortsec',
          timeout: 5000,
        },
      },
    );

    // Default masked
    const maskedSummary = loader.getSummary('secret-plugin');
    expect(maskedSummary?.config.apiKey).toBe('sk_l...cdef');
    expect(maskedSummary?.config.webhookSecret).toBe('********');
    expect(maskedSummary?.config.timeout).toBe(5000);

    // Explicit unmasked
    const unmaskedSummary = loader.getSummary('secret-plugin', {
      maskSecrets: false,
    });
    expect(unmaskedSummary?.config.apiKey).toBe('sk_live_1234567890abcdef');
    expect(unmaskedSummary?.config.webhookSecret).toBe('shortsec');
  });

  it('should identify public plugin routes and reject non-public or disabled plugin routes in isPublicPluginRoute', async () => {
    loader.registerPlugin({
      config: {
        id: 'webhook-plugin',
        name: 'Webhook Plugin',
        version: '1.0.0',
      },
      routes: [
        {
          path: '/stripe/events',
          method: 'post',
          auth: false,
          handler: () => {},
        },
        {
          path: '/orders/:orderId',
          method: 'get',
          auth: false,
          handler: () => {},
        },
        {
          path: '/internal/status',
          method: 'get',
          // auth defaults to true (not public)
          handler: () => {},
        },
      ],
    });

    // 1. Matching public routes
    expect(
      loader.isPublicPluginRoute(
        'POST',
        '/api/v1/plugins/webhook-plugin/stripe/events',
      ),
    ).toBe(true);
    expect(
      loader.isPublicPluginRoute(
        'GET',
        '/api/v1/plugins/webhook-plugin/orders/ord_123',
      ),
    ).toBe(true);

    // 2. Query parameters on public route
    expect(
      loader.isPublicPluginRoute(
        'POST',
        '/api/v1/plugins/webhook-plugin/stripe/events?verify=true',
      ),
    ).toBe(true);

    // 3. Private route -> false
    expect(
      loader.isPublicPluginRoute(
        'GET',
        '/api/v1/plugins/webhook-plugin/internal/status',
      ),
    ).toBe(false);

    // 4. Mismatched method -> false
    expect(
      loader.isPublicPluginRoute(
        'GET',
        '/api/v1/plugins/webhook-plugin/stripe/events',
      ),
    ).toBe(false);

    // 5. When plugin is disabled -> false
    await loader.updatePluginStatus('webhook-plugin', false);
    expect(
      loader.isPublicPluginRoute(
        'POST',
        '/api/v1/plugins/webhook-plugin/stripe/events',
      ),
    ).toBe(false);
  });
});
