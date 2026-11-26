import { Request, Response, RequestHandler } from 'express';
import { WebhooksService } from './webhooks.service.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '@repo/constants';
import { asyncHandler, BadRequestError, ApiResponse } from '@repo/utils';
import { logger } from '@repo/logger';
import {
  parseQueryOptions,
  formatPaginatedResponse,
} from '../../utils/pagination.util.js';
const webhooksService = new WebhooksService();
export const listWebhooks: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('WebhooksController: listWebhooks start');
    const options = parseQueryOptions(req.query);
    const [webhooks, total] = await webhooksService.list(
      options,
      req.context?.applicationId,
    );
    logger.debug(
      { count: webhooks.length, total },
      'WebhooksController: listWebhooks success',
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          formatPaginatedResponse(
            webhooks,
            total,
            options.page!,
            options.pageSize!,
          ),
          'Webhooks listed successfully',
        ),
      );
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
    const webhook = await webhooksService.create(
      body,
      req.context?.applicationId,
    );
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
    await webhooksService.delete(id as string, req.context?.applicationId);
    logger.debug({ id }, 'WebhooksController: deleteWebhook success');
    res.status(HTTP_STATUS.NO_CONTENT).send();
  },
);

export const testWebhook: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info({ id }, 'WebhooksController: testWebhook start');
    const result = await webhooksService.test(
      id as string,
      req.context?.applicationId,
    );
    logger.debug({ id, result }, 'WebhooksController: testWebhook success');
    res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          result,
          'Webhook test executed successfully',
        ),
      );
  },
);

export const listWebhookDeliveries: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info({ id }, 'WebhooksController: listWebhookDeliveries start');
    const deliveries = await webhooksService.listDeliveries(
      id as string,
      req.context?.applicationId,
    );
    logger.debug(
      { id, count: deliveries.length },
      'WebhooksController: listWebhookDeliveries success',
    );
    res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          deliveries,
          'Webhook deliveries fetched successfully',
        ),
      );
  },
);

export const listDlqDeliveries: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info({ id }, 'WebhooksController: listDlqDeliveries start');
    const dlq = await webhooksService.listDlq(
      id as string,
      req.context?.applicationId,
    );
    res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          dlq,
          'DLQ deliveries fetched successfully',
        ),
      );
  },
);

export const retryWebhookDelivery: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { deliveryId } = req.params;
    logger.info(
      { deliveryId },
      'WebhooksController: retryWebhookDelivery start',
    );
    const result = await webhooksService.retryDelivery(deliveryId as string);
    res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          result,
          'Webhook delivery retried successfully',
        ),
      );
  },
);

export const replayWebhookDelivery: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { deliveryId } = req.params;
    logger.info(
      { deliveryId },
      'WebhooksController: replayWebhookDelivery start',
    );
    const result = await webhooksService.replayDelivery(deliveryId as string);
    res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          result,
          'Webhook delivery replayed successfully',
        ),
      );
  },
);

export const processWebhookRetries: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('WebhooksController: processWebhookRetries start');
    const result = await webhooksService.processRetries();
    res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          result,
          'Webhook retries processed successfully',
        ),
      );
  },
);
