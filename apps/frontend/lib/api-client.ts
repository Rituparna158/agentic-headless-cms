/**
 * Thin fetch wrapper for the backend API. `credentials: 'include'` sends
 * the HttpOnly session cookie issue #12's POST /auth/login is planned to
 * issue — the frontend never touches the token itself, only the browser's
 * cookie jar does, which is the point of HttpOnly.
 */
import { env } from './env';

export const API_BASE_URL = env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiErrorResponseBody {
  error?: { message?: string; details?: unknown };
}

// The backend wraps every successful response in this envelope —
// { statusCode, data, message, success } — so apiFetch unwraps `data`
// here, once, rather than every caller having to know about the envelope.
interface ApiSuccessResponseBody<T> {
  statusCode: number;
  data: T;
  message: string;
  success: true;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Id': 'HEADLESS_CMS',
        ...init?.headers,
      },
    });
  } catch (cause) {
    // The backend isn't reachable at all (network error, DNS failure, or —
    // right now, since issue #12 hasn't shipped — the route simply doesn't
    // exist yet). Surface this distinctly from an authenticated-but-failed
    // request so callers can show "service unavailable" instead of
    // "wrong password".
    throw new ApiError(
      'Unable to reach the server. Please try again shortly.',
      0,
      cause,
    );
  }

  if (!response.ok) {
    let body: ApiErrorResponseBody = {};
    try {
      body = (await response.json()) as ApiErrorResponseBody;
    } catch {
      // Response wasn't JSON (e.g. a plain 404 from a route that doesn't
      // exist yet) — fall back to the status text below.
    }

    throw new ApiError(
      body.error?.message ?? response.statusText ?? 'Request failed',
      response.status,
      body.error?.details,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  // Unwrap the backend's { statusCode, data, message, success } envelope —
  // callers' generics (e.g. apiFetch<SchemaRecord[]>) describe the *data*
  // shape, not the envelope.
  const body = (await response.json()) as ApiSuccessResponseBody<T>;
  return body.data;
}
