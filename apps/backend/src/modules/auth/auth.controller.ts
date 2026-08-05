import { loginSchema } from '@repo/validation';
import { AUTH_COOKIES, ERROR_MESSAGES, HTTP_STATUS } from '@repo/constants';
import { Request, Response, RequestHandler } from 'express';

import {
  UnauthorizedError,
  BadRequestError,
  asyncHandler,
  ApiResponse,
} from '@repo/utils';
import { env } from '@repo/config';
import { logger } from '@repo/logger';
import { authService } from './auth.service.js';

export const login: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('AuthController: login start');
    const input = loginSchema.parse(req.body);
    const { user, token } = await authService.login(input);

    logger.debug({ email: input.email }, 'AuthController: setting auth cookie');
    res.cookie(AUTH_COOKIES.NAME, token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: AUTH_COOKIES.MAX_AGE_MS,
    });

    logger.info({ userId: user.id }, 'AuthController: login success');
    res.status(200).json(new ApiResponse(200, user, 'Login successful'));
  },
);

export const logout: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('AuthController: logout start');
    res.clearCookie(AUTH_COOKIES.NAME, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    logger.info('AuthController: logout success');
    res.status(HTTP_STATUS.NO_CONTENT).send();
  },
);

export const getCurrentUser: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('AuthController: getCurrentUser start');
    if (!req.user) {
      logger.warn('AuthController: getCurrentUser user not authenticated');
      throw new UnauthorizedError(ERROR_MESSAGES.AUTH.UNAUTHORIZED);
    }
    logger.info(
      { userId: req.user.id },
      'AuthController: getCurrentUser success',
    );
    res
      .status(200)
      .json(new ApiResponse(200, req.user, 'User retrieved successfully'));
  },
);

export const acceptInvite: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as {
      token: string;
      newPassword?: string;
    };
    const { token, newPassword } = body;
    logger.info('AuthController: acceptInvite start');

    if (!token || !newPassword) {
      logger.warn('AuthController: acceptInvite missing token or password');
      throw new BadRequestError(
        ERROR_MESSAGES.ACCESS.TOKEN_AND_PASSWORD_REQUIRED,
      );
    }

    if (newPassword.length < 8) {
      logger.warn('AuthController: acceptInvite password too short');
      throw new BadRequestError(ERROR_MESSAGES.ACCESS.PASSWORD_TOO_SHORT);
    }

    try {
      await authService.acceptInvite(token, newPassword);
      logger.info('AuthController: acceptInvite success');
      res.status(HTTP_STATUS.OK).json({ message: 'Password set successfully' });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (
          error instanceof UnauthorizedError ||
          error.message.includes('Invalid') ||
          error.message.includes('Expired')
        ) {
          throw new BadRequestError(error.message);
        }
      }
      throw error;
    }
  },
);
