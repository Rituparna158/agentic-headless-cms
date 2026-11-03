import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';

export interface WebVitalsPayload {
  id: string;
  name: string;
  value: number;
  rating: string;
  delta: number;
  navigationType?: string;
  pathname: string;
  timestamp: number;
}

export const getBeaconUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return `${envUrl.replace(/\/$/, '')}/telemetry/vitals`;
  }
  return '/api/v1/telemetry/vitals';
};

export const sendBeaconMetric = (
  metric: Metric,
  endpoint: string = getBeaconUrl(),
): void => {
  const payload: WebVitalsPayload = {
    id: metric.id,
    name: metric.name,
    // Convert CLS to score, others to milliseconds
    value:
      metric.name === 'CLS'
        ? parseFloat(metric.value.toFixed(4))
        : Math.round(metric.value),
    rating: metric.rating,
    delta:
      metric.name === 'CLS'
        ? parseFloat(metric.delta.toFixed(4))
        : Math.round(metric.delta),
    navigationType: metric.navigationType,
    pathname: typeof window !== 'undefined' ? window.location.pathname : '',
    timestamp: Date.now(),
  };

  const json = JSON.stringify(payload);

  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.sendBeacon === 'function'
  ) {
    const blob = new Blob([json], { type: 'application/json' });
    const success = navigator.sendBeacon(endpoint, blob);
    if (success) return;
  }

  if (typeof fetch === 'function') {
    fetch(endpoint, {
      method: 'POST',
      body: json,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {
      // Beacon errors should not disrupt UX
    });
  }
};

export const initWebVitals = (customEndpoint?: string): void => {
  try {
    const handler = (metric: Metric) =>
      sendBeaconMetric(metric, customEndpoint);
    onCLS(handler);
    onINP(handler);
    onLCP(handler);
    onFCP(handler);
    onTTFB(handler);
  } catch (err) {
    // Fail silently in environments where PerformanceObserver is not supported
    console.debug('Failed to initialize Core Web Vitals telemetry', err);
  }
};
