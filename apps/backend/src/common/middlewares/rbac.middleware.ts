import type { Request, Response, NextFunction } from 'express';
import { authService } from '../../modules/auth/auth.service.js';
import { ERROR_MESSAGES, HTTP_STATUS } from '@repo/shared-types';

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

      // Check if any of the user's permissions grant access to the action
      const hasPermission = permissions.some(
        (p: { action: string; schemaId: string | null; effect: string }) => {
          const actionMatches = p.action === action || p.action === '*';
          const schemaMatches =
            !schemaId || p.schemaId === null || p.schemaId === schemaId;
          const effectAllows = p.effect === 'allow';
          return actionMatches && schemaMatches && effectAllows;
        },
      );

      if (!hasPermission) {
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
