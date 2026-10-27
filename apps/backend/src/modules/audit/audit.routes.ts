import { Router } from 'express';
import { authenticateToken, requireAdmin } from '@repo/middlewares';
import { listAuditLogs, getAuditLog } from './audit.controller.js';

export const auditRouter = Router();

auditRouter.use(authenticateToken);
auditRouter.use(requireAdmin);

auditRouter.get('/', listAuditLogs);
auditRouter.get('/:id', getAuditLog);
