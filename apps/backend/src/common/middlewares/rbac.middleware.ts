import type { Request, Response, NextFunction } from 'express';
import { authService } from '../../modules/auth/auth.service.js';
import { ERROR_MESSAGES, HTTP_STATUS } from '@repo/shared-types';

export interface Permission {
  action: string;
  schemaId: string | null;
  effect: string;
}

/**
 * Pure permission check, shared by the Express `requirePermission`
 * middleware below and the GraphQL resolvers (`graphql.context.ts`) — RBAC
 * is exactly the kind of logic that must never drift between two transport
 * layers exposing the same content operations.
 */
export function hasPermission(
  permissions: Permission[],
  action: string,
  schemaId?: string,
): boolean {
  return permissions.some((p) => {
    const actionMatches = p.action === action || p.action === '*';
    const schemaMatches =
      !schemaId || p.schemaId === null || p.schemaId === schemaId;
    const effectAllows = p.effect === 'allow';
    return actionMatches && schemaMatches && effectAllows;
  });
}

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
