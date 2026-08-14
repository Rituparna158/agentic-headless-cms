import { Request, Response, RequestHandler } from 'express';
import { ContentService } from './content.service.js';
import { parseContentQuery } from './query/content-query.util.js';
import { logger } from '@repo/logger';
import { asyncHandler, ApiResponse, ApiError } from '@repo/utils';
import { DEFAULT_LOCALE, ERROR_MESSAGES } from '@repo/constants';
import type { SchemaDefinition } from '@repo/types';

const contentService = new ContentService();

export const listEntries: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const schemaId = req.schemaId!;
    logger.info({ schemaId }, 'ContentController: listEntries start');

    const { fields } = req.schema!.definition as SchemaDefinition;
    const locale =
      typeof req.query.locale === 'string' ? req.query.locale : DEFAULT_LOCALE;
    const contentQuery = parseContentQuery(req.query, fields);

    logger.debug(
      { schemaId, locale, page: contentQuery.page },
      'ContentController: fetching entries and count',
    );
    const [entries, total] = await Promise.all([
      contentService.listEntries(schemaId, locale, contentQuery),
      contentService.countEntries(schemaId, locale, contentQuery),
    ]);

    logger.info({ schemaId }, 'ContentController: listEntries end');
    res.status(200).json(
      new ApiResponse(
        200,
        {
          data: entries,
          meta: {
            pagination: {
              page: contentQuery.page,
              pageSize: contentQuery.pageSize,
              total,
              pageCount: Math.ceil(total / contentQuery.pageSize),
            },
          },
        },
        'Entries listed successfully',
      ),
    );
  },
);

export const getEntry: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { entryId } = req.params;
    logger.info({ entryId }, 'ContentController: getEntry start');

    const locale =
      typeof req.query.locale === 'string' ? req.query.locale : DEFAULT_LOCALE;

    logger.debug(
      { entryId, locale },
      'ContentController: fetching entry by ID',
    );
    const entry = await contentService.getEntryById(
      entryId as string,
      locale,
      req.schemaId,
    );
    if (!entry) {
      logger.error({ entryId }, 'ContentController: entry not found');
      throw new ApiError(404, ERROR_MESSAGES.CONTENT.ENTRY_NOT_FOUND);
    }

    logger.info({ entryId }, 'ContentController: getEntry end');
    res
      .status(200)
      .json(new ApiResponse(200, entry, 'Entry retrieved successfully'));
  },
);

export const listVersions: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { entryId } = req.params;
    logger.info({ entryId }, 'ContentController: listVersions start');

    const locale =
      typeof req.query.locale === 'string' ? req.query.locale : DEFAULT_LOCALE;

    logger.debug(
      { entryId, locale },
      'ContentController: fetching entry versions',
    );
    const versions = await contentService.listEntryVersions(
      entryId as string,
      locale,
    );

    logger.info({ entryId }, 'ContentController: listVersions end');
    res
      .status(200)
      .json(
        new ApiResponse(200, versions, 'Entry versions listed successfully'),
      );
  },
);

export const createDraft: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const schemaId = req.schemaId!;
    logger.info({ schemaId }, 'ContentController: createDraft start');

    const locale =
      typeof req.query.locale === 'string' ? req.query.locale : DEFAULT_LOCALE;
    const userId = req.user!.id;

    logger.debug({ schemaId, userId }, 'ContentController: creating draft');
    const entry = await contentService.createDraft(
      schemaId,
      req.body as Record<string, unknown>,
      userId,
      locale,
    );

    logger.info(
      { schemaId, entryId: entry.id },
      'ContentController: createDraft end',
    );
    res
      .status(201)
      .json(new ApiResponse(201, entry, 'Draft created successfully'));
  },
);

export const updateDraft: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { entryId } = req.params;
    logger.info({ entryId }, 'ContentController: updateDraft start');

    const locale =
      typeof req.query.locale === 'string' ? req.query.locale : DEFAULT_LOCALE;
    const userId = req.user!.id;

    logger.debug({ entryId, userId }, 'ContentController: updating draft');
    const entry = await contentService.updateDraft(
      entryId as string,
      req.body as Record<string, unknown>,
      userId,
      locale,
    );

    logger.info({ entryId }, 'ContentController: updateDraft end');
    res
      .status(200)
      .json(new ApiResponse(200, entry, 'Draft updated successfully'));
  },
);

export const updatePartialEntry: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { entryId } = req.params;
    logger.info({ entryId }, 'ContentController: updatePartialEntry start');

    const locale =
      typeof req.query.locale === 'string' ? req.query.locale : DEFAULT_LOCALE;
    const userId = req.user!.id;

    logger.debug(
      { entryId, userId },
      'ContentController: partially updating entry',
    );
    const entry = await contentService.updatePartial(
      entryId as string,
      req.body as Record<string, unknown>,
      userId,
      locale,
    );

    logger.info({ entryId }, 'ContentController: updatePartialEntry end');
    res
      .status(200)
      .json(
        new ApiResponse(200, entry, 'Entry partially updated successfully'),
      );
  },
);

export const publishEntry: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { entryId } = req.params;
    logger.info({ entryId }, 'ContentController: publishEntry start');

    const locale =
      typeof req.query.locale === 'string' ? req.query.locale : DEFAULT_LOCALE;
    const userId = req.user!.id;

    logger.debug({ entryId, userId }, 'ContentController: publishing entry');
    const entry = await contentService.publishEntry(
      entryId as string,
      userId,
      locale,
    );

    logger.info({ entryId }, 'ContentController: publishEntry end');
    res
      .status(200)
      .json(new ApiResponse(200, entry, 'Entry published successfully'));
  },
);

export const revertEntry: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { entryId } = req.params;
    logger.info({ entryId }, 'ContentController: revertEntry start');

    const locale =
      typeof req.query.locale === 'string' ? req.query.locale : DEFAULT_LOCALE;
    const userId = req.user!.id;
    const versionNo = parseInt(
      (req.body as Record<string, unknown>).versionNo as string,
      10,
    );

    if (isNaN(versionNo)) {
      logger.error('ContentController: invalid version number');
      throw new ApiError(400, ERROR_MESSAGES.CONTENT.INVALID_VERSION_NO);
    }

    logger.debug({ entryId, versionNo }, 'ContentController: reverting entry');
    const entry = await contentService.revertEntry(
      entryId as string,
      versionNo,
      userId,
      locale,
    );

    logger.info({ entryId }, 'ContentController: revertEntry end');
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          entry,
          `Reverted to version ${versionNo} successfully`,
        ),
      );
  },
);

export const deleteEntry: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { entryId } = req.params;
    logger.info({ entryId }, 'ContentController: deleteEntry start');

    logger.debug({ entryId }, 'ContentController: deleting entry');
    await contentService.deleteEntry(entryId as string);

    logger.info({ entryId }, 'ContentController: deleteEntry end');
    res.status(204).end();
  },
);
