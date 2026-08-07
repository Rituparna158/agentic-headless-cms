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
});
