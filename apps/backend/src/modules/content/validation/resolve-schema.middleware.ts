import { Request, Response, NextFunction } from 'express';
import { ContentRepository } from '@repo/repository';
import { NotFoundError } from '@repo/utils';
const repository = new ContentRepository();
/** Resolve schema to request */
export const resolveSchema = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { schemaSlug } = req.params;
    const schema = await repository.getSchemaBySlug(
      schemaSlug as string,
      req.context?.applicationId,
    );
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
