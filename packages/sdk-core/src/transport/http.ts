import { AuthClient } from '../auth/auth.client.js';
import { ApiError, AuthError } from '../errors/index.js';
import { FetchOptions } from '../types/index.js';

export interface HttpTransportConfig {
  appId?: string;
  apiKey?: string;
  headers?: Record<string, string>;
}

function appendQueryParam(
  params: URLSearchParams,
  prefix: string,
  value: unknown,
): void {
  if (value === undefined || value === null) return;

  if (typeof value === 'object' && !Array.isArray(value)) {
    for (const [subKey, subVal] of Object.entries(value)) {
      appendQueryParam(params, `${prefix}[${subKey}]`, subVal);
    }
  } else if (Array.isArray(value)) {
    for (const item of value) {
      params.append(prefix, String(item));
    }
  } else {
    params.append(prefix, String(value));
  }
}

export class HttpTransport {
  private baseUrl: string;
  private authClient: AuthClient;
  private appId?: string;
  private apiKey?: string;
  private defaultHeaders?: Record<string, string>;

  constructor(
    baseUrl: string,
    authClient: AuthClient,
    config?: HttpTransportConfig,
  ) {
    // Strip trailing slash if present
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.authClient = authClient;
    this.appId = config?.appId;
    this.apiKey = config?.apiKey;
    this.defaultHeaders = config?.headers;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public async request<TResponse>(
    path: string,
    options: FetchOptions = {},
  ): Promise<TResponse> {
    const isAbsoluteUrl =
      path.startsWith('http://') || path.startsWith('https://');
    const urlString = isAbsoluteUrl
      ? path
      : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    const url = new URL(urlString);

    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        appendQueryParam(url.searchParams, key, value);
      });
    }

    const headers = new Headers();

    if (this.defaultHeaders) {
      Object.entries(this.defaultHeaders).forEach(([k, v]) => {
        if (v !== undefined) headers.set(k, v);
      });
    }

    if (this.appId && !headers.has('x-app-id')) {
      headers.set('x-app-id', this.appId);
    }
    if (this.apiKey && !headers.has('x-api-key')) {
      headers.set('x-api-key', this.apiKey);
    }

    if (options.headers) {
      new Headers(options.headers).forEach((value, key) => {
        headers.set(key, value);
      });
    }

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
