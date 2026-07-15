import { Request, Response, NextFunction } from 'express';
import { SchemaDefinition, compileZodSchema } from '@repo/shared-types';

/**
 * Validates req.body against the schema resolved by resolveSchema
 * (registered ahead of this middleware on every content route), which is
 * why this no longer fetches the schema itself.
 */
export const validateContentPayload = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const zodSchema = compileZodSchema(
      req.schema!.definition as SchemaDefinition,
    );
    const validatedData = zodSchema.parse(req.body);
    req.body = validatedData;

    next();
  } catch (error) {
    next(error);
  }
};
