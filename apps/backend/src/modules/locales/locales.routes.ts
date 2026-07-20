import { Router } from 'express';
import {
  listLocales,
  createLocale,
  deleteLocale,
} from './locales.controller.js';
import {
  authenticateToken,
  requireAdmin,
} from '../../common/middlewares/auth.middleware.js';

export const localesRouter = Router();

localesRouter.use(authenticateToken, requireAdmin);

localesRouter.get('/', listLocales);
localesRouter.post('/', createLocale);
localesRouter.delete('/:id', deleteLocale);
