import { Request, Response, NextFunction } from 'express';
import { ContentRepository } from '../content.repository.js';
import { NotFoundError } from '../../../common/errors/http-error.js';

const repository = new ContentRepository();

/**
 * Resolves `:schemaSlug` to a schema record exactly once per request and
 * attaches it as `req.schema`/`req.schemaId`. Every content route needs
 * this — GET routes need `schemaId` to scope queries, POST/PUT additionally
 * need the full `definition` to compile a validator. Centralizing the
 * lookup here means `validateContentPayload` no longer has to re-fetch the
 * schema itself, and GET routes (which previously read `req.schemaId` as
 * `undefined` — nothing upstream of them ever set it) now get real scoping.
 */
export const resolveSchema = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { schemaSlug } = req.params;
    const schema = await repository.getSchemaBySlug(schemaSlug as string);

    if (!schema) {
      throw new NotFoundError(
        `Schema with slug '${schemaSlug as string}' not found.`,
      );
    }

    req.schema = schema;
    req.schemaId = schema.id;
    next();
  } catch (error) {
    next(error);
  }
};
