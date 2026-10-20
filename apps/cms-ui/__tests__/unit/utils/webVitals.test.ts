import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sendBeaconMetric,
  initWebVitals,
  getBeaconUrl,
} from '../../../src/utils/webVitals';
import type { Metric } from 'web-vitals';

vi.mock('web-vitals', () => ({
  onCLS: vi.fn((cb) =>
    cb({ id: 'cls-1', name: 'CLS', value: 0.05, rating: 'good', delta: 0.05 }),
  ),
  onINP: vi.fn((cb) =>
    cb({ id: 'inp-1', name: 'INP', value: 40, rating: 'good', delta: 40 }),
  ),
  onLCP: vi.fn((cb) =>
    cb({ id: 'lcp-1', name: 'LCP', value: 1200, rating: 'good', delta: 1200 }),
  ),
  onFCP: vi.fn(),
  onTTFB: vi.fn(),
}));

describe('webVitals utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('determines the beacon URL properly', () => {
    const url = getBeaconUrl();
    expect(url).toContain('/telemetry/vitals');
  });

  it('sends metric via sendBeacon when available', () => {
    const sendBeaconMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      value: sendBeaconMock,
      writable: true,
      configurable: true,
    });

    const metric: Metric = {
      id: 'v1-123',
      name: 'LCP',
      value: 1500.4,
      rating: 'good',
      delta: 1500.4,
      navigationType: 'navigate',
      navigationId: 1,
      entries: [],
    };

    sendBeaconMetric(metric, '/custom/endpoint');
    expect(sendBeaconMock).toHaveBeenCalledWith(
      '/custom/endpoint',
      expect.any(Blob),
    );
  });

  it('falls back to fetch when sendBeacon returns false', () => {
    const sendBeaconMock = vi.fn().mockReturnValue(false);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    Object.defineProperty(navigator, 'sendBeacon', {
      value: sendBeaconMock,
      writable: true,
      configurable: true,
    });
    globalThis.fetch = fetchMock;

    const metric: Metric = {
      id: 'v1-456',
      name: 'CLS',
      value: 0.0823,
      rating: 'good',
      delta: 0.0823,
      navigationType: 'reload',
      navigationId: 1,
      entries: [],
    };

    sendBeaconMetric(metric, '/custom/endpoint');
    expect(sendBeaconMock).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      '/custom/endpoint',
      expect.objectContaining({
        method: 'POST',
        keepalive: true,
      }),
    );
  });

  it('initializes web-vitals hooks without throwing', () => {
    expect(() => initWebVitals()).not.toThrow();
  });
});
