import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { definePlugin } from '../src/index.js';

describe('Plugin Express Routes', () => {
  it('should accept valid HTTP method configurations and handlers', () => {
    const handler = (req: Request, res: Response, _next: NextFunction) => {
      res.status(200).json({ status: 'ok' });
    };

    const plugin = definePlugin({
      config: {
        id: 'routes-plugin',
        name: 'Routes Plugin',
        version: '1.0.0',
      },
      routes: [
        {
          path: '/health',
          method: 'get',
          handler,
        },
        {
          path: '/data',
          method: 'post',
          handler,
        },
      ],
    });

    expect(plugin.routes).toBeDefined();
    const routes = plugin.routes!;
    expect(routes).toHaveLength(2);

    const route0 = routes[0]!;
    const route1 = routes[1]!;

    expect(route0.path).toBe('/health');
    expect(route0.method).toBe('get');
    expect(route1.path).toBe('/data');
    expect(route1.method).toBe('post');
  });

  it('should support route-specific middleware chain definitions', () => {
    const mockMiddleware = vi.fn(
      (req: Request, res: Response, next: NextFunction) => {
        next();
      },
    );

    const handler = (req: Request, res: Response) => {
      res.sendStatus(200);
    };

    const plugin = definePlugin({
      config: {
        id: 'middleware-plugin',
        name: 'Middleware Plugin',
        version: '1.0.0',
      },
      routes: [
        {
          path: '/secure',
          method: 'put',
          middlewares: [mockMiddleware],
          handler,
        },
      ],
    });

    expect(plugin.routes).toBeDefined();
    const routes = plugin.routes!;
    const route0 = routes[0]!;
    expect(route0.middlewares).toBeDefined();
    const middlewares = route0.middlewares!;
    expect(middlewares).toHaveLength(1);
    expect(middlewares[0]).toBe(mockMiddleware);
  });
});
