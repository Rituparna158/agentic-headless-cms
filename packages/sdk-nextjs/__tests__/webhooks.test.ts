import { describe, it, expect, vi, beforeEach } from 'vitest';
import { revalidationHandler } from '../src/webhooks/revalidation-handler.js';
import crypto from 'crypto';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn().mockImplementation((body, init) => ({ body, init })),
  },
}));

describe('revalidationHandler', () => {
  const SECRET = 'test-secret';
  const handler = revalidationHandler(SECRET);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createMockRequest(body: unknown, signature?: string) {
    const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
    const headers = new Map<string, string>();
    if (signature) {
      headers.set('x-agentic-signature', signature);
    }

    return {
      text: async () => rawBody,
      headers: {
        get: (key: string) => headers.get(key) || null,
      },
    } as unknown as Request;
  }

  function signPayload(payload: string, secret: string) {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  it('returns 401 if signature header is missing', async () => {
    const request = createMockRequest({ schemaSlug: 'blog-post' });
    const response = (await handler(request)) as unknown as {
      init: { status: number };
    };
    expect(response.init.status).toBe(401);
  });

  it('returns 401 if signature is invalid', async () => {
    const request = createMockRequest(
      { schemaSlug: 'blog-post' },
      'invalid-signature',
    );
    const response = (await handler(request)) as unknown as {
      init: { status: number };
    };
    expect(response.init.status).toBe(401);
  });

  it('calls revalidateTag and returns 200 on valid signature', async () => {
    const payload = JSON.stringify({ schemaSlug: 'blog-post', entryId: '123' });
    const signature = signPayload(payload, SECRET);
    const request = createMockRequest(payload, signature);

    const response = (await handler(request)) as unknown as {
      body: { revalidated: boolean };
      init?: { status: number };
    };

    expect(response.init).toBeUndefined();
    expect(response.body.revalidated).toBe(true);

    const { revalidateTag } = await import('next/cache');
    expect(revalidateTag).toHaveBeenCalledWith(
      'cms:content:blog-post',
      undefined,
    );
    expect(revalidateTag).toHaveBeenCalledWith('cms', undefined);
  });

  it('handles missing schemaSlug gracefully', async () => {
    const payload = JSON.stringify({ event: 'ping' });
    const signature = signPayload(payload, SECRET);
    const request = createMockRequest(payload, signature);

    await handler(request);

    const { revalidateTag } = await import('next/cache');
    expect(revalidateTag).toHaveBeenCalledTimes(1);
    expect(revalidateTag).toHaveBeenCalledWith('cms', undefined);
  });
});
