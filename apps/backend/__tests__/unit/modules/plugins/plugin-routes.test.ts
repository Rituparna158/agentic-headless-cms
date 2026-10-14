import { describe, it, expect, beforeEach, vi } from 'vitest';
import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import request from 'supertest';
import { pluginRouter } from '../../../../src/modules/plugins/plugin.routes.js';
import { pluginLoader } from '../../../../src/modules/plugins/plugin-loader.service.js';
import { eventBus } from '@repo/events';
import { EVENT_NAMES } from '@repo/constants';

vi.mock('@repo/middlewares', () => ({
  authenticateToken: (_req: unknown, _res: unknown, next: NextFunction) =>
    next(),
  validateBody:
    (_schema: unknown) =>
    (_req: unknown, _res: unknown, next: NextFunction) => {
      next();
    },
}));

vi.mock('../../../../src/modules/auth/rbac.middleware.js', () => ({
  requirePermission:
    (_permission: string) =>
    (_req: unknown, _res: unknown, next: NextFunction) =>
      next(),
}));

describe('Plugin Routes & Status Handling', () => {
  let app: Express;

  beforeEach(() => {
    pluginLoader.clear();
    vi.restoreAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/v1/plugins', pluginRouter);

    // Error handling middleware for ApiError
    app.use(
      (
        err: { statusCode?: number; message?: string },
        _req: Request,
        res: Response,
        _next: NextFunction,
      ) => {
        res.status(err.statusCode || 500).json({
          success: false,
          message: err.message,
        });
      },
    );
  });

  it('should serve routes when plugin is active and return 403 when disabled', async () => {
    pluginLoader.registerPlugin({
      config: {
        id: 'toggle-route-plugin',
        name: 'Toggle Route Plugin',
        version: '1.0.0',
      },
      routes: [
        {
          path: '/ping',
          method: 'get',
          handler: (_req: Request, res: Response) => {
            res.status(200).json({ message: 'pong' });
          },
        },
      ],
    });

    // 1. Initial request when active -> 200 OK
    const resActive = await request(app).get(
      '/api/v1/plugins/toggle-route-plugin/ping',
    );
    expect(resActive.status).toBe(200);
    expect(resActive.body).toEqual({ message: 'pong' });

    // 2. Disable plugin via status update
    await pluginLoader.updatePluginStatus('toggle-route-plugin', false);

    // 3. Request when disabled -> 403 Forbidden
    const resDisabled = await request(app).get(
      '/api/v1/plugins/toggle-route-plugin/ping',
    );
    expect(resDisabled.status).toBe(403);
    expect(resDisabled.body.message).toContain('is disabled');

    // 4. Re-enable plugin
    await pluginLoader.updatePluginStatus('toggle-route-plugin', true);

    // 5. Request when re-enabled -> 200 OK
    const resReEnabled = await request(app).get(
      '/api/v1/plugins/toggle-route-plugin/ping',
    );
    expect(resReEnabled.status).toBe(200);
    expect(resReEnabled.body).toEqual({ message: 'pong' });
  });

  it('should list plugins, mask secrets by default, and allow unmasked view', async () => {
    pluginLoader.registerPlugin(
      {
        config: {
          id: 'test-summary-plugin',
          name: 'Summary Plugin',
          version: '1.0.0',
        },
      },
      {
        isEnabled: true,
        config: {
          timeout: 5000,
          apiKey: 'sk_live_1234567890abcdef',
        },
      },
    );

    // Default masked
    const res = await request(app).get('/api/v1/plugins');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe('test-summary-plugin');
    expect(res.body.data[0].isEnabled).toBe(true);
    expect(res.body.data[0].config.timeout).toBe(5000);
    expect(res.body.data[0].config.apiKey).toBe('sk_l...cdef');

    // Single plugin detail masked
    const resDetail = await request(app).get(
      '/api/v1/plugins/test-summary-plugin',
    );
    expect(resDetail.status).toBe(200);
    expect(resDetail.body.data.config.apiKey).toBe('sk_l...cdef');

    // Unmasked request with query param
    const resUnmasked = await request(app).get(
      '/api/v1/plugins/test-summary-plugin?unmask=true',
    );
    expect(resUnmasked.status).toBe(200);
    expect(resUnmasked.body.data.config.apiKey).toBe(
      'sk_live_1234567890abcdef',
    );
  });

  it('should emit audit logs when status or config is updated via endpoints', async () => {
    const emitSpy = vi.spyOn(eventBus, 'emit');

    pluginLoader.registerPlugin({
      config: {
        id: 'audited-plugin',
        name: 'Audited Plugin',
        version: '1.0.0',
      },
    });

    // 1. Update status
    const statusRes = await request(app)
      .patch('/api/v1/plugins/audited-plugin/status')
      .send({ isEnabled: false });
    expect(statusRes.status).toBe(200);

    expect(emitSpy).toHaveBeenCalledWith(
      EVENT_NAMES.AUDIT_LOG,
      expect.objectContaining({
        resourceType: 'plugin',
        resourceId: 'audited-plugin',
        afterState: { isEnabled: false },
      }),
    );

    // 2. Update config
    const configRes = await request(app)
      .put('/api/v1/plugins/audited-plugin/config')
      .send({ config: { apiKey: 'sk_live_secretkey123', retries: 3 } });
    expect(configRes.status).toBe(200);

    expect(emitSpy).toHaveBeenCalledWith(
      EVENT_NAMES.AUDIT_LOG,
      expect.objectContaining({
        resourceType: 'plugin',
        resourceId: 'audited-plugin',
        afterState: expect.objectContaining({
          config: expect.objectContaining({
            retries: 3,
            apiKey: 'sk_l...y123', // secrets are masked in audit payload!
          }),
        }),
      }),
    );
  });
});
