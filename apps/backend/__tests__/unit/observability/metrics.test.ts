import { describe, it, expect, vi } from 'vitest';
import {
  recordWebVitals,
  getMetrics,
} from '../../../src/modules/observability/metrics.controller.js';
import { Request, Response } from 'express';

describe('Metrics & Web Vitals Controller', () => {
  it('should successfully record web vitals beacon payload', async () => {
    const req = {
      body: {
        id: 'v1-test',
        name: 'LCP',
        value: 1200,
        rating: 'good',
        pathname: '/posts',
      },
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await recordWebVitals(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('should return metrics with Prometheus content-type', async () => {
    const req = {} as Request;
    const res = {
      set: vi.fn(),
      send: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;

    await getMetrics(req, res);

    expect(res.set).toHaveBeenCalledWith('Content-Type', expect.any(String));
    expect(res.send).toHaveBeenCalled();
  });
});
