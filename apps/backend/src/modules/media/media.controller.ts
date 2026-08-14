import type { Request, Response, RequestHandler } from 'express';
import { ERROR_MESSAGES } from '@repo/constants';
import { ApiError, ApiResponse, asyncHandler } from '@repo/utils';
import { logger } from '@repo/logger';
import { eventBus } from '@repo/events';
import { EVENT_NAMES } from '@repo/constants';
import { MediaService } from './media.service.js';
import { parseResizeQuery, extractStorageKey } from '@repo/storage';
import { parsePositiveIntParam } from '@repo/utils';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@repo/constants';

const mediaService = new MediaService();

export const uploadMedia: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('MediaController: uploadMedia start');
    if (!req.file) {
      logger.error('MediaController: no file uploaded');
      throw new ApiError(400, ERROR_MESSAGES.MEDIA.NO_FILE_UPLOADED);
    }

    const body = req.body as Record<string, unknown>;
    const altText = typeof body.altText === 'string' ? body.altText : undefined;
    const folderId =
      typeof body.folderId === 'string' ? body.folderId : undefined;

    logger.debug(
      { filename: req.file.originalname },
      'MediaController: uploading file',
    );
    const asset = await mediaService.upload({
      buffer: req.file.buffer,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
      altText,
      folderId,
      actorUserId: req.user!.id,
    });

    logger.debug(
      { assetId: asset.id },
      'MediaController: emitting MEDIA_UPLOADED event',
    );
    eventBus.emit(EVENT_NAMES.MEDIA_UPLOADED, {
      assetId: asset.id,
      storageKey: extractStorageKey(asset),
      mimeType: asset.mimeType,
    });

    logger.info({ assetId: asset.id }, 'MediaController: uploadMedia end');
    res
      .status(201)
      .json(new ApiResponse(201, asset, 'Media uploaded successfully'));
  },
);

export const listMedia: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('MediaController: listMedia start');
    const page = parsePositiveIntParam(req.query.page, 1, 'page');
    const pageSize = Math.min(
      parsePositiveIntParam(req.query.pageSize, DEFAULT_PAGE_SIZE, 'pageSize'),
      MAX_PAGE_SIZE,
    );
    const folderId =
      typeof req.query.folderId === 'string' ? req.query.folderId : undefined;

    logger.debug({ page, pageSize }, 'MediaController: fetching media list');
    const { assets, total } = await mediaService.list({
      page,
      pageSize,
      folderId,
    });

    logger.info('MediaController: listMedia end');
    res.status(200).json(
      new ApiResponse(
        200,
        {
          data: assets,
          meta: {
            pagination: {
              page,
              pageSize,
              total,
              pageCount: Math.ceil(total / pageSize),
            },
          },
        },
        'Media listed successfully',
      ),
    );
  },
);

export const getMedia: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info({ id }, 'MediaController: getMedia start');

    logger.debug({ id }, 'MediaController: fetching media by ID');
    const asset = await mediaService.getById(id as string);

    logger.info({ id }, 'MediaController: getMedia end');
    res
      .status(200)
      .json(new ApiResponse(200, asset, 'Media retrieved successfully'));
  },
);

export const serveMediaFile: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { key } = req.params;
    logger.info({ key }, 'MediaController: serveMediaFile start');

    logger.debug({ key }, 'MediaController: fetching and processing file');
    const asset = await mediaService.getByStorageKey(key as string);
    const resize = parseResizeQuery(req.query);
    const file = await mediaService.getFile(asset, resize);

    res.setHeader('Content-Type', file.mimeType);
    logger.info({ key }, 'MediaController: serveMediaFile end');
    res.status(200).send(file.buffer);
  },
);

export const deleteMedia: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info({ id }, 'MediaController: deleteMedia start');

    logger.debug({ id }, 'MediaController: deleting media');
    await mediaService.delete(id as string);

    logger.info({ id }, 'MediaController: deleteMedia end');
    res.status(204).end();
  },
);

export const deleteBulkMedia: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { ids } = req.body as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, 'ids must be a non-empty array of strings');
    }

    logger.info({ ids }, 'MediaController: deleteBulkMedia start');
    await mediaService.deleteBulk(ids);

    logger.info({ count: ids.length }, 'MediaController: deleteBulkMedia end');
    res.status(204).end();
  },
);
