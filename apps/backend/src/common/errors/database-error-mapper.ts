import {
  ConcurrentModificationError,
  ConnectionError,
  DatabaseError,
  DeadlockDetectedError,
  ForeignKeyViolationError,
  NotNullViolationError,
  CheckConstraintViolationError,
  RecordNotFoundError,
  SerializationFailureError,
  UniqueConstraintViolationError,
} from '@repo/shared-db';
import {
  BadRequestError,
  ConflictError,
  HttpError,
  InternalServerError,
  NotFoundError,
  ServiceUnavailableError,
} from './http-error.js';

/**
 * Translates `@repo/shared-db`'s typed database errors into typed HTTP
 * errors. Kept as its own module (rather than inline in the error-handling
 * middleware) so the mapping is unit-testable and reusable by any route
 * that wants to catch a `DatabaseError` and rethrow the HTTP-shaped
 * equivalent explicitly, instead of relying on the middleware's fallback.
 */
export function mapDatabaseErrorToHttpError(error: DatabaseError): HttpError {
  if (error instanceof RecordNotFoundError) {
    return new NotFoundError(error.message);
  }

  if (error instanceof ConcurrentModificationError) {
    // Optimistic-concurrency conflict — the client's view of the resource
    // is stale. 409 is the correct signal to "re-fetch and retry."
    return new ConflictError(error.message);
  }

  if (error instanceof UniqueConstraintViolationError) {
    return new ConflictError(error.message, { constraint: error.constraint });
  }

  if (error instanceof ForeignKeyViolationError) {
    // Ambiguous by nature (could be "you referenced something that doesn't
    // exist" on insert, or "this is still referenced elsewhere" on delete);
    // 409 is the closer default of the two since it doesn't imply the
    // request body itself was malformed.
    return new ConflictError(error.message, { constraint: error.constraint });
  }

  if (
    error instanceof NotNullViolationError ||
    error instanceof CheckConstraintViolationError
  ) {
    return new BadRequestError(error.message);
  }

  if (error instanceof ConnectionError) {
    return new ServiceUnavailableError(
      'The database is temporarily unavailable. Please try again shortly.',
    );
  }

  if (
    error instanceof SerializationFailureError ||
    error instanceof DeadlockDetectedError
  ) {
    // withTransaction() already retries these internally — reaching here
    // means retries were exhausted under sustained contention, not a bug.
    return new ServiceUnavailableError(
      'The request could not be completed due to a temporary conflict. Please try again.',
    );
  }

  // InvalidDatabaseConfigError, UnknownDatabaseError, and anything else:
  // not the client's fault and not safe to describe in detail over HTTP.
  return new InternalServerError('An unexpected database error occurred.');
}
