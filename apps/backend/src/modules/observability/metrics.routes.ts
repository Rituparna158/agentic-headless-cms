import { Router, Request, Response, NextFunction } from 'express';
import { getMetrics, recordWebVitals } from './metrics.controller.js';
import { env } from '@repo/config';
import rateLimit from 'express-rate-limit';

const router = Router();

const metricsScrapeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

const vitalsBeaconLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

export const metricsAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  if (env.METRICS_TOKEN) {
    const headerToken =
      req.headers['x-metrics-token'] ||
      req.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!headerToken || headerToken !== env.METRICS_TOKEN) {
      return res.status(401).json({
        error: {
          message: 'Unauthorized: invalid or missing metrics token',
          code: 'UNAUTHORIZED_METRICS_ACCESS',
        },
      });
    }
  } else if (env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: {
        message:
          'Metrics endpoint is restricted. Configure METRICS_TOKEN to enable access.',
        code: 'FORBIDDEN_METRICS_ACCESS',
      },
    });
  }

  next();
};

router.get('/', metricsScrapeLimiter, metricsAuthMiddleware, getMetrics);
router.post('/vitals', vitalsBeaconLimiter, recordWebVitals);

export { router as metricsRouter };
