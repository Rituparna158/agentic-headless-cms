import { Router } from 'express';
import {
  login,
  logout,
  getCurrentUser,
  acceptInvite,
} from './auth.controller.js';
import { authenticateToken } from '../../common/middlewares/auth.middleware.js';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticateToken, getCurrentUser);
authRouter.post('/accept-invite', acceptInvite);
