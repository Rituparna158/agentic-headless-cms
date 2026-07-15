import type { Request, Response, NextFunction } from 'express';
import { authService } from '../../modules/auth/auth.service.js';
import { ERROR_MESSAGES, HTTP_STATUS } from '@repo/shared-types';
import { hasPermission } from '../../utils/rbac.util.js';

export const requirePermission = (action: string, schemaId?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ error: ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED });
      return;
    }

    try {
      const permissions = await authService.getUserPermissions(req.user.id);

      if (!hasPermission(permissions, action, schemaId)) {
        res
          .status(HTTP_STATUS.FORBIDDEN)
          .json({ error: ERROR_MESSAGES.RBAC.FORBIDDEN });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
