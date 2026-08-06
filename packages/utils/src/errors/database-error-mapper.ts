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
 * errors.
 */
export function mapDatabaseErrorToHttpError(error: DatabaseError): HttpError {
  if (error instanceof RecordNotFoundError) {
    return new NotFoundError(error.message);
  }

  if (error instanceof ConcurrentModificationError) {
    return new ConflictError(error.message);
  }

  if (error instanceof UniqueConstraintViolationError) {
    return new ConflictError(error.message, { constraint: error.constraint });
  }

  if (error instanceof ForeignKeyViolationError) {
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
    return new ServiceUnavailableError(
      'The request could not be completed due to a temporary conflict. Please try again.',
    );
  }

  return new InternalServerError('An unexpected database error occurred.');
}
