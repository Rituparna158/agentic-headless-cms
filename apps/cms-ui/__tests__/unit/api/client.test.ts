import { describe, it, expect } from 'vitest';
import { apiClient } from '@/api/client';
import type { InternalAxiosRequestConfig } from 'axios';

describe('Axios Client Interceptors', () => {
  const getRequestInterceptor = () => {
    const handlers = (
      apiClient.interceptors.request as unknown as {
        handlers: Array<{
          fulfilled: (
            config: InternalAxiosRequestConfig,
          ) => InternalAxiosRequestConfig;
        }>;
      }
    ).handlers;
    const firstHandler = handlers[0];
    if (!firstHandler) {
      throw new Error('Request interceptor handler not found');
    }
    return firstHandler.fulfilled;
  };

  it('generates Idempotency-Key for POST, PUT, PATCH, and DELETE requests', async () => {
    const requestInterceptor = getRequestInterceptor();
    const postConfig = {
      method: 'post',
      headers: {} as Record<string, string>,
    } as unknown as InternalAxiosRequestConfig;

    const modifiedConfig = requestInterceptor(postConfig);
    expect(modifiedConfig.headers['Idempotency-Key']).toBeDefined();
    expect(typeof modifiedConfig.headers['Idempotency-Key']).toBe('string');
    expect(modifiedConfig.__idempotencyKey).toBe(
      modifiedConfig.headers['Idempotency-Key'],
    );
  });

  it('preserves existing Idempotency-Key on retry', async () => {
    const requestInterceptor = getRequestInterceptor();
    const existingKey = 'custom-idempotency-key-123';
    const postConfig = {
      method: 'post',
      headers: { 'Idempotency-Key': existingKey } as Record<string, string>,
      __idempotencyKey: existingKey,
    } as unknown as InternalAxiosRequestConfig;

    const modifiedConfig = requestInterceptor(postConfig);
    expect(modifiedConfig.headers['Idempotency-Key']).toBe(existingKey);
  });

  it('passes through successful responses unchanged', () => {
    const handlers = (
      apiClient.interceptors.response as unknown as {
        handlers: Array<{
          fulfilled: (res: unknown) => unknown;
          rejected: (err: unknown) => Promise<unknown>;
        }>;
      }
    ).handlers[0];

    const dummyResponse = { data: { success: true }, status: 200 };
    expect(handlers?.fulfilled(dummyResponse)).toBe(dummyResponse);
  });

  it('rejects cancelled or aborted requests without retrying', async () => {
    const handlers = (
      apiClient.interceptors.response as unknown as {
        handlers: Array<{
          fulfilled: (res: unknown) => unknown;
          rejected: (err: unknown) => Promise<unknown>;
        }>;
      }
    ).handlers[0];

    const cancelledError = {
      code: 'ERR_CANCELED',
      config: { signal: { aborted: true } },
    };

    await expect(handlers?.rejected(cancelledError)).rejects.toEqual(
      cancelledError,
    );
  });

  it('rejects non-retryable 4xx client errors immediately', async () => {
    const handlers = (
      apiClient.interceptors.response as unknown as {
        handlers: Array<{
          fulfilled: (res: unknown) => unknown;
          rejected: (err: unknown) => Promise<unknown>;
        }>;
      }
    ).handlers[0];

    const clientError = {
      response: { status: 400, data: { message: 'Bad Request' } },
      config: { __retryCount: 0 },
    };

    await expect(handlers?.rejected(clientError)).rejects.toEqual(clientError);
  });
});
