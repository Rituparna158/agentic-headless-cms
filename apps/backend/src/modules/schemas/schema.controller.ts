import type { Request, Response, NextFunction } from 'express';
import type { CreateSchemaInput, UpdateSchemaInput } from '@repo/shared-types';
import { HTTP_STATUS, ERROR_MESSAGES } from '@repo/shared-types';
import { schemaService } from './schema.service.js';

export const createSchema = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ error: ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED });
      return;
    }
    // Already validated/defaulted by the validateBody(createSchemaSchema)
    // middleware ahead of this handler.
    const input = req.body as CreateSchemaInput;
    const schema = await schemaService.create(input, req.user.id);
    res.status(HTTP_STATUS.CREATED).json(schema);
  } catch (error) {
    next(error);
  }
};

export const listSchemas = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const schemas = await schemaService.list();
    res.json(schemas);
  } catch (error) {
    next(error);
  }
};

export const updateSchema = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ error: ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED });
      return;
    }
    const input = req.body as UpdateSchemaInput;
    const schema = await schemaService.update(
      req.params.id as string,
      input,
      req.user.id,
    );
    res.json(schema);
  } catch (error) {
    next(error);
  }
};
