import { Router } from 'express';
import {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  listUsers,
  listTokens,
  createToken,
  revokeToken,
  inviteUser,
  deleteUser,
  updateUserRole,
  listMfaRequests,
  approveMfaResetRequest,
  rejectMfaResetRequest,
} from './access.controller.js';
import { authenticateToken, requireAdminOrSupport } from '@repo/middlewares';
import { requirePermission } from '../auth/rbac.middleware.js';
import { schemaService } from '../schemas/schema.service.js';
import type { Request, Response, NextFunction } from 'express';

export const accessRouter = Router();

accessRouter.use(authenticateToken);

const requireSystemPermission = (action: string, schemaSlug: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = await schemaService.getBySlug(schemaSlug);
      return requirePermission(action, schema.id)(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// Roles
accessRouter.get(
  '/roles',
  requireSystemPermission('read', 'system-roles'),
  listRoles,
);
accessRouter.post(
  '/roles',
  requireSystemPermission('create', 'system-roles'),
  createRole,
);
accessRouter.get(
  '/roles/:id',
  requireSystemPermission('read', 'system-roles'),
  getRole,
);
accessRouter.put(
  '/roles/:id',
  requireSystemPermission('update', 'system-roles'),
  updateRole,
);
accessRouter.delete(
  '/roles/:id',
  requireSystemPermission('delete', 'system-roles'),
  deleteRole,
);

// Users
accessRouter.get(
  '/users',
  requireSystemPermission('read', 'system-users'),
  listUsers,
);
accessRouter.post(
  '/users/invite',
  requireSystemPermission('create', 'system-users'),
  inviteUser,
);
accessRouter.delete(
  '/users/:id',
  requireSystemPermission('delete', 'system-users'),
  deleteUser,
);
accessRouter.patch(
  '/users/:id/role',
  requireSystemPermission('update', 'system-users'),
  updateUserRole,
);

// Tokens
accessRouter.get(
  '/tokens',
  requireSystemPermission('read', 'system-users'),
  listTokens,
);
accessRouter.post(
  '/tokens',
  requireSystemPermission('create', 'system-users'),
  createToken,
);
accessRouter.delete(
  '/tokens/:id',
  requireSystemPermission('delete', 'system-users'),
  revokeToken,
);

// MFA Admin routes
accessRouter.get('/mfa-requests', requireAdminOrSupport, listMfaRequests);
accessRouter.post(
  '/mfa-requests/:id/approve',
  requireAdminOrSupport,
  approveMfaResetRequest,
);
accessRouter.post(
  '/mfa-requests/:id/reject',
  requireAdminOrSupport,
  rejectMfaResetRequest,
);
