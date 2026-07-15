import { StorageError, StorageNotFoundError } from '../../storage/errors.js';
import { HttpError, InternalServerError, NotFoundError } from './http-error.js';

/**
 * Translates `storage/errors.js`'s typed storage errors into typed HTTP
 * errors — mirrors `database-error-mapper.ts`'s role for `DatabaseError`.
 */
export function mapStorageErrorToHttpError(error: StorageError): HttpError {
  if (error instanceof StorageNotFoundError) {
    return new NotFoundError(error.message);
  }

  // Write/read/delete failures and misconfiguration are not the client's
  // fault and not safe to describe in detail over HTTP.
  return new InternalServerError('An unexpected storage error occurred.');
}
