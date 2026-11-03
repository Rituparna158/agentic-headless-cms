import { HTTP_STATUS } from '@repo/constants';
import { logger } from '@repo/logger';
import { Request, Response } from 'express';
import {
  register,
  collectDefaultMetrics,
  Counter,
  Histogram,
} from 'prom-client';

// Initialize default metrics
collectDefaultMetrics();

export const webVitalsHistogram = new Histogram({
  name: 'web_vitals_metric_value',
  help: 'Core Web Vitals metric values collected via RUM beacon telemetry',
  labelNames: ['name', 'rating', 'pathname'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 3, 4, 5, 10],
});

export const webVitalsCounter = new Counter({
  name: 'web_vitals_events_total',
  help: 'Total count of Core Web Vitals beacon events recorded',
  labelNames: ['name', 'rating'],
});

export const getMetrics = async (req: Request, res: Response) => {
  try {
    const metrics = await register.metrics();
    res.set('Content-Type', register.contentType);
    res.send(metrics);
  } catch {
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send('Error collecting metrics');
  }
};

export function normalizeMetricPath(rawPath: unknown): string {
  if (typeof rawPath !== 'string' || !rawPath.trim()) {
    return 'unknown';
  }

  // Cap input length upfront to prevent memory issues from abnormally long inputs
  const boundedRaw = rawPath.trim().slice(0, 100);

  const [pathWithoutQuery = ''] = boundedRaw.split('?');
  const [cleanPath = ''] = pathWithoutQuery.split('#');

  let path = cleanPath;
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  // Normalize UUIDs (v4/v1) -> :id
  path = path.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    ':id',
  );
  // Normalize numeric IDs (e.g. /posts/123 -> /posts/:id)
  path = path.replace(/\/\d+(?=\/|$)/g, '/:id');
  // Normalize long hex hashes (16+ chars)
  path = path.replace(/\/[0-9a-f]{16,}(?=\/|$)/gi, '/:id');
  // Normalize long arbitrary dynamic segments (> 32 characters) to :param
  path = path.replace(/\/[^/?#]{33,}(?=\/|$)/g, '/:param');

  // Strip trailing slash unless root /
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  const ALLOWED_PREFIXES = [
    '/auth',
    '/dashboard',
    '/content',
    '/schemas',
    '/media',
    '/users',
    '/roles',
    '/audit',
    '/locales',
    '/webhooks',
    '/tokens',
    '/api-docs',
    '/health',
    '/',
  ];

  const matched = ALLOWED_PREFIXES.find((prefix) =>
    prefix === '/' ? path === '/' : path.startsWith(prefix),
  );

  if (matched) {
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 3) {
      return `/${segments.slice(0, 3).join('/')}/*`;
    }
    return path.length > 100 ? path.slice(0, 100) : path;
  }

  return '/other';
}

interface WebVitalPayloadItem {
  name?: unknown;
  value?: unknown;
  rating?: unknown;
  pathname?: unknown;
  id?: unknown;
  navigationType?: unknown;
}

export const recordWebVitals = (req: Request, res: Response): void => {
  try {
    const rawPayload: unknown = req.body;
    const events: unknown[] = Array.isArray(rawPayload)
      ? rawPayload
      : [rawPayload];

    for (const item of events) {
      if (!item || typeof item !== 'object') {
        continue;
      }
      const event = item as WebVitalPayloadItem;
      if (typeof event.name !== 'string' || typeof event.value !== 'number') {
        continue;
      }
      const name = event.name.toUpperCase();
      const rating =
        typeof event.rating === 'string' ? event.rating : 'unknown';
      const pathname = normalizeMetricPath(event.pathname);

      webVitalsCounter.inc({ name, rating });
      webVitalsHistogram.observe({ name, rating, pathname }, event.value);

      logger.info(
        {
          metric: name,
          value: event.value,
          rating,
          pathname,
          id: typeof event.id === 'string' ? event.id : undefined,
          navigationType:
            typeof event.navigationType === 'string'
              ? event.navigationType
              : undefined,
        },
        'Core Web Vitals beacon received',
      );
    }
    res.status(HTTP_STATUS.OK).json({ success: true });
  } catch (error: unknown) {
    logger.error({ err: error }, 'Error recording web vitals beacon');
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Failed to record vitals' });
  }
};
