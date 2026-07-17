import { Router } from 'express';
import { getMetrics } from './metrics.controller.js';

const router = Router();

router.get('/', getMetrics);

export { router as metricsRouter };
