import { AuthClient } from '../auth/auth.client.js';
import { ApiError, AuthError } from '../errors/index.js';
import { FetchOptions, RetryConfig } from '../types/index.js';

export interface HttpTransportConfig {
  appId?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  retry?: RetryConfig | boolean;
}

export const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  retries: 2,
  initialDelayMs: 100,
  maxDelayMs: 2000,
  backoffFactor: 2,
  statusCodes: [502, 503, 504],
};

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
  private defaultRetry?: RetryConfig | boolean;

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
    this.defaultRetry = config?.retry;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private resolveRetryConfig(
    override?: RetryConfig | boolean,
  ): Required<RetryConfig> {
    const activeSetting = override !== undefined ? override : this.defaultRetry;

    if (activeSetting === false) {
      return {
        ...DEFAULT_RETRY_CONFIG,
        retries: 0,
      };
    }

    if (activeSetting === true || activeSetting === undefined) {
      return DEFAULT_RETRY_CONFIG;
    }

    return {
      retries: activeSetting.retries ?? DEFAULT_RETRY_CONFIG.retries,
      initialDelayMs:
        activeSetting.initialDelayMs ?? DEFAULT_RETRY_CONFIG.initialDelayMs,
      maxDelayMs: activeSetting.maxDelayMs ?? DEFAULT_RETRY_CONFIG.maxDelayMs,
      backoffFactor:
        activeSetting.backoffFactor ?? DEFAULT_RETRY_CONFIG.backoffFactor,
      statusCodes:
        activeSetting.statusCodes ?? DEFAULT_RETRY_CONFIG.statusCodes,
    };
  }

  private calculateDelay(
    attempt: number,
    config: Required<RetryConfig>,
  ): number {
    const delay =
      config.initialDelayMs * Math.pow(config.backoffFactor, attempt);
    return Math.min(delay, config.maxDelayMs);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async request<TResponse>(
    path: string,
    options: FetchOptions = {},
  ): Promise<TResponse> {
    const retryConfig = this.resolveRetryConfig(options.retry);
    const maxRetries = retryConfig.retries;

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
      retry: _retry,
      credentials = 'include',
      ...fetchOptions
    } = options;

    let attempt = 0;
    while (true) {
      let response: Response;
      try {
        response = await fetch(url.toString(), {
          ...fetchOptions,
          credentials,
          headers,
        });
      } catch (networkError) {
        if (attempt < maxRetries) {
          const delay = this.calculateDelay(attempt, retryConfig);
          attempt++;
          await this.sleep(delay);
          continue;
        }
        throw networkError;
      }

      if (!response.ok) {
        if (
          attempt < maxRetries &&
          retryConfig.statusCodes.includes(response.status)
        ) {
          const delay = this.calculateDelay(attempt, retryConfig);
          attempt++;
          await this.sleep(delay);
          continue;
        }

        let body: unknown;
        try {
          body = await response.json();
        } catch (_e) {
          body = await response.text();
        }

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

      let body: unknown;
      try {
        body = await response.json();
      } catch (_e) {
        body = await response.text();
      }

      return body as TResponse;
    }
  }
}
