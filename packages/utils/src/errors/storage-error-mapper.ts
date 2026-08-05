import {
  StorageError,
  StorageNotFoundError,
  InvalidResizeError,
} from '@repo/storage';
import {
  HttpError,
  InternalServerError,
  NotFoundError,
  BadRequestError,
} from './http-error.js';

/**
 * Translates `@repo/storage`'s typed storage errors into typed HTTP errors.
 */
export function mapStorageErrorToHttpError(error: StorageError): HttpError {
  if (error instanceof StorageNotFoundError) {
    return new NotFoundError(error.message);
  }

  if (error instanceof InvalidResizeError) {
    return new BadRequestError(error.message);
  }

  return new InternalServerError('An unexpected storage error occurred.');
}
