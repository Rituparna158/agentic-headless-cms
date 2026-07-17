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

export const acceptInvite = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body as {
      token: string;
      newPassword?: string;
    };
    const { token, newPassword } = body;
    if (!token || !newPassword) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ error: ERROR_MESSAGES.ACCESS.TOKEN_AND_PASSWORD_REQUIRED });
    }

    if (newPassword.length < 8) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ error: ERROR_MESSAGES.ACCESS.PASSWORD_TOO_SHORT });
    }

    await authService.acceptInvite(token, newPassword);
    res.status(HTTP_STATUS.OK).json({ message: 'Password set successfully' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (
        error instanceof UnauthorizedError ||
        error.message.includes('Invalid') ||
        error.message.includes('Expired')
      ) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ error: error.message });
      }
    }
    next(error);
  }
};
