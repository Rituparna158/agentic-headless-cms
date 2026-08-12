import { Request, Response, RequestHandler } from 'express';
import { LocalesService } from './locales.service.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '@repo/constants';
import { asyncHandler, ApiResponse } from '@repo/utils';
import { logger } from '@repo/logger';
import {
  parseQueryOptions,
  formatPaginatedResponse,
} from '../../utils/pagination.util.js';
const localesService = new LocalesService();

export const listLocales: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('LocalesController: listLocales start');

    const options = parseQueryOptions(req.query);
    const [locales, total] = await localesService.list(options);

    logger.debug(
      { count: locales.length, total },
      'LocalesController: listLocales success',
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          formatPaginatedResponse(
            locales,
            total,
            options.page!,
            options.pageSize!,
          ),
          'Locales listed successfully',
        ),
      );
  },
);

export const createLocale: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as {
      code: string;
      name: string;
      isDefault?: boolean;
    };
    logger.info({ code: body.code }, 'LocalesController: createLocale start');

    if (!body.code || !body.name) {
      logger.warn('LocalesController: createLocale missing code or name');
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: { message: ERROR_MESSAGES.LOCALES.CODE_NAME_REQUIRED },
      });
      return;
    }

    try {
      const locale = await localesService.create(body);
      logger.debug(
        { id: locale!.id },
        'LocalesController: createLocale success',
      );
      res
        .status(HTTP_STATUS.CREATED)
        .json(new ApiResponse(201, locale, 'Locale created successfully'));
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message === ERROR_MESSAGES.LOCALES.CODE_ALREADY_EXISTS
      ) {
        res.status(HTTP_STATUS.CONFLICT).json({
          error: { message: ERROR_MESSAGES.LOCALES.CODE_ALREADY_EXISTS },
        });
        return;
      }
      throw error;
    }
  },
);

export const deleteLocale: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info({ id }, 'LocalesController: deleteLocale start');
    await localesService.delete(id as string);
    logger.debug({ id }, 'LocalesController: deleteLocale success');
    res.status(HTTP_STATUS.NO_CONTENT).send();
  },
);
