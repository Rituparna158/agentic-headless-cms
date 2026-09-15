import { Router } from 'express';
import {
  listWebhooks,
  createWebhook,
  deleteWebhook,
  testWebhook,
  listWebhookDeliveries,
} from './webhooks.controller.js';
import { authenticateToken, requireAdmin } from '@repo/middlewares';
export const webhooksRouter = Router();
webhooksRouter.use(authenticateToken, requireAdmin);
webhooksRouter.get('/', listWebhooks);
webhooksRouter.post('/', createWebhook);
webhooksRouter.post('/:id/test', testWebhook);
webhooksRouter.get('/:id/deliveries', listWebhookDeliveries);
webhooksRouter.delete('/:id', deleteWebhook);
