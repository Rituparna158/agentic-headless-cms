import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginLoaderService } from '../../../../src/modules/plugins/plugin-loader.service.js';
import { HookDispatcherService } from '../../../../src/modules/plugins/hook-dispatcher.service.js';
import { ApiError } from '@repo/utils';
import type { Request, Response } from 'express';

describe('PluginLoaderService', () => {
  let dispatcher: HookDispatcherService;
  let loader: PluginLoaderService;

  beforeEach(() => {
    dispatcher = new HookDispatcherService();
    loader = new PluginLoaderService(dispatcher);
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
});
