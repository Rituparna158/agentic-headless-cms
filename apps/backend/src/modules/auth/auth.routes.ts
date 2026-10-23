import { Router } from 'express';
import { authenticateToken } from '@repo/middlewares';
import { authRateLimiter } from '../../middlewares/rate-limit.middleware.js';
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
  requestMfaReset,
  completeMfaReset,
  requestPasswordReset,
  resetPassword,
} from './auth.controller.js';
export const authRouter = Router();
authRouter.post('/login', authRateLimiter, login);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticateToken, getCurrentUser);
authRouter.post('/accept-invite', acceptInvite);
authRouter.get('/sso', ssoLogin);
authRouter.get('/sso/callback', ssoCallback);
authRouter.post('/mfa/enroll', authenticateToken, enrollMfa);
authRouter.post('/mfa/verify', authenticateToken, verifyMfa);
authRouter.post('/mfa/challenge', authRateLimiter, verifyMfaChallenge);
authRouter.post('/mfa/disable', authenticateToken, disableMfa);
// MFA Reset flow routes (Public)
authRouter.post('/mfa/reset-request', authRateLimiter, requestMfaReset);
authRouter.post('/mfa/reset-complete', authRateLimiter, completeMfaReset);
// Password Reset flow routes (Public)
authRouter.post('/forgot-password', authRateLimiter, requestPasswordReset);
authRouter.post('/reset-password', authRateLimiter, resetPassword);
