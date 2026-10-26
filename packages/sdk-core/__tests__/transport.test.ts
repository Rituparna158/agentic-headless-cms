import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpTransport } from '../src/transport/http.js';
import { AuthClient } from '../src/auth/auth.client.js';
import { ApiError, AuthError } from '../src/errors/index.js';

describe('HttpTransport', () => {
  let authClient: AuthClient;
  let transport: HttpTransport;

  beforeEach(() => {
    authClient = new AuthClient();
    transport = new HttpTransport('https://api.example.com', authClient);
    global.fetch = vi.fn();
  });

  it('should make a simple GET request', async () => {
    const mockResponse = { data: 'test' };
    (global.fetch as import('vitest').Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await transport.request('/test');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    expect(result).toEqual(mockResponse);
  });

  it('should append params to URL', async () => {
    (global.fetch as import('vitest').Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await transport.request('/search', {
      params: { q: 'test', limit: 10 },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/search?q=test&limit=10',
      expect.anything(),
    );
  });

  it('should inject Authorization header if token exists', async () => {
    authClient.setToken('secret-token');
    (global.fetch as import('vitest').Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await transport.request('/protected');

    const fetchCall = (global.fetch as import('vitest').Mock).mock.calls[0]!;
    const headers = fetchCall[1].headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer secret-token');
  });

  it('should throw AuthError on 401 response', async () => {
    (global.fetch as import('vitest').Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Invalid token' }),
    });

    await expect(transport.request('/protected')).rejects.toThrow(AuthError);
  });

  it('should serialize nested objects in params to extended query parameters', async () => {
    (global.fetch as import('vitest').Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await transport.request('/content/articles', {
      params: {
        page: 1,
        filters: { status: { eq: 'published' }, author: { neq: '123' } },
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/content/articles?page=1&filters%5Bstatus%5D%5Beq%5D=published&filters%5Bauthor%5D%5Bneq%5D=123',
      expect.anything(),
    );
  });

  it('should inject x-app-id, x-api-key, and custom headers when configured', async () => {
    const configuredTransport = new HttpTransport(
      'https://api.example.com',
      authClient,
      {
        appId: 'MY_APP',
        apiKey: 'secret-api-key',
        headers: { 'X-Custom-Client': 'test-client' },
      },
    );

    (global.fetch as import('vitest').Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await configuredTransport.request('/content');

    const fetchCall = (global.fetch as import('vitest').Mock).mock.calls[0]!;
    const headers = fetchCall[1].headers as Headers;
    expect(headers.get('x-app-id')).toBe('MY_APP');
    expect(headers.get('x-api-key')).toBe('secret-api-key');
    expect(headers.get('x-custom-client')).toBe('test-client');
  });

  it('should allow per-request headers to override default headers', async () => {
    const configuredTransport = new HttpTransport(
      'https://api.example.com',
      authClient,
      {
        appId: 'MY_APP',
        headers: { 'X-Custom-Header': 'default' },
      },
    );

    (global.fetch as import('vitest').Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await configuredTransport.request('/content', {
      headers: { 'X-Custom-Header': 'override', 'x-app-id': 'OVERRIDE_APP' },
    });

    const fetchCall = (global.fetch as import('vitest').Mock).mock.calls[0]!;
    const headers = fetchCall[1].headers as Headers;
    expect(headers.get('x-app-id')).toBe('OVERRIDE_APP');
    expect(headers.get('x-custom-header')).toBe('override');
  });

  it('should throw ApiError on 500 response without retrying', async () => {
    (global.fetch as import('vitest').Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ message: 'Server crashed' }),
    });

    await expect(transport.request('/error')).rejects.toThrow(ApiError);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry transient 503 response with backoff and succeed on subsequent attempt', async () => {
    const retryTransport = new HttpTransport(
      'https://api.example.com',
      authClient,
      { retry: { retries: 2, initialDelayMs: 10 } },
    );

    (global.fetch as import('vitest').Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({ message: 'Overloaded' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    const result = await retryTransport.request<{ success: boolean }>(
      '/transient',
    );

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ success: true });
  });

  it('should retry on network error and succeed on subsequent attempt', async () => {
    const retryTransport = new HttpTransport(
      'https://api.example.com',
      authClient,
      { retry: { retries: 2, initialDelayMs: 10 } },
    );

    (global.fetch as import('vitest').Mock)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'recovered' }),
      });

    const result = await retryTransport.request<{ data: string }>('/network');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ data: 'recovered' });
  });

  it('should throw after exceeding max retries on persistent 502 errors', async () => {
    const retryTransport = new HttpTransport(
      'https://api.example.com',
      authClient,
      { retry: { retries: 2, initialDelayMs: 10 } },
    );

    (global.fetch as import('vitest').Mock).mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: async () => ({ message: 'Bad Gateway' }),
    });

    await expect(retryTransport.request('/persistent-error')).rejects.toThrow(
      ApiError,
    );
    // 1 initial attempt + 2 retries = 3 calls
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('should respect retry: false option to disable retries', async () => {
    (global.fetch as import('vitest').Mock).mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      json: async () => ({ message: 'Overloaded' }),
    });

    await expect(
      transport.request('/no-retry', { retry: false }),
    ).rejects.toThrow(ApiError);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
