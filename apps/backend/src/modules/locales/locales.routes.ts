import { Router } from 'express';
import {
  listLocales,
  createLocale,
  deleteLocale,
  setDefaultLocale,
} from './locales.controller.js';
import { authenticateToken, requireAdmin } from '@repo/middlewares';
export const localesRouter = Router();
localesRouter.use(authenticateToken);
localesRouter.get('/', listLocales);
localesRouter.post('/', requireAdmin, createLocale);
localesRouter.delete('/:id', requireAdmin, deleteLocale);
localesRouter.patch('/:id/default', requireAdmin, setDefaultLocale);
