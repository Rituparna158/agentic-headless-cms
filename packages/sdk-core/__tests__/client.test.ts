import { describe, it, expect } from 'vitest';
import { createClient, AgenticCmsClient } from '../src/client.js';
import { AuthClient } from '../src/auth/auth.client.js';
import { HttpTransport } from '../src/transport/http.js';
import { toPlainText } from '../src/utils/text.js';

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

  it('should accept both type alias and interface content maps for TMap', () => {
    type GeneratedMap = { articles: { id: string; data: { title: string } } };
    interface CustomInterfaceMap {
      posts: { id: string; data: { heading: string } };
    }

    const typedClient = createClient<GeneratedMap>({
      baseUrl: 'https://api.example.com',
    });
    const interfaceClient = createClient<CustomInterfaceMap>({
      baseUrl: 'https://api.example.com',
    });

    expect(typedClient).toBeInstanceOf(AgenticCmsClient);
    expect(interfaceClient).toBeInstanceOf(AgenticCmsClient);
  });
});

describe('toPlainText', () => {
  it('extracts plain text from serialized Lexical JSON', () => {
    const lexicalJson = JSON.stringify({
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', text: 'Hello' },
              { type: 'text', text: 'world' },
            ],
          },
        ],
      },
    });

    expect(toPlainText(lexicalJson)).toBe('Hello world');
  });

  it('extracts plain text from a parsed Lexical object and strips HTML strings', () => {
    expect(
      toPlainText({
        root: {
          children: [
            { type: 'paragraph', children: [{ text: 'Parsed node' }] },
          ],
        },
      }),
    ).toBe('Parsed node');
    expect(toPlainText('<p>Hello <strong>HTML</strong></p>')).toBe(
      'Hello HTML',
    );
    expect(toPlainText(null)).toBe('');
  });
});
