import { Router } from 'express';

import { authenticateToken } from '@repo/middlewares';
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
