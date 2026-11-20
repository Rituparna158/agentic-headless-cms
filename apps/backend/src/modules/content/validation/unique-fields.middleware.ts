import type { NextFunction, Request, Response } from 'express';
import { sql } from 'drizzle-orm';
import { entryLocalizations, contentEntries } from '@repo/shared-db';
import { ConflictError } from '@repo/utils';
import { DEFAULT_LOCALE } from '@repo/constants';
import type { SchemaField } from '@repo/types';
import { ContentService } from '../content.service.js';

const contentService = new ContentService();

const asKey = (v: unknown): string | null =>
  typeof v === 'string' || typeof v === 'number' ? String(v).trim() : null;

/**
 * Fields marked "unique" in the schema (like a page or post address) must
 * not repeat inside the website. Only values that are being changed are
 * checked, so older entries that already share a value can still be edited.
 */
export const enforceUniqueFields = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const fields: SchemaField[] =
      (req.schema?.definition as { fields?: SchemaField[] })?.fields ?? [];
    const unique = fields.filter((f) => f.isUnique);
    if (!unique.length || !req.schemaId) return next();
    const body = (req.body ?? {}) as Record<string, unknown>;
    const entryId = req.params.entryId ? String(req.params.entryId) : undefined;
    const locale =
      typeof req.query.locale === 'string' ? req.query.locale : DEFAULT_LOCALE;
    const appId = req.context?.applicationId;

    const current = entryId
      ? ((await contentService
          .getEntryById(entryId, locale, req.schemaId, appId)
          .catch(() => null)) as { data?: Record<string, unknown> } | null)
      : null;

    for (const field of unique) {
      const value = asKey(body[field.apiId]);
      if (!value) continue;
      if (current && asKey(current.data?.[field.apiId]) === value) continue;
      const others = await contentService.countEntries(
        req.schemaId,
        locale,
        {
          where: entryId
            ? sql`(${entryLocalizations.data}->>${field.apiId}) = ${value} AND ${contentEntries.id} <> ${entryId}`
            : sql`(${entryLocalizations.data}->>${field.apiId}) = ${value}`,
          orderBy: [],
          limit: 1,
          offset: 0,
          page: 1,
          pageSize: 1,
        },
        appId,
      );
      if (others > 0) {
        throw new ConflictError(
          `Another entry already uses "${value}" for ${field.displayName || field.apiId}. Choose a different one.`,
        );
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};
