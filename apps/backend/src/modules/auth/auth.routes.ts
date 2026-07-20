import { Router } from 'express';

import { authenticateToken } from '../../common/middlewares/auth.middleware.js';
import {
  acceptInvite,
  getCurrentUser,
  login,
  logout,
} from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticateToken, getCurrentUser);
authRouter.post('/accept-invite', acceptInvite);
