/**
 * Typed error hierarchy for storage failures — mirrors `@repo/shared-db`'s
 * `DatabaseError` hierarchy so callers can `instanceof`-narrow instead of
 * parsing adapter-specific error shapes (a Node `fs` errno vs. an AWS SDK
 * `ServiceException`).
 */
export abstract class StorageError extends Error {
  abstract readonly code: string;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

/** The object a caller expected to exist does not (read/delete of a missing key). */
export class StorageNotFoundError extends StorageError {
  readonly code = 'STORAGE_NOT_FOUND';
}

/** Write failed — disk full, permissions, bucket doesn't exist, etc. */
export class StorageWriteError extends StorageError {
  readonly code = 'STORAGE_WRITE_ERROR';
}

/** Read failed for a reason other than "not found" (permissions, corrupt data, network). */
export class StorageReadError extends StorageError {
  readonly code = 'STORAGE_READ_ERROR';
}

/** Delete failed for a reason other than "not found". */
export class StorageDeleteError extends StorageError {
  readonly code = 'STORAGE_DELETE_ERROR';
}

/** Malformed adapter configuration (missing bucket/credentials, bad upload dir) — a programmer/deploy error, not a runtime failure. */
export class InvalidStorageConfigError extends StorageError {
  readonly code = 'INVALID_STORAGE_CONFIG';
}
