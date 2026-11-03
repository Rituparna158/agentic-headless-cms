import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { DatabaseError } from '@repo/shared-db';
import { env } from '@repo/config';
import { StorageError } from '@repo/storage';
import { logger } from '@repo/logger';
import {
  mapDatabaseErrorToHttpError,
  mapStorageErrorToHttpError,
  BadRequestError,
  HttpError,
  InternalServerError,
  ApiError,
} from '@repo/utils';

export interface ErrorResponseBody {
  error: {
    message: string;
    requestId: string;
    details?: unknown;
    stack?: string;
  };
}

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
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      details: error.errors,
      name: error.name,
      stack: error.stack,
    } as unknown as HttpError;
  }
  if (error instanceof HttpError) return error;
  if (error instanceof DatabaseError) return mapDatabaseErrorToHttpError(error);
  if (error instanceof StorageError) return mapStorageErrorToHttpError(error);
  if (error instanceof ZodError)
    return new BadRequestError('Invalid request.', error.flatten());
  if (error instanceof MulterError)
    return new BadRequestError(`Upload failed: ${error.message}`, {
      code: error.code,
    });
  return new InternalServerError(
    error instanceof Error ? error.message : 'An unexpected error occurred.',
  );
}

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
