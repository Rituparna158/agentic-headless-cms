import { Request, Response, NextFunction } from 'express';
import { LocalesService } from './locales.service.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '@repo/shared-types';

const localesService = new LocalesService();

export const listLocales = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const locales = await localesService.list();
    res.json(locales);
  } catch (error) {
    next(error);
  }
};

export const createLocale = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body as {
      code: string;
      name: string;
      isDefault?: boolean;
    };

    if (!body.code || !body.name) {
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ error: ERROR_MESSAGES.LOCALES.CODE_NAME_REQUIRED });
      return;
    }

    const locale = await localesService.create(body);
    res.status(HTTP_STATUS.CREATED).json(locale);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message === ERROR_MESSAGES.LOCALES.CODE_ALREADY_EXISTS
    ) {
      res
        .status(HTTP_STATUS.CONFLICT)
        .json({ error: ERROR_MESSAGES.LOCALES.CODE_ALREADY_EXISTS });
      return;
    }
    next(error);
  }
};

export const deleteLocale = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await localesService.delete(req.params.id as string);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};
