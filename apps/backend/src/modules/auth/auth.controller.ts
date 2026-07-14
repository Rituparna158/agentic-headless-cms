import type { Request, Response, NextFunction } from 'express';
import { loginSchema } from '@repo/shared-types';
import { authService } from './auth.service.js';
import { UnauthorizedError } from '../../common/errors/http-error.js';
import { ERROR_MESSAGES, HTTP_STATUS, AUTH_COOKIES } from '@repo/shared-types';

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const input = loginSchema.parse(req.body);
    const { user, token } = await authService.login(input);

    res.cookie(AUTH_COOKIES.NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: AUTH_COOKIES.MAX_AGE_MS,
    });

    res.json(user);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: error.message });
      return;
    }
    next(error);
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie(AUTH_COOKIES.NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(HTTP_STATUS.NO_CONTENT).send();
};

export const getCurrentUser = (req: Request, res: Response) => {
  if (!req.user) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: ERROR_MESSAGES.AUTH.UNAUTHORIZED });
    return;
  }
  res.json(req.user);
};
