import axios, { InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';

declare module 'axios' {
  export interface AxiosRequestConfig {
    __retryCount?: number;
    __idempotencyKey?: string;
  }
}

export const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true, // Secure cookie handling
  headers: {
    'Content-Type': 'application/json',
    'X-App-Id': env.VITE_APP_ID,
  },
});

const MAX_RETRIES = 2;
const RETRYABLE_STATUS_CODES = [408, 429, 502, 503, 504];

function generateIdempotencyKey(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Request Interceptor: Attach Idempotency-Key for mutating requests
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const method = config.method?.toUpperCase();
  const isMutation =
    method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (isMutation) {
    const existingKey =
      (config.headers?.['Idempotency-Key'] as string) ||
      (config.headers?.['idempotency-key'] as string) ||
      config.__idempotencyKey;

    const key = existingKey || generateIdempotencyKey();
    config.__idempotencyKey = key;
    if (config.headers) {
      if (typeof config.headers.set === 'function') {
        config.headers.set('Idempotency-Key', key);
      } else {
        config.headers['Idempotency-Key'] = key;
      }
    }
  }

  return config;
});

// Response Interceptor: Exponential backoff for transient network and gateway drops
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as InternalAxiosRequestConfig | undefined;

    // Do not retry if no config or if request was aborted / cancelled
    if (
      !config ||
      axios.isCancel(error) ||
      config.signal?.aborted ||
      error.code === 'ERR_CANCELED'
    ) {
      return Promise.reject(error);
    }

    const retryCount = config.__retryCount || 0;
    const isNetworkError = !error.response && error.code !== 'ERR_CANCELED';
    const isRetryableStatus =
      error.response && RETRYABLE_STATUS_CODES.includes(error.response.status);

    if ((isNetworkError || isRetryableStatus) && retryCount < MAX_RETRIES) {
      config.__retryCount = retryCount + 1;

      // Calculate backoff with jitter
      let delay =
        Math.min(1000 * Math.pow(2, retryCount), 3000) + Math.random() * 200;

      // Respect Retry-After header if present on 429 responses
      if (error.response?.status === 429) {
        const retryAfterHeader = error.response.headers?.['retry-after'];
        if (retryAfterHeader) {
          const parsedSeconds = parseInt(retryAfterHeader, 10);
          if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
            delay = Math.min(parsedSeconds * 1000, 5000);
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClient(config);
    }

    return Promise.reject(error);
  },
);
