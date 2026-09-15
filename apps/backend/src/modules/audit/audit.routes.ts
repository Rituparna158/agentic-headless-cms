import { Router } from 'express';
import { authenticateToken } from '@repo/middlewares';
import { requirePermission } from '../auth/rbac.middleware.js';
import { listAuditLogs, getAuditLog } from './audit.controller.js';

export const auditRouter = Router();

auditRouter.get(
  '/',
  authenticateToken,
  requirePermission('read'),
  listAuditLogs,
);

auditRouter.get(
  '/:id',
  authenticateToken,
  requirePermission('read'),
  getAuditLog,
);
