/**
 * Typed HTTP error hierarchy for application-level errors (as opposed to
 * `@repo/shared-db`'s `DatabaseError` hierarchy, which is about the
 * database — see `database-error-mapper.ts` for how the two connect).
 * Routes/services throw these; the error-handling middleware is the only
 * place that reads `.statusCode` and shapes the HTTP response.
 */
export abstract class HttpError extends Error {
  abstract readonly statusCode: number;

  constructor(
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class BadRequestError extends HttpError {
  readonly statusCode = 400;
}

export class UnauthorizedError extends HttpError {
  readonly statusCode = 401;
}

export class ForbiddenError extends HttpError {
  readonly statusCode = 403;
}

export class NotFoundError extends HttpError {
  readonly statusCode = 404;
}

export class ConflictError extends HttpError {
  readonly statusCode = 409;
}

export class ServiceUnavailableError extends HttpError {
  readonly statusCode = 503;
}

export class InternalServerError extends HttpError {
  readonly statusCode = 500;
}
