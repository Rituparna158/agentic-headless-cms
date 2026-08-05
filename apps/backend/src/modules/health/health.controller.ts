import type { Request, Response, RequestHandler } from 'express';
import { checkReadiness } from './health.service.js';
import { asyncHandler } from '@repo/utils';
import { logger } from '@repo/logger';

export const liveness: RequestHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    logger.info('HealthController: liveness start');
    res.status(200).json({ status: 'ok' });
  },
);

export const readiness: RequestHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    logger.info('HealthController: readiness start');
    const result = await checkReadiness();
    logger.debug(
      { healthy: result.healthy },
      'HealthController: readiness check completed',
    );
    res.status(result.healthy ? 200 : 503).json({
      status: result.healthy ? 'ok' : 'error',
      dependencies: result.dependencies,
    });
  },
);
