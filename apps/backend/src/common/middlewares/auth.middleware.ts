import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthenticatedUser } from '@repo/shared-types';
import { env } from '../../config/env.js';
import { ERROR_MESSAGES, HTTP_STATUS, AUTH_COOKIES } from '@repo/shared-types';

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = (req.cookies as Record<string, string> | undefined)?.[
    AUTH_COOKIES.NAME
  ];

  if (!token) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: ERROR_MESSAGES.AUTH.NO_TOKEN });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: ERROR_MESSAGES.AUTH.INVALID_TOKEN });
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED });
    return;
  }

  // Check if the user has the 'admin' role
  const isAdmin = req.user.roles?.some(
    (role) => role.toLowerCase() === 'admin',
  );

  if (!isAdmin) {
    res
      .status(HTTP_STATUS.FORBIDDEN)
      .json({ error: ERROR_MESSAGES.RBAC.FORBIDDEN });
    return;
  }

  next();
};
