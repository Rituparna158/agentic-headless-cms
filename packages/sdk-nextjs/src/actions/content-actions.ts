'use server';

import { revalidateTag } from 'next/cache';
import { cmsServerFetch } from '../fetch.js';
import { contentListTags, entryTag } from '../cache.js';
import type { ContentEntryRecord } from '@repo/types';
import type { ActionState } from '../types.js';
import { parsePayload, extractEntryId } from '../utils/actions.js';

export function createEntryAction(schemaSlug: string) {
  return async function action(
    prevState: ActionState<ContentEntryRecord> | null,
    payload: FormData | Record<string, unknown>,
  ): Promise<ActionState<ContentEntryRecord>> {
    try {
      const data = parsePayload(payload);

      const result = await cmsServerFetch<ContentEntryRecord>(
        `/api/v1/content/${schemaSlug}`,
        undefined,
        undefined,
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
      );

      // Revalidate list tags
      contentListTags(schemaSlug).forEach((tag) =>
        revalidateTag(tag, undefined as unknown as string),
      );

      return { success: true, data: result };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create entry';
      return { success: false, error: message };
    }
  };
}

export function updateEntryAction(schemaSlug: string, entryId?: string) {
  return async function action(
    prevState: ActionState<ContentEntryRecord> | null,
    payload: FormData | Record<string, unknown>,
  ): Promise<ActionState<ContentEntryRecord>> {
    try {
      const data = parsePayload(payload);
      const targetId = extractEntryId(data, entryId);

      const result = await cmsServerFetch<ContentEntryRecord>(
        `/api/v1/content/${schemaSlug}/${targetId}`,
        undefined,
        undefined,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        },
      );

      contentListTags(schemaSlug).forEach((tag) =>
        revalidateTag(tag, undefined as unknown as string),
      );
      revalidateTag(
        entryTag(schemaSlug, targetId),
        undefined as unknown as string,
      );

      return { success: true, data: result };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update entry';
      return { success: false, error: message };
    }
  };
}

export function publishEntryAction(schemaSlug: string, entryId?: string) {
  return async function action(
    prevState: ActionState<ContentEntryRecord> | null,
    payload: FormData | Record<string, unknown>,
  ): Promise<ActionState<ContentEntryRecord>> {
    try {
      const data = parsePayload(payload);
      const targetId = extractEntryId(data, entryId);

      const result = await cmsServerFetch<ContentEntryRecord>(
        `/api/v1/content/${schemaSlug}/${targetId}/publish`,
        undefined,
        undefined,
        {
          method: 'POST',
        },
      );

      contentListTags(schemaSlug).forEach((tag) =>
        revalidateTag(tag, undefined as unknown as string),
      );
      revalidateTag(
        entryTag(schemaSlug, targetId),
        undefined as unknown as string,
      );

      return { success: true, data: result };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to publish entry';
      return { success: false, error: message };
    }
  };
}

export function deleteEntryAction(schemaSlug: string, entryId?: string) {
  return async function action(
    prevState: ActionState<void> | null,
    payload: FormData | Record<string, unknown>,
  ): Promise<ActionState<void>> {
    try {
      const data = parsePayload(payload);
      const targetId = extractEntryId(data, entryId);

      await cmsServerFetch<void>(
        `/api/v1/content/${schemaSlug}/${targetId}`,
        undefined,
        undefined,
        {
          method: 'DELETE',
        },
      );

      contentListTags(schemaSlug).forEach((tag) =>
        revalidateTag(tag, undefined as unknown as string),
      );
      revalidateTag(
        entryTag(schemaSlug, targetId),
        undefined as unknown as string,
      );

      return { success: true };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete entry';
      return { success: false, error: message };
    }
  };
}
