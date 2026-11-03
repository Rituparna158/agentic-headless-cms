import { describe, it, expect } from 'vitest';
import { createClient, AgenticCmsClient } from '../src/client.js';
import { AuthClient } from '../src/auth/auth.client.js';
import { HttpTransport } from '../src/transport/http.js';

describe('createClient', () => {
  it('should return an AgenticCmsClient instance', () => {
    const client = createClient({ baseUrl: 'https://api.example.com' });
    expect(client).toBeInstanceOf(AgenticCmsClient);
    expect(client.auth).toBeInstanceOf(AuthClient);
    expect(client.transport).toBeInstanceOf(HttpTransport);
  });

  it('should pass token to AuthClient if provided', () => {
    const client = createClient({
      baseUrl: 'https://api.example.com',
      apiToken: 'test-token',
    });
    expect(client.auth.getToken()).toBe('test-token');
  });
});
