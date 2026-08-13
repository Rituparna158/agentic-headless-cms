import type { Request, Response, RequestHandler } from 'express';
import type { CreateSchemaInput, UpdateSchemaInput } from '@repo/types';
import { ERROR_MESSAGES } from '@repo/constants';
import { ApiError, ApiResponse, asyncHandler } from '@repo/utils';
import { logger } from '@repo/logger';
import { schemaService } from './schema.service.js';
import {
  parseQueryOptions,
  formatPaginatedResponse,
} from '../../utils/pagination.util.js';

export const createSchema: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('SchemaController: createSchema start');
    if (!req.user) {
      logger.error('SchemaController: unauthorized request');
      throw new ApiError(401, ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED);
    }

    const input = req.body as CreateSchemaInput;
    logger.debug(
      { schemaName: input.name },
      'SchemaController: creating schema',
    );
    const schema = await schemaService.create(input, req.user.id);

    logger.info({ schemaId: schema.id }, 'SchemaController: createSchema end');
    res
      .status(201)
      .json(new ApiResponse(201, schema, 'Schema created successfully'));
  },
);

export const listSchemas: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('SchemaController: listSchemas start');
    logger.debug('SchemaController: fetching schemas');

    const options = parseQueryOptions(req.query);
    const [schemas, total] = await schemaService.list(options);

    logger.info('SchemaController: listSchemas end');
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          formatPaginatedResponse(
            schemas,
            total,
            options.page!,
            options.pageSize!,
          ),
          'Schemas listed successfully',
        ),
      );
  },
);

export const getSchemaBySlug: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { slug } = req.params;
    logger.info({ slug }, 'SchemaController: getSchemaBySlug start');
    if (!req.user) {
      logger.error('SchemaController: unauthorized request');
      throw new ApiError(401, ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED);
    }

    logger.debug({ slug }, 'SchemaController: fetching schema by slug');
    const schema = await schemaService.getBySlug(slug as string);

    logger.info({ slug }, 'SchemaController: getSchemaBySlug end');
    res
      .status(200)
      .json(new ApiResponse(200, schema, 'Schema retrieved successfully'));
  },
);

export const updateSchema: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info({ id }, 'SchemaController: updateSchema start');
    if (!req.user) {
      logger.error('SchemaController: unauthorized request');
      throw new ApiError(401, ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED);
    }

    const input = req.body as UpdateSchemaInput;
    logger.debug({ id }, 'SchemaController: updating schema');
    const schema = await schemaService.update(id as string, input, req.user.id);

    logger.info({ id }, 'SchemaController: updateSchema end');
    res
      .status(200)
      .json(new ApiResponse(200, schema, 'Schema updated successfully'));
  },
);

export const deleteSchema: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info({ id }, 'SchemaController: deleteSchema start');
    if (!req.user) {
      logger.error('SchemaController: unauthorized request');
      throw new ApiError(401, ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED);
    }

    const force = req.query.force === 'true';
    logger.debug({ id, force }, 'SchemaController: deleting schema');
    await schemaService.delete(id as string, force);

    logger.info({ id }, 'SchemaController: deleteSchema end');
    res
      .status(200)
      .json(new ApiResponse(200, null, 'Schema deleted successfully'));
  },
);
