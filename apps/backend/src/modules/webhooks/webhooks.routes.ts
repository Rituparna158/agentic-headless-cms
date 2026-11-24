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
import { authenticateToken, requireAdmin } from '@repo/middlewares';
export const webhooksRouter = Router();
webhooksRouter.use(authenticateToken, requireAdmin);
webhooksRouter.get('/', listWebhooks);
webhooksRouter.post('/', createWebhook);
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
