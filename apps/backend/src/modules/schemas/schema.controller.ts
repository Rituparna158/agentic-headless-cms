import type { Request, Response, NextFunction } from 'express';
import type { CreateSchemaInput, UpdateSchemaInput } from '@repo/shared-types';
import { HTTP_STATUS, ERROR_MESSAGES } from '@repo/shared-types';
import { UnauthorizedError } from '../../common/errors/http-error.js';
import { schemaService } from './schema.service.js';
import { eventBus } from '../../common/events/event-bus.js';
import {
  EVENT_NAMES,
  AUDIT_ACTIONS,
} from '../../constants/events.constants.js';

export const createSchema = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError(ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED);
    }
    // Already validated/defaulted by the validateBody(createSchemaSchema)
    // middleware ahead of this handler.
    const input = req.body as CreateSchemaInput;
    const schema = await schemaService.create(input, req.user.id);

    eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
      action: AUDIT_ACTIONS.CREATE,
      resourceType: 'schema',
      resourceId: schema.id,
      actorUserId: req.user.id,
      afterState: schema,
    });

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
      throw new UnauthorizedError(ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED);
    }

    const id = req.params.id as string;
    const beforeState = await schemaService.getById(id);

    const input = req.body as UpdateSchemaInput;
    const schema = await schemaService.update(id, input, req.user.id);

    eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
      action: AUDIT_ACTIONS.SCHEMA_CHANGE,
      resourceType: 'schema',
      resourceId: schema.id,
      actorUserId: req.user.id,
      beforeState: beforeState,
      afterState: schema,
    });

    res.json(schema);
  } catch (error) {
    next(error);
  }
};
