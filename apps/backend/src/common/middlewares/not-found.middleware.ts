import type { NextFunction, Request, Response } from 'express';
import { NotFoundError } from '../errors/http-error.js';

/** Mounted after all routes — anything that reaches here matched no route. */
export function notFoundMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`));
}
