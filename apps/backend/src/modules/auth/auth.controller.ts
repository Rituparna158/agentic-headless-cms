import {
  loginSchema,
  mfaVerifySchema,
  mfaChallengeSchema,
} from '@repo/validation';
import { AUTH_COOKIES, ERROR_MESSAGES, HTTP_STATUS } from '@repo/constants';
import type { AuthenticatedUser } from '@repo/types';
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
    const result = await authService.login(input);

    if ('mfaRequired' in result && result.mfaRequired) {
      logger.info('AuthController: login MFA challenge required');
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { mfaRequired: true, mfaToken: result.mfaToken },
            'MFA challenge required',
          ),
        );
      return;
    }

    const { user, token } = result as {
      user: AuthenticatedUser;
      token: string;
    };

    logger.debug({ email: input.email }, 'AuthController: setting auth cookie');
    res.cookie(AUTH_COOKIES.NAME, token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_COOKIES.MAX_AGE_MS,
    });

    logger.info({ userId: user.id }, 'AuthController: login success');
    res.status(200).json(new ApiResponse(200, user, 'Login successful'));
  },
);

export const logout: RequestHandler = asyncHandler(
  (req: Request, res: Response) => {
    logger.info('AuthController: logout start');
    res.clearCookie(AUTH_COOKIES.NAME, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    logger.info('AuthController: logout success');
    res.status(HTTP_STATUS.NO_CONTENT).send();
  },
);

export const getCurrentUser: RequestHandler = asyncHandler(
  (req: Request, res: Response) => {
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

export const ssoLogin: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('AuthController: ssoLogin start');
    const { url, state, nonce, codeVerifier } =
      await authService.getOidcAuthorizationUrl();

    res.cookie('sso_state', state, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      maxAge: 5 * 60 * 1000,
    });
    res.cookie('sso_nonce', nonce, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      maxAge: 5 * 60 * 1000,
    });
    res.cookie('sso_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      maxAge: 5 * 60 * 1000,
    });

    res.redirect(url);
  },
);

export const ssoCallback: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('AuthController: ssoCallback start');

    const cookies = req.cookies as Record<string, unknown> | undefined;
    const state = cookies?.sso_state;
    const nonce = cookies?.sso_nonce;
    const codeVerifier = cookies?.sso_code_verifier;

    if (
      typeof state !== 'string' ||
      typeof nonce !== 'string' ||
      typeof codeVerifier !== 'string'
    ) {
      throw new BadRequestError('Missing or expired SSO cookies');
    }

    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const reqUrl = `${protocol}://${host}${req.originalUrl}`;

    const { user, token } = await authService.ssoCallback(
      reqUrl,
      state,
      nonce,
      codeVerifier,
    );

    res.clearCookie('sso_state');
    res.clearCookie('sso_nonce');
    res.clearCookie('sso_code_verifier');

    res.cookie(AUTH_COOKIES.NAME, token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_COOKIES.MAX_AGE_MS,
    });

    logger.info({ userId: user.id }, 'AuthController: ssoCallback success');
    res.redirect(`${env.APP_URL}/`);
  },
);

export const enrollMfa: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('AuthController: enrollMfa start');
    const userId = req.user!.id;
    const result = await authService.enrollMfa(userId);
    res
      .status(200)
      .json(new ApiResponse(200, result, 'MFA enrollment initiated'));
  },
);

export const verifyMfa: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('AuthController: verifyMfa start');
    const userId = req.user!.id;
    const input = mfaVerifySchema.parse(req.body);
    const { user, token } = await authService.verifyMfa(userId, input.code);

    logger.debug(
      { userId },
      'AuthController: setting updated auth cookie from MFA verification',
    );
    res.cookie(AUTH_COOKIES.NAME, token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_COOKIES.MAX_AGE_MS,
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, user, 'MFA verified and enabled successfully'),
      );
  },
);

export const disableMfa: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('AuthController: disableMfa start');
    const userId = req.user!.id;
    const { user, token } = await authService.disableMfa(userId);

    logger.debug(
      { userId },
      'AuthController: setting updated auth cookie from MFA disablement',
    );
    res.cookie(AUTH_COOKIES.NAME, token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_COOKIES.MAX_AGE_MS,
    });

    res
      .status(200)
      .json(new ApiResponse(200, user, 'MFA disabled successfully'));
  },
);

export const verifyMfaChallenge: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('AuthController: verifyMfaChallenge start');
    const input = mfaChallengeSchema.parse(req.body);
    const { user, token } = await authService.verifyMfaChallenge(
      input.mfaToken,
      input.code,
    );

    logger.debug(
      { userId: user.id },
      'AuthController: setting auth cookie from MFA challenge',
    );
    res.cookie(AUTH_COOKIES.NAME, token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_COOKIES.MAX_AGE_MS,
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, user, 'MFA challenge verification successful'),
      );
  },
);
