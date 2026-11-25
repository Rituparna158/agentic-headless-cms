import { Router } from 'express';
import {
  listWebhooks,
  createWebhook,
  deleteWebhook,
  testWebhook,
  listWebhookDeliveries,
  listDlqDeliveries,
  retryWebhookDelivery,
  replayWebhookDelivery,
  processWebhookRetries,
} from './webhooks.controller.js';
import {
  authenticateToken,
  requireAdmin,
  validateBody,
} from '@repo/middlewares';
import { createWebhookSchema } from './webhooks.schema.js';

export const webhooksRouter = Router();
webhooksRouter.use(authenticateToken, requireAdmin);
webhooksRouter.get('/', listWebhooks);
webhooksRouter.post('/', validateBody(createWebhookSchema), createWebhook);
webhooksRouter.post('/retries/process', processWebhookRetries);
webhooksRouter.post('/:id/test', testWebhook);
webhooksRouter.get('/:id/deliveries', listWebhookDeliveries);
webhooksRouter.get('/:id/dlq', listDlqDeliveries);
webhooksRouter.post('/:id/deliveries/:deliveryId/retry', retryWebhookDelivery);
webhooksRouter.post(
  '/:id/deliveries/:deliveryId/replay',
  replayWebhookDelivery,
);
webhooksRouter.delete('/:id', deleteWebhook);
