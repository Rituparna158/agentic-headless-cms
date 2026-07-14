import { Request, Response, NextFunction } from 'express';
import { ContentRepository } from '../content.repository.js';
import { SchemaDefinition, compileZodSchema } from '@repo/shared-types';
import { NotFoundError } from '../../../common/errors/http-error.js';

const repository = new ContentRepository();

export const validateContentPayload = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { schemaSlug } = req.params;

    // 1. Fetch schema definition from DB
    const schema = await repository.getSchemaBySlug(schemaSlug as string);
    if (!schema) {
      throw new NotFoundError(
        `Schema with slug '${schemaSlug as string}' not found.`,
      );
    }

    // 2. Compile dynamic Zod schema
    const zodSchema = compileZodSchema(schema.definition as SchemaDefinition);

    // 3. Attach the schema ID to the request object
    (req as unknown as { schemaId: string }).schemaId = schema.id;

    // 4. Validate request body against Zod schema (only for POST/PUT)
    if (req.method === 'POST' || req.method === 'PUT') {
      const validatedData = zodSchema.parse(req.body);
      req.body = validatedData;
    }

    next();
  } catch (error) {
    next(error);
  }
};
