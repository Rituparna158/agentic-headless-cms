import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthenticatedUser } from '@repo/types';
import { env } from '@repo/config';
import { ERROR_MESSAGES, HTTP_STATUS, AUTH_COOKIES } from '@repo/constants';

function errorJson(res: Response, status: number, message: string) {
  const req = res.req as unknown as Request;
  const requestId = req && typeof req.id === 'string' ? req.id : undefined;
  return res.status(status).json({ error: { message, requestId } });
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = (req.cookies as Record<string, string> | undefined)?.[
    AUTH_COOKIES.NAME
  ];

  if (!token) {
    errorJson(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH.NO_TOKEN);
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUser & {
      isMfaChallenge?: boolean;
    };
    if (decoded.isMfaChallenge) {
      errorJson(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.INVALID_TOKEN,
      );
      return;
    }
    req.user = decoded;
    next();
  } catch {
    errorJson(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH.INVALID_TOKEN);
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    errorJson(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED,
    );
    return;
  }

  const isAdmin = req.user.roles?.some(
    (role) => role.toLowerCase() === 'admin',
  );

  if (!isAdmin) {
    errorJson(res, HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.RBAC.FORBIDDEN);
    return;
  }

  next();
};
