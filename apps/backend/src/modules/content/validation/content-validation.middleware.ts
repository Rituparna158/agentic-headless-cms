import { Request, Response, NextFunction } from 'express';
import type { SchemaDefinition } from '@repo/types';
import { compileZodSchema } from '@repo/validation';

/** Validate request body */
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
