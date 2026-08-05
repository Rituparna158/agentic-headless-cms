import type { NextFunction, Request, Response } from 'express';
import { NotFoundError } from '@repo/utils';

export function notFoundMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`));
}
