import { Router } from 'express';
import {
  listWebhooks,
  createWebhook,
  deleteWebhook,
} from './webhooks.controller.js';
import {
  authenticateToken,
  requireAdmin,
} from '../../common/middlewares/auth.middleware.js';

export const webhooksRouter = Router();

webhooksRouter.use(authenticateToken, requireAdmin);

webhooksRouter.get('/', listWebhooks);
webhooksRouter.post('/', createWebhook);
webhooksRouter.delete('/:id', deleteWebhook);
