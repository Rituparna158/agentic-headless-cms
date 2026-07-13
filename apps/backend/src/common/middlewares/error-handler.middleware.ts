import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { DatabaseError } from '@repo/shared-db';
import { env } from '../../config/env.js';
import { mapDatabaseErrorToHttpError } from '../errors/database-error-mapper.js';
import {
  BadRequestError,
  HttpError,
  InternalServerError,
} from '../errors/http-error.js';
import { logger } from '../logger.js';

import type { ErrorResponseBody } from '../../types/error-handler.types.js';

/**
 * `req.id` is typed as pino-http's `ReqId` (`string | number | object`) —
 * see request-id.middleware.ts. In practice it's always a string, but
 * `String(possiblyAnObject)` silently produces "[object Object]" instead of
 * something useful, so handle the non-string cases explicitly rather than
 * trusting the runtime guarantee blindly.
 */
function stringifyRequestId(id: unknown): string {
  if (typeof id === 'string') return id;
  if (typeof id === 'number') return String(id);
  try {
    return JSON.stringify(id);
  } catch {
    return 'unknown';
  }
}

function toHttpError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;
  if (error instanceof DatabaseError) return mapDatabaseErrorToHttpError(error);
  if (error instanceof ZodError)
    return new BadRequestError('Invalid request.', error.flatten());
  return new InternalServerError(
    error instanceof Error ? error.message : 'An unexpected error occurred.',
  );
}

/**
 * Express recognizes an error-handling middleware solely by its 4-argument
 * signature — dropping any of these parameters (even the unused one)
 * turns it back into a regular middleware Express will never invoke on
 * error. Must be registered last, after all routes and the 404 handler.
 */
export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const httpError = toHttpError(err);
  const isServerError = httpError.statusCode >= 500;

  const requestId = stringifyRequestId(req.id);
  const log = isServerError
    ? logger.error.bind(logger)
    : logger.warn.bind(logger);
  log({ requestId, err, statusCode: httpError.statusCode }, httpError.message);

  const body: ErrorResponseBody = {
    error: {
      message: httpError.message,
      requestId,
      // Only expose internal details/stack outside production — a 500's
      // real cause shouldn't leak to clients once this is deployed.
      ...(httpError.details !== undefined && !isServerError
        ? { details: httpError.details }
        : {}),
      ...(isServerError && env.NODE_ENV !== 'production' && err instanceof Error
        ? { stack: err.stack }
        : {}),
    },
  };

  res.status(httpError.statusCode).json(body);
}
