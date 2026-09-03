import type { Request, Response, RequestHandler } from 'express';
import { auditService } from './audit.service.js';
import { asyncHandler, ApiResponse } from '@repo/utils';
import { logger } from '@repo/logger';
import type { GetAuditLogsQuery } from '@repo/types';

export const listAuditLogs: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info({ query: req.query }, 'AuditController: listAuditLogs start');

    const limit = req.query.limit
      ? Number(req.query.limit)
      : req.query.pageSize
        ? Number(req.query.pageSize)
        : 20;

    const query: GetAuditLogsQuery = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit,
      action: req.query.action as string | undefined,
      resourceType: req.query.resourceType as string | undefined,
      actorUserId: req.query.actorUserId as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      search: (req.query.search || req.query.searchQuery) as string | undefined,
    };

    const result = await auditService.list(query);
    logger.debug(
      { count: result.data.length, total: result.total },
      'AuditController: listAuditLogs success',
    );

    res
      .status(200)
      .json(new ApiResponse(200, result, 'Audit logs retrieved successfully'));
  },
);

export const getAuditLog: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info({ id }, 'AuditController: getAuditLog start');

    const log = await auditService.getById(id as string);
    logger.debug({ id: log.id }, 'AuditController: getAuditLog success');

    res
      .status(200)
      .json(new ApiResponse(200, log, 'Audit log retrieved successfully'));
  },
);
