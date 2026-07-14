import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';

/**
 * Parses `req.body` against `schema` and replaces it with the validated
 * (and default-applied/coerced) output. A thrown `ZodError` is forwarded to
 * `next()` rather than handled here — the global error-handling middleware
 * already converts any `ZodError` into a 400 with field-level details, so
 * this stays a one-line adapter instead of duplicating that mapping.
 */
export const validateBody = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};
