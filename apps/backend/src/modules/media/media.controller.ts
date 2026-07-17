import type { Request, Response, NextFunction } from 'express';
import { ERROR_MESSAGES, HTTP_STATUS } from '@repo/shared-types';
import { BadRequestError } from '../../common/errors/http-error.js';
import { MediaService } from './media.service.js';
import { parseResizeQuery } from './image-processing.js';
import { eventBus } from '../../common/events/event-bus.js';
import { parsePositiveIntParam } from '../../utils/pagination.util.js';
import { extractStorageKey } from '../../utils/media.util.js';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '../../constants/media.constants.js';
import {
  EVENT_NAMES,
  AUDIT_ACTIONS,
} from '../../constants/events.constants.js';
const mediaService = new MediaService();
export const uploadMedia = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      throw new BadRequestError(ERROR_MESSAGES.MEDIA.NO_FILE_UPLOADED);
    }

    const body = req.body as Record<string, unknown>;
    const altText = typeof body.altText === 'string' ? body.altText : undefined;
    const folderId =
      typeof body.folderId === 'string' ? body.folderId : undefined;

    const asset = await mediaService.upload({
      buffer: req.file.buffer,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
      altText,
      folderId,
      actorUserId: req.user!.id,
    });

    eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
      action: AUDIT_ACTIONS.CREATE,
      resourceType: 'media',
      resourceId: asset.id,
      actorUserId: req.user!.id,
      afterState: asset,
    });

    // Thumbnail generation happens off-thread, in a queue worker (see
    // queues/media.worker.ts) — the upload response doesn't wait on it.
    eventBus.emit(EVENT_NAMES.MEDIA_UPLOADED, {
      assetId: asset.id,
      storageKey: extractStorageKey(asset),
      mimeType: asset.mimeType,
    });

    res.status(HTTP_STATUS.CREATED).json({ data: asset });
  } catch (error) {
    next(error);
  }
};

export const listMedia = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = parsePositiveIntParam(req.query.page, 1, 'page');
    const pageSize = Math.min(
      parsePositiveIntParam(req.query.pageSize, DEFAULT_PAGE_SIZE, 'pageSize'),
      MAX_PAGE_SIZE,
    );
    const folderId =
      typeof req.query.folderId === 'string' ? req.query.folderId : undefined;

    const { assets, total } = await mediaService.list({
      page,
      pageSize,
      folderId,
    });

    res.status(HTTP_STATUS.OK).json({
      data: assets,
      meta: {
        pagination: {
          page,
          pageSize,
          total,
          pageCount: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMedia = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const asset = await mediaService.getById(req.params.id as string);
    res.status(HTTP_STATUS.OK).json({ data: asset });
  } catch (error) {
    next(error);
  }
};

export const serveMediaFile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const asset = await mediaService.getByStorageKey(req.params.key as string);
    const resize = parseResizeQuery(req.query);
    const file = await mediaService.getFile(asset, resize);

    res.setHeader('Content-Type', file.mimeType);
    res.status(HTTP_STATUS.OK).send(file.buffer);
  } catch (error) {
    next(error);
  }
};

export const deleteMedia = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const asset = await mediaService.getById(req.params.id as string);

    await mediaService.delete(req.params.id as string);

    eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
      action: AUDIT_ACTIONS.DELETE,
      resourceType: 'media',
      resourceId: req.params.id as string,
      actorUserId: req.user?.id,
      beforeState: asset,
    });

    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};
