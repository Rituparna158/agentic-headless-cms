/**
 * Typed error hierarchy for database failures. Callers (NestJS exception
 * filters, repositories, health checks) can `instanceof`-narrow on these
 * instead of parsing driver-specific error shapes or Postgres SQLSTATE codes
 * themselves.
 */
export abstract class DatabaseError extends Error {
  abstract readonly code: string;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

export class UniqueConstraintViolationError extends DatabaseError {
  readonly code = 'UNIQUE_VIOLATION';
  constructor(
    message: string,
    readonly constraint: string | undefined,
    options?: { cause?: unknown },
  ) {
    super(message, options);
  }
}

export class ForeignKeyViolationError extends DatabaseError {
  readonly code = 'FOREIGN_KEY_VIOLATION';
  constructor(
    message: string,
    readonly constraint: string | undefined,
    options?: { cause?: unknown },
  ) {
    super(message, options);
  }
}

export class NotNullViolationError extends DatabaseError {
  readonly code = 'NOT_NULL_VIOLATION';
  constructor(
    message: string,
    readonly column: string | undefined,
    options?: { cause?: unknown },
  ) {
    super(message, options);
  }
}

export class CheckConstraintViolationError extends DatabaseError {
  readonly code = 'CHECK_VIOLATION';
  constructor(
    message: string,
    readonly constraint: string | undefined,
    options?: { cause?: unknown },
  ) {
    super(message, options);
  }
}

/** Postgres SQLSTATE 40001 — safe to retry the whole transaction. */
export class SerializationFailureError extends DatabaseError {
  readonly code = 'SERIALIZATION_FAILURE';
}

/** Postgres SQLSTATE 40P01 — safe to retry the whole transaction. */
export class DeadlockDetectedError extends DatabaseError {
  readonly code = 'DEADLOCK_DETECTED';
}

/** Connection could not be established or was lost mid-operation. */
export class ConnectionError extends DatabaseError {
  readonly code = 'CONNECTION_ERROR';
}

/** The row a caller expected to exist does not. Not a driver error — raised by repositories. */
export class RecordNotFoundError extends DatabaseError {
  readonly code = 'RECORD_NOT_FOUND';
}

/** An update targeted a row whose version has moved on since the caller last read it. */
export class ConcurrentModificationError extends DatabaseError {
  readonly code = 'CONCURRENT_MODIFICATION';
}

/** Malformed input passed to this package (e.g. connection string) — a programmer error, not a runtime DB failure. */
export class InvalidDatabaseConfigError extends DatabaseError {
  readonly code = 'INVALID_CONFIG';
}

/** Errors safe to retry automatically inside a transaction (transient, not caused by bad input). */
export function isRetryableError(error: unknown): boolean {
  return (
    error instanceof SerializationFailureError ||
    error instanceof DeadlockDetectedError
  );
}

interface PgDriverError {
  code?: string;
  constraint?: string;
  column?: string;
  table?: string;
  detail?: string;
  message?: string;
  /** Present when Node wraps multiple dual-stack (IPv4/IPv6) connection attempts in an AggregateError. */
  errors?: unknown[];
}

function isPgDriverError(error: unknown): error is PgDriverError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

/**
 * `AggregateError` (thrown by Node when a connection attempt races IPv4 and
 * IPv6 and both fail — the common shape for "nothing is listening on that
 * host/port") has an empty top-level `.message` even though `.code` and the
 * nested `.errors[]` are populated. Fall back through those so a refused
 * connection doesn't surface as a blank, useless error message.
 */
function extractMessage(error: PgDriverError): string {
  if (error.message) return error.message;

  if (Array.isArray(error.errors) && error.errors.length > 0) {
    const nested = error.errors
      .map((e) => (e instanceof Error ? e.message : String(e)))
      .filter(Boolean);
    if (nested.length > 0) return nested.join('; ');
  }

  return error.code
    ? `Database operation failed (${error.code})`
    : 'Database operation failed';
}

/**
 * Translates a raw `pg` driver error (identified by Postgres SQLSTATE code)
 * into one of the typed errors above. Unknown/non-Postgres errors are
 * wrapped so callers still only ever have to handle `DatabaseError`
 * subclasses instead of driver internals — but connection-refused-style
 * errors (no SQLSTATE, just a Node `ECONNREFUSED`/`ETIMEDOUT`) are mapped to
 * `ConnectionError` explicitly since those are the ones worth retrying at
 * the connection layer.
 */
export function mapPostgresError(error: unknown): DatabaseError {
  if (error instanceof DatabaseError) {
    return error;
  }

  if (!isPgDriverError(error)) {
    return new UnknownDatabaseError(
      error instanceof Error ? error.message : 'Unknown database error',
      {
        cause: error,
      },
    );
  }

  const message = extractMessage(error);

  switch (error.code) {
    case '23505':
      return new UniqueConstraintViolationError(message, error.constraint, {
        cause: error,
      });
    case '23503':
      return new ForeignKeyViolationError(message, error.constraint, {
        cause: error,
      });
    case '23502':
      return new NotNullViolationError(message, error.column, { cause: error });
    case '23514':
      return new CheckConstraintViolationError(message, error.constraint, {
        cause: error,
      });
    case '40001':
      return new SerializationFailureError(message, { cause: error });
    case '40P01':
      return new DeadlockDetectedError(message, { cause: error });
    case 'ECONNREFUSED':
    case 'ETIMEDOUT':
    case '08000':
    case '08003':
    case '08006':
    case '08001':
    case '08004':
      return new ConnectionError(message, { cause: error });
    default:
      return new UnknownDatabaseError(message, { cause: error });
  }
}

export class UnknownDatabaseError extends DatabaseError {
  readonly code = 'UNKNOWN';
}
