export class ApiError extends Error {
  public statusCode: number;
  public body: unknown;

  constructor(statusCode: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.body = body;
  }
}

export class AuthError extends ApiError {
  constructor(statusCode: number, message: string, body?: unknown) {
    super(statusCode, message, body);
    this.name = 'AuthError';
  }
}
