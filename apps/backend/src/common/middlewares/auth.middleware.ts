import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import type { AuthenticatedUser } from '@repo/shared-types';
import { ERROR_MESSAGES, HTTP_STATUS, AUTH_COOKIES } from '@repo/shared-types';

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.[AUTH_COOKIES.NAME];

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
  } catch (err) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: ERROR_MESSAGES.AUTH.INVALID_TOKEN });
  }
};
