import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { eq } from 'drizzle-orm';
import { getDatabaseAdapter } from '@repo/config';
import { applications } from '@repo/shared-db';
import { ContentRepository } from '@repo/repository';
import type { SchemaDefinition } from '@repo/types';
import { DEFAULT_LOCALE } from '@repo/constants';
import { ContentService } from './content.service.js';
import { validateSubmission } from './submissions.js';
import { parseContentQuery } from './query/content-query.util.js';

/**
 * Public, read-only delivery of PUBLISHED website content.
 *
 *   GET /api/v1/delivery/:appName/:siteSlug
 *
 * No key is needed (and none ships in the browser), so it is opt-in: a site is
 * only served when its owner has switched on "Public website" in its settings
 * (`definition.metadata.publicWebsite === true`). Everything else answers with
 * the same 404, so the existence of private sites is not revealed.
 * Only the published snapshot is returned, never drafts or author details.
 */
export const deliveryRoutes = Router();

const repository = new ContentRepository();
const service = new ContentService();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: { message: 'Too many requests.' } },
  statusCode: 429,
});

const submitMinute = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: { message: 'Too many messages. Please wait a moment.' } },
  statusCode: 429,
});
const submitHour = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: { message: 'Too many messages. Please try again later.' } },
  statusCode: 429,
});

export const acceptsSubmissions = (definition: unknown): boolean =>
  isPublicSite(definition) &&
  (definition as SchemaDefinition).metadata?.acceptSubmissions === true;

const notFound = (res: Response) =>
  res.status(404).json({ error: { message: 'Website not found.' } });

export const isPublicSite = (definition: unknown): boolean =>
  (definition as SchemaDefinition | undefined)?.metadata?.publicWebsite ===
  true;

/** Only what a visitor may see: the published snapshot, nothing about authors. */
/** Only the website details meant for visitors (never internal settings). */
export const toPublicSite = (name: string, definition: unknown) => {
  const meta = (definition as SchemaDefinition | undefined)?.metadata ?? {};
  const seo = (meta.seo ?? {}) as Record<string, unknown>;
  const text = (v: unknown) => (typeof v === 'string' ? v : undefined);
  return {
    name,
    logoUrl: text(meta.logoUrl),
    domain: text(meta.domain),
    seo: {
      titleTemplate: text(seo.titleTemplate),
      description: text(seo.description),
      socialImage: text(seo.socialImage),
    },
  };
};

export const toPublicEntry = (row: {
  id: string;
  status?: string | null;
  data?: unknown;
  publishedData?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}) => {
  const snapshot =
    row.publishedData && typeof row.publishedData === 'object'
      ? row.publishedData
      : row.data;
  const d = snapshot as Record<string, unknown> | undefined;
  if (d?.kind === 'submission') {
    // Form messages are private. Only approved comments are public, and
    // without the commenter's email address.
    if (d.submissionType !== 'comment') return null;
    return {
      id: row.id,
      status: 'published',
      data: {
        kind: 'submission',
        submissionType: 'comment',
        title: d.title,
        slug: d.slug,
        name: d.name,
        message: d.message,
        postSlug: d.postSlug,
        receivedAt: d.receivedAt,
      },
      publishedData: undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
  return {
    id: row.id,
    status: 'published',
    data: snapshot,
    publishedData: snapshot,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

deliveryRoutes.get(
  '/:appName/:schemaSlug',
  limiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appName = String(req.params.appName);
      const slug = String(req.params.schemaSlug);
      const db = getDatabaseAdapter().getDb();
      const [app] = await db
        .select({ id: applications.id })
        .from(applications)
        .where(eq(applications.name, appName))
        .limit(1);
      if (!app) return notFound(res);

      const schema = await repository.getSchemaBySlug(slug, app.id);
      if (!schema || schema.isSystem || !isPublicSite(schema.definition)) {
        return notFound(res);
      }

      // Only paging is taken from the caller; status is always "published"
      const query = parseContentQuery(
        {
          page: req.query.page,
          pageSize: req.query.pageSize,
          status: 'published',
        },
        (schema.definition as SchemaDefinition).fields,
        'published',
      );
      const [rows, total] = await Promise.all([
        service.listEntries(schema.id, DEFAULT_LOCALE, query, app.id),
        service.countEntries(schema.id, DEFAULT_LOCALE, query, app.id),
      ]);
      res.set('Cache-Control', 'public, max-age=30');
      res.status(200).json({
        data: {
          data: (rows as Parameters<typeof toPublicEntry>[0][])
            .map(toPublicEntry)
            .filter((e) => e !== null),
          site: toPublicSite(schema.name, schema.definition),
          meta: {
            pagination: {
              page: query.page,
              pageSize: query.pageSize,
              total,
              pageCount: Math.ceil(total / query.pageSize),
            },
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Visitors can send a form or a comment. Off unless the owner switched on
 * both "Public website" and "Accept form messages and comments". Stored as
 * a draft that someone must read (and approve, for comments).
 */
deliveryRoutes.post(
  '/:appName/:schemaSlug/submissions',
  submitMinute,
  submitHour,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [app] = await getDatabaseAdapter()
        .getDb()
        .select({ id: applications.id })
        .from(applications)
        .where(eq(applications.name, String(req.params.appName)))
        .limit(1);
      if (!app) return notFound(res);
      const schema = await repository.getSchemaBySlug(
        String(req.params.schemaSlug),
        app.id,
      );
      if (!schema || schema.isSystem || !acceptsSubmissions(schema.definition))
        return notFound(res);

      const result = validateSubmission(req.body);
      if (!result.ok) {
        return res.status(400).json({ error: { message: result.error } });
      }
      if (!result.spam) {
        await repository.createSystemEntry(
          schema.id,
          result.data,
          app.id,
          DEFAULT_LOCALE,
        );
      }
      return res.status(201).json({ data: { received: true } });
    } catch (error) {
      next(error);
    }
  },
);
