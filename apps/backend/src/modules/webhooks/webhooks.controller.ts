import { Request, Response, NextFunction } from 'express';
import { WebhooksService } from './webhooks.service.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '@repo/shared-types';

const webhooksService = new WebhooksService();

export const listWebhooks = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const webhooks = await webhooksService.list();
    res.json(webhooks);
  } catch (error) {
    next(error);
  }
};

export const createWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body as {
      name: string;
      url: string;
      events: string[];
      isActive?: boolean;
    };

    if (!body.name || !body.url || !body.events?.length) {
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ error: ERROR_MESSAGES.WEBHOOKS.NAME_URL_EVENTS_REQUIRED });
      return;
    }

    const webhook = await webhooksService.create(body);
    res.status(HTTP_STATUS.CREATED).json(webhook);
  } catch (error) {
    next(error);
  }
};

export const deleteWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await webhooksService.delete(req.params.id as string);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};
