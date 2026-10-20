import { Router } from 'express';
import { getMetrics, recordWebVitals } from './metrics.controller.js';
const router = Router();
router.get('/', getMetrics);
router.post('/vitals', recordWebVitals);
export { router as metricsRouter };
