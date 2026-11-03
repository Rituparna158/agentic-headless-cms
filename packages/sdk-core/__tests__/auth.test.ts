import { describe, it, expect } from 'vitest';
import { AuthClient } from '../src/auth/auth.client.js';

describe('AuthClient', () => {
  it('should initialize with an empty token if none provided', () => {
    const client = new AuthClient();
    expect(client.getToken()).toBeUndefined();
  });

  it('should initialize with the provided token', () => {
    const client = new AuthClient('test-token');
    expect(client.getToken()).toBe('test-token');
  });

  it('should set and get the token correctly', () => {
    const client = new AuthClient();
    client.setToken('new-token');
    expect(client.getToken()).toBe('new-token');
    client.setToken(undefined);
    expect(client.getToken()).toBeUndefined();
  });
  it('should throw error on login if transport not initialized', async () => {
    const client = new AuthClient();
    await expect(
      client.login({ email: 'test', password: 'password', rememberMe: false }),
    ).rejects.toThrow('Transport not initialized');
  });

  describe('with transport injected', () => {
    it('login, logout, and me methods', async () => {
      const client = new AuthClient();
      const mockTransport = {
        request: async () => ({ data: { id: 'user1' } }),
      } as unknown as import('../src/transport/http.js').HttpTransport;
      client.setTransport(mockTransport);

      const loginRes = await client.login({
        email: 'e',
        password: 'p',
        rememberMe: true,
      });
      expect(loginRes).toEqual({ id: 'user1' });

      await client.logout();
      expect(client.getToken()).toBeUndefined();

      const meRes = await client.me();
      expect(meRes).toEqual({ id: 'user1' });
    });
  });
});
