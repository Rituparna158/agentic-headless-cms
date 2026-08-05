import { Request, Response, RequestHandler } from 'express';
import { WebhooksService } from './webhooks.service.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '@repo/constants';
import { asyncHandler, BadRequestError, ApiResponse } from '@repo/utils';
import { logger } from '@repo/logger';

const webhooksService = new WebhooksService();

export const listWebhooks: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('WebhooksController: listWebhooks start');
    const webhooks = await webhooksService.list();
    logger.debug(
      { count: webhooks.length },
      'WebhooksController: listWebhooks success',
    );
    res
      .status(200)
      .json(new ApiResponse(200, webhooks, 'Webhooks listed successfully'));
  },
);

export const createWebhook: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as {
      name: string;
      url: string;
      events: string[];
      isActive?: boolean;
    };
    logger.info(
      { name: body.name, url: body.url },
      'WebhooksController: createWebhook start',
    );

    if (!body.name || !body.url || !body.events?.length) {
      logger.warn('WebhooksController: createWebhook missing required fields');
      throw new BadRequestError(
        ERROR_MESSAGES.WEBHOOKS.NAME_URL_EVENTS_REQUIRED,
      );
    }

    const webhook = await webhooksService.create(body);
    logger.debug(
      { id: webhook!.id },
      'WebhooksController: createWebhook success',
    );
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(201, webhook, 'Webhook created successfully'));
  },
);

export const deleteWebhook: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info({ id }, 'WebhooksController: deleteWebhook start');
    await webhooksService.delete(id as string);
    logger.debug({ id }, 'WebhooksController: deleteWebhook success');
    res.status(HTTP_STATUS.NO_CONTENT).send();
  },
);
