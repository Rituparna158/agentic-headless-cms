import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { contentTag } from '../cache.js';
import { CMS_TAG } from '../constants.js';

export function revalidationHandler(secret: string) {
  return async function POST(request: Request) {
    try {
      const rawBody = await request.text();
      const signature = request.headers.get('x-agentic-signature');

      if (!signature) {
        return NextResponse.json(
          { error: 'Missing signature' },
          { status: 401 },
        );
      }

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 },
        );
      }

      const payload = JSON.parse(rawBody);
      const schemaSlug = payload.schemaSlug;

      if (schemaSlug) {
        revalidateTag(contentTag(schemaSlug), undefined as unknown as string);
      }
      revalidateTag(CMS_TAG, undefined as unknown as string);

      return NextResponse.json({ revalidated: true, now: Date.now() });
    } catch (_err) {
      return NextResponse.json(
        { error: 'Webhook processing error' },
        { status: 500 },
      );
    }
  };
}
