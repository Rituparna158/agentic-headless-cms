import { Request, Response, NextFunction } from 'express';
import { ContentService } from './content.service.js';
import { parseContentQuery } from './query/content-query.util.js';
import { eventBus } from '../../common/events/event-bus.js';
import {
  EVENT_NAMES,
  AUDIT_ACTIONS,
} from '../../constants/events.constants.js';
import {
  NotFoundError,
  BadRequestError,
} from '../../common/errors/http-error.js';
import {
  DEFAULT_LOCALE,
  ERROR_MESSAGES,
  HTTP_STATUS,
  type SchemaDefinition,
} from '@repo/shared-types';

const contentService = new ContentService();

export const listEntries = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const schemaId = req.schemaId!;
    const { fields } = req.schema!.definition as SchemaDefinition;
    const locale =
      typeof req.query.locale === 'string' ? req.query.locale : DEFAULT_LOCALE;
    const contentQuery = parseContentQuery(req.query, fields);

    const [entries, total] = await Promise.all([
      contentService.listEntries(schemaId, locale, contentQuery),
      contentService.countEntries(schemaId, locale, contentQuery),
    ]);

    res.status(HTTP_STATUS.OK).json({
      data: entries,
      meta: {
        pagination: {
          page: contentQuery.page,
          pageSize: contentQuery.pageSize,
          total,
          pageCount: Math.ceil(total / contentQuery.pageSize),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEntry = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { entryId } = req.params;
    const locale =
      typeof req.query.locale === 'string' ? req.query.locale : DEFAULT_LOCALE;

    const entry = await contentService.getEntryById(
      entryId as string,
      locale,
      req.schemaId,
    );
    if (!entry) {
      throw new NotFoundError(ERROR_MESSAGES.CONTENT.ENTRY_NOT_FOUND);
    }

    res.status(HTTP_STATUS.OK).json({ data: entry });
  } catch (error) {
    next(error);
  }
};

export const listVersions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { entryId } = req.params;
    const locale =
      typeof req.query.locale === 'string' ? req.query.locale : DEFAULT_LOCALE;

    const versions = await contentService.listEntryVersions(
      entryId as string,
      locale,
    );

    res.status(HTTP_STATUS.OK).json({ data: versions });
  } catch (error) {
    next(error);
  }
};

export const createDraft = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const schemaId = req.schemaId!;
    const locale =
      typeof req.query.locale === 'string' ? req.query.locale : DEFAULT_LOCALE;
    const userId = req.user!.id;

    const entry = await contentService.createDraft(
      schemaId,
      req.body as Record<string, unknown>,
      userId,
      locale,
    );

    eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
      action: AUDIT_ACTIONS.CREATE,
      resourceType: 'content',
      resourceId: entry.id,
      actorUserId: userId,
      afterState: entry,
    });

    res.status(HTTP_STATUS.CREATED).json({ data: entry });
  } catch (error) {
    next(error);
  }
};

export const updateDraft = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { entryId } = req.params;
    const locale =
      typeof req.query.locale === 'string' ? req.query.locale : DEFAULT_LOCALE;
    const userId = req.user!.id;

    const beforeState = await contentService.getEntryById(
      entryId as string,
      locale,
    );

    const entry = await contentService.updateDraft(
      entryId as string,
      req.body as Record<string, unknown>,
      userId,
      locale,
    );

    eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
      action: AUDIT_ACTIONS.UPDATE,
      resourceType: 'content',
      resourceId: entry.id,
      actorUserId: userId,
      beforeState: beforeState,
      afterState: entry,
    });

    res.status(HTTP_STATUS.OK).json({ data: entry });
  } catch (error) {
    next(error);
  }
};

export const publishEntry = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { entryId } = req.params;
    const locale =
      typeof req.query.locale === 'string' ? req.query.locale : DEFAULT_LOCALE;
    const userId = req.user!.id;

    const beforeState = await contentService.getEntryById(
      entryId as string,
      locale,
    );

    const entry = await contentService.publishEntry(
      entryId as string,
      userId,
      locale,
    );

    eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
      action: AUDIT_ACTIONS.PUBLISH,
      resourceType: 'content',
      resourceId: entry.id,
      actorUserId: userId,
      beforeState: beforeState,
      afterState: entry,
    });

    res.status(HTTP_STATUS.OK).json({ data: entry });
  } catch (error) {
    next(error);
  }
};

export const revertEntry = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { entryId } = req.params;
    const locale =
      typeof req.query.locale === 'string' ? req.query.locale : DEFAULT_LOCALE;
    const userId = req.user!.id;
    const versionNo = parseInt(
      (req.body as Record<string, unknown>).versionNo as string,
      10,
    );

    if (isNaN(versionNo)) {
      throw new BadRequestError(ERROR_MESSAGES.CONTENT.INVALID_VERSION_NO);
    }

    const beforeState = await contentService.getEntryById(
      entryId as string,
      locale,
    );

    const entry = await contentService.revertEntry(
      entryId as string,
      versionNo,
      userId,
      locale,
    );

    eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
      action: AUDIT_ACTIONS.ROLLBACK,
      resourceType: 'content',
      resourceId: entry.id,
      actorUserId: userId,
      beforeState: beforeState,
      afterState: entry,
    });

    res.status(HTTP_STATUS.OK).json({ data: entry });
  } catch (error) {
    next(error);
  }
};

export const deleteEntry = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { entryId } = req.params;

    // We fetch without locale to get the base record for audit before deleting
    const beforeState = await contentService.getEntryById(
      entryId as string,
      DEFAULT_LOCALE,
    );

    await contentService.deleteEntry(entryId as string);

    eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
      action: AUDIT_ACTIONS.DELETE,
      resourceType: 'content',
      resourceId: entryId as string,
      actorUserId: req.user?.id, // If req.user exists
      beforeState: beforeState,
    });

    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};
