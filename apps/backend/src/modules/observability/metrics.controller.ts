import { HTTP_STATUS } from '@repo/constants';
import { Request, Response } from 'express';
import { register, collectDefaultMetrics } from 'prom-client';
// Initialize default metrics
collectDefaultMetrics();
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
