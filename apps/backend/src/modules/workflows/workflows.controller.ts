import { Request, Response, RequestHandler } from 'express';
import { WorkflowsService } from './workflows.service.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '@repo/constants';
import {
  asyncHandler,
  ApiResponse,
  BadRequestError,
  NotFoundError,
} from '@repo/utils';
import { logger } from '@repo/logger';
import {
  parseQueryOptions,
  formatPaginatedResponse,
} from '../../utils/pagination.util.js';
import {
  createWorkflowValidationSchema,
  updateWorkflowValidationSchema,
} from '@repo/validation';
import type { CreateWorkflowInput, UpdateWorkflowInput } from '@repo/types';

const workflowsService = new WorkflowsService();

export const listWorkflows: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('WorkflowsController: listWorkflows start');
    const options = parseQueryOptions(req.query);
    const [workflows, total] = await workflowsService.list(
      options,
      req.context?.applicationId,
    );
    logger.debug(
      { count: workflows.length, total },
      'WorkflowsController: listWorkflows success',
    );
    res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          formatPaginatedResponse(
            workflows,
            total,
            options.page!,
            options.pageSize!,
          ),
          'Workflows listed successfully',
        ),
      );
  },
);

export const getWorkflow: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    logger.info({ id }, 'WorkflowsController: getWorkflow start');
    const workflow = await workflowsService.getById(
      id,
      req.context?.applicationId,
    );
    if (!workflow) {
      throw new NotFoundError(ERROR_MESSAGES.WORKFLOWS.NOT_FOUND);
    }
    res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          workflow,
          'Workflow retrieved successfully',
        ),
      );
  },
);

export const createWorkflow: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('WorkflowsController: createWorkflow start');
    const parseResult = createWorkflowValidationSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new BadRequestError(
        parseResult.error.issues.map((e) => e.message).join(', '),
      );
    }

    const workflow = await workflowsService.create(
      parseResult.data as CreateWorkflowInput,
      req.context?.applicationId,
    );

    res
      .status(HTTP_STATUS.CREATED)
      .json(
        new ApiResponse(
          HTTP_STATUS.CREATED,
          workflow,
          'Workflow created successfully',
        ),
      );
  },
);

export const updateWorkflow: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    logger.info({ id }, 'WorkflowsController: updateWorkflow start');
    const parseResult = updateWorkflowValidationSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new BadRequestError(
        parseResult.error.issues.map((e) => e.message).join(', '),
      );
    }

    const workflow = await workflowsService.update(
      id,
      parseResult.data as UpdateWorkflowInput,
      req.context?.applicationId,
    );

    res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          workflow,
          'Workflow updated successfully',
        ),
      );
  },
);

export const deleteWorkflow: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    logger.info({ id }, 'WorkflowsController: deleteWorkflow start');
    await workflowsService.delete(id, req.context?.applicationId);
    res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          { id },
          'Workflow deleted successfully',
        ),
      );
  },
);

export const assignWorkflowToSchema: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const schemaId = req.params.schemaId as string;
    logger.info(
      { workflowId: id, schemaId },
      'WorkflowsController: assignWorkflowToSchema start',
    );
    await workflowsService.assignToSchema(
      id,
      schemaId,
      req.context?.applicationId,
    );
    res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          { workflowId: id, schemaId },
          'Workflow assigned to schema successfully',
        ),
      );
  },
);

export const removeWorkflowFromSchema: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const schemaId = req.params.schemaId as string;
    logger.info(
      { schemaId },
      'WorkflowsController: removeWorkflowFromSchema start',
    );
    await workflowsService.removeFromSchema(
      schemaId,
      req.context?.applicationId,
    );
    res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          { schemaId },
          'Workflow removed from schema successfully',
        ),
      );
  },
);

export const getWorkflowBySchema: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const schemaId = req.params.schemaId as string;
    logger.info({ schemaId }, 'WorkflowsController: getWorkflowBySchema start');
    const workflow = await workflowsService.getWorkflowBySchemaId(
      schemaId,
      req.context?.applicationId,
    );
    if (!workflow) {
      throw new NotFoundError('No workflow found for this schema');
    }
    res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          workflow,
          'Workflow for schema retrieved successfully',
        ),
      );
  },
);

export const getWorkflowSchemas: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    logger.info({ id }, 'WorkflowsController: getWorkflowSchemas start');
    const schemas = await workflowsService.getAssignedSchemas(
      id,
      req.context?.applicationId,
    );
    res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          schemas,
          'Assigned schemas retrieved successfully',
        ),
      );
  },
);
