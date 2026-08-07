import { Router } from 'express';

import { authenticateToken } from '@repo/middlewares';
import {
  acceptInvite,
  getCurrentUser,
  login,
  logout,
  ssoLogin,
  ssoCallback,
  enrollMfa,
  verifyMfa,
  verifyMfaChallenge,
  disableMfa,
} from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticateToken, getCurrentUser);
authRouter.post('/accept-invite', acceptInvite);

authRouter.get('/sso', ssoLogin);
authRouter.get('/sso/callback', ssoCallback);

authRouter.post('/mfa/enroll', authenticateToken, enrollMfa);
authRouter.post('/mfa/verify', authenticateToken, verifyMfa);
authRouter.post('/mfa/challenge', verifyMfaChallenge);
authRouter.post('/mfa/disable', authenticateToken, disableMfa);
