export interface ErrorResponseBody {
  error: {
    message: string;
    requestId: string;
    details?: unknown;
    stack?: string;
  };
}
