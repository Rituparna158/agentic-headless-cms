import { AuthClient } from '../auth/auth.client.js';
import { ApiError, AuthError } from '../errors/index.js';
import { FetchOptions } from '../types/index.js';

export class HttpTransport {
  private baseUrl: string;
  private authClient: AuthClient;

  constructor(baseUrl: string, authClient: AuthClient) {
    // Strip trailing slash if present
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.authClient = authClient;
  }

  public async request<TResponse>(
    path: string,
    options: FetchOptions = {},
  ): Promise<TResponse> {
    const url = new URL(
      `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`,
    );

    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers = new Headers(options.headers);

    // Auto-set JSON content type if it's not FormData
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    headers.set('Accept', 'application/json');

    const token = this.authClient.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const {
      params: _params,
      credentials = 'include',
      ...fetchOptions
    } = options;

    const response = await fetch(url.toString(), {
      ...fetchOptions,
      credentials,
      headers,
    });

    let body: unknown;
    try {
      body = await response.json();
    } catch (_e) {
      body = await response.text();
    }

    if (!response.ok) {
      const errorBody = body as { message?: string };
      if (response.status === 401 || response.status === 403) {
        throw new AuthError(
          response.status,
          errorBody?.message || response.statusText,
          body,
        );
      }
      throw new ApiError(
        response.status,
        errorBody?.message || response.statusText,
        body,
      );
    }

    return body as TResponse;
  }
}
