import { describe, it, expect, vi } from 'vitest';
import {
  recordWebVitals,
  getMetrics,
  normalizeMetricPath,
} from '../../../src/modules/observability/metrics.controller.js';
import { metricsAuthMiddleware } from '../../../src/modules/observability/metrics.routes.js';
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

  describe('normalizeMetricPath', () => {
    it('normalizes UUIDs and numeric IDs to :id', () => {
      expect(
        normalizeMetricPath('/content/123e4567-e89b-12d3-a456-426614174000'),
      ).toBe('/content/:id');
      expect(normalizeMetricPath('/content/42')).toBe('/content/:id');
    });

    it('strips query parameters and hashes', () => {
      expect(normalizeMetricPath('/auth/login?redirect=/admin#top')).toBe(
        '/auth/login',
      );
    });

    it('maps unrecognized paths to /other to prevent cardinality explosion', () => {
      expect(normalizeMetricPath('/random-endpoint-1234567')).toBe('/other');
    });

    it('handles empty or non-string inputs safely', () => {
      expect(normalizeMetricPath('')).toBe('unknown');
      expect(normalizeMetricPath(null)).toBe('unknown');
    });
  });

  describe('metricsAuthMiddleware', () => {
    it('allows in test environment', () => {
      const req = { headers: {} } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn();

      metricsAuthMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
